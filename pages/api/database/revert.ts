// pages/api/database/revert.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import * as jose from "jose";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

const SYSTEM_TIME_MAX = "2038-01-19 03:14:07.999999";

const ALLOWED_TABLES = {
  Active: {
    table: "Active",
    idColumn: "id",
    nameColumn: "name",
  },
  FatherSpace: {
    table: "FatherSpace",
    idColumn: "id",
    nameColumn: "name",
  },
  Category: {
    table: "Category",
    idColumn: "id",
    nameColumn: "name",
  },
} as const;

type AllowedTable = keyof typeof ALLOWED_TABLES;
type PrismaClientOrTx = typeof db | Parameters<Parameters<typeof db["$transaction"]>[0]>[0];

interface RevertItem {
  table: string;
  id: string;
  timestamp: string;
}

interface RevertBody {
  groupId?: string;
  items?: RevertItem[];
  // Suporte legado para item único
  table?: string;
  id?: string;
  timestamp?: string;

  // QUICK = popup de 10 segundos | HISTORY = Settings
  mode?: "QUICK" | "HISTORY";
}

interface HistoryRow {
  id: string;
  name?: string | null;
  ROW_START: Date;
  ROW_END: Date;
  [key: string]: unknown;
}

function isValidTable(table: string): table is AllowedTable {
  return Object.prototype.hasOwnProperty.call(ALLOWED_TABLES, table);
}

function isValidTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !Number.isNaN(date.getTime());
}

function quoteTable(table: string) {
  return `\`${table}\``;
}

function quoteColumn(column: string) {
  return `\`${column}\``;
}

async function authenticate(req: NextApiRequest) {
  const token =
    req.cookies.auth_token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET_MISSING");
  }

  const secret = new TextEncoder().encode(JWT_SECRET);

  const { payload } = await jose.jwtVerify(token, secret);

  const decoded = payload as {
    role?: string;
    id?: string;
    userId?: string;
    sub?: string;
  };

  const userId = decoded.id || decoded.userId || decoded.sub;

  if (!userId || userId === "undefined") {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    userId: String(userId),
    role: decoded.role,
  };
}

async function getHistoricalState(
  config: (typeof ALLOWED_TABLES)[AllowedTable],
  id: string,
  timestamp: string,
  client: PrismaClientOrTx = db
) {
  const rows = await client.$queryRawUnsafe<Record<string, unknown>[]>(
    `
      SELECT *
      FROM ${quoteTable(config.table)}
      FOR SYSTEM_TIME AS OF TIMESTAMP ?
      WHERE ${quoteColumn(config.idColumn)} = ?
      LIMIT 1
    `,
    timestamp,
    id
  );

  return rows[0] || null;
}

async function getCurrentState(
  config: (typeof ALLOWED_TABLES)[AllowedTable],
  id: string,
  client: PrismaClientOrTx = db
) {
  const rows = await client.$queryRawUnsafe<Record<string, unknown>[]>(
    `
      SELECT *
      FROM ${quoteTable(config.table)}
      WHERE ${quoteColumn(config.idColumn)} = ?
      LIMIT 1
    `,
    id
  );

  return rows[0] || null;
}

async function restoreDeletedRecord(
  config: (typeof ALLOWED_TABLES)[AllowedTable],
  historical: Record<string, unknown>,
  client: PrismaClientOrTx = db
) {
  const protectedColumns = new Set([
    "ROW_START",
    "ROW_END",
    "row_start",
    "row_end",
  ]);

  const columns = Object.keys(historical).filter(
    (column) => !protectedColumns.has(column)
  );

  const placeholders = columns.map(() => "?").join(", ");

  const values = columns.map((column) => historical[column]);

  await client.$executeRawUnsafe(
    `
      INSERT INTO ${quoteTable(config.table)}
      (${columns.map(quoteColumn).join(", ")})
      VALUES (${placeholders})
    `,
    ...values
  );
}

/**
 * Executa a lógica de reversão para um único registro dentro da transação.
 */
async function revertSingleRecordTx(
  tx: PrismaClientOrTx,
  table: AllowedTable,
  id: string,
  timestamp: string
) {
  const config = ALLOWED_TABLES[table];
  const historical = await getHistoricalState(config, id, timestamp, tx);
  const current = await getCurrentState(config, id, tx);

  // CASO 1: UPDATE (existia antes e existe agora)
  if (historical && current) {
    const protectedColumns = new Set([
      config.idColumn,
      "ROW_START",
      "ROW_END",
      "row_start",
      "row_end",
    ]);

    const columns = Object.keys(historical).filter(
      (column) => !protectedColumns.has(column)
    );

    const assignments = columns
      .map((column) => `${quoteColumn(column)} = ?`)
      .join(", ");

    const values = columns.map((column) => historical[column]);
    values.push(id);

    await tx.$executeRawUnsafe(
      `
        UPDATE ${quoteTable(config.table)}
        SET ${assignments}
        WHERE ${quoteColumn(config.idColumn)} = ?
      `,
      ...values
    );

    return { action: "UPDATE" as const, table, id };
  }

  // CASO 2: DELETE (criado recentemente, desfazer = excluir)
  if (!historical && current) {
    await tx.$executeRawUnsafe(
      `
        DELETE FROM ${quoteTable(config.table)}
        WHERE ${quoteColumn(config.idColumn)} = ?
      `,
      id
    );

    return { action: "DELETE" as const, table, id };
  }

  // CASO 3: INSERT (excluído recentemente, desfazer = restaurar)
  if (historical && !current) {
    await restoreDeletedRecord(config, historical, tx);
    return { action: "INSERT" as const, table, id };
  }

  throw new Error(`Nenhum estado histórico compatível para ${table} ID: ${id}`);
}

/**
 * GET - Consulta última alteração reversível de cada registro
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { role } = await authenticate(req);

  if (role === "VIEWER") {
    return res.status(403).json({
      error: "Visualizadores não podem consultar o histórico de reversão.",
    });
  }

  const rawItems: Array<{
    table: AllowedTable;
    id: string;
    name: string;
    timestamp: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "CLONE" | "MOVE";
  }> = [];

  const config = ALLOWED_TABLES.Active;

  const rows = await db.$queryRawUnsafe<HistoryRow[]>(
    `
      SELECT
        *,
        ROW_START,
        ROW_END
      FROM ${quoteTable(config.table)}
      FOR SYSTEM_TIME ALL
      ORDER BY ROW_START DESC
    `
  );

  const groupedById = new Map<string, HistoryRow[]>();

  for (const row of rows) {
    const list = groupedById.get(row.id) || [];
    list.push(row);
    groupedById.set(row.id, list);
  }

  for (const [id, versions] of groupedById) {
    const ordered = [...versions].sort(
      (a, b) => new Date(b.ROW_START).getTime() - new Date(a.ROW_START).getTime()
    );

    const current = ordered.find(
      (version) => new Date(version.ROW_END).getTime() >= new Date(SYSTEM_TIME_MAX).getTime()
    );

    if (current) {
      const previous = ordered.find(
        (version) => new Date(version.ROW_END).getTime() < new Date(SYSTEM_TIME_MAX).getTime()
      );
    
      if (!previous) continue;
    
      const previousEnd = new Date(previous.ROW_END);
      const revertTimestamp = new Date(previousEnd.getTime() - 1);
    
      const isFirstVersion =
        ordered.filter(
          (v) => new Date(v.ROW_START).getTime() < new Date(previous.ROW_START).getTime()
        ).length === 0;
    
      let action: "CREATE" | "UPDATE" | "DELETE" | "CLONE" | "MOVE" = "UPDATE";
    
      if (isFirstVersion) {
        action = "CREATE";
      } else {
        // Extrai os possíveis nomes de coluna (snake_case ou camelCase)
        const currentParent = String(
          current.fatherSpaceId ?? current.father_space_id ?? current.parent_id?? current.parentId                   // TODO: Resolver mistério do porque
        );                                                                                                           // o MOVE não apareçe em nenhum momento
        const previousParent = String(                                                                               // em settings.tsx mesmo fazendo a ação
          previous.fatherSpaceId ?? previous.father_space_id ?? previous.parent_id ?? previous.parentId              // de movimentar.
        );
    
        // Se a referência de localização/espaço mudou, é uma movimentação
        if (currentParent !== previousParent) {
          action = "MOVE";
        }
      }
    
      rawItems.push({
        table: "Active",
        id,
        name: String(current.name ?? previous.name ?? id),
        timestamp: revertTimestamp.toISOString(),
        action,
      });
    
      continue;
    }

    const lastVersion = ordered[0];
    if (!lastVersion) continue;

    const previousVersions = ordered.slice(1);
    const action = previousVersions.length === 0 ? "CREATE" : "DELETE";
    const revertTimestamp = new Date(new Date(lastVersion.ROW_END).getTime() - 1);

    rawItems.push({
      table: "Active",
      id,
      name: String(lastVersion.name ?? id),
      timestamp: revertTimestamp.toISOString(),
      action,
    });
  }

  // Ordena do mais recente ao mais antigo
  rawItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // --- AGRUPAMENTO EM LOTES (BATCHES) POR JANELA DE TEMPO (2 SEGUNDOS) ---
  const groupedActivities: Array<{
    groupId: string;
    name: string;
    timestamp: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "CLONE" | "MOVE";
    items: typeof rawItems;
  }> = [];

  const TIME_THRESHOLD_MS = 2000; // Itens criados dentro de 2 segundos pertencem à mesma atividade

  for (const item of rawItems) {
    const itemTime = new Date(item.timestamp).getTime();

    // Tenta encontrar um lote existente na mesma janela de tempo e mesma ação
    const existingGroup = groupedActivities.find((group) => {
      const groupTime = new Date(group.timestamp).getTime();
      return Math.abs(groupTime - itemTime) <= TIME_THRESHOLD_MS && group.action === item.action;
    });

    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.name = `${item.action === "CLONE" ? "Clonagem em grupo" : item.action === "DELETE" ? "Deleção em grupo" : item.action === "MOVE" ? "Movimentação em grupo" : item.action === "CREATE" ? "Criação" : "Edição"} (${existingGroup.items.length} ativos)`;
    } else {
      groupedActivities.push({
        groupId: `batch-${itemTime}-${Math.random().toString(36).substring(2, 7)}`,
        name: item.name ,
        timestamp: item.timestamp,
        action: item.action,
        items: [item],
      });
    }
  }

  // Se houver apenas 1 item no lote, desestrutura para o padrão individual simples
  const responseItems = groupedActivities.map((group) => {
    if (group.items.length === 1) {
      return {
        table: group.items[0].table,
        id: group.items[0].id,
        name: group.items[0].name,
        timestamp: group.items[0].timestamp,
        action: group.items[0].action,
      };
    }

    return {
      groupId: group.groupId,
      name: group.name,
      timestamp: group.timestamp,
      action: group.action,
      items: group.items.map((i) => ({ table: i.table, id: i.id, timestamp: i.timestamp })),
    };
  });

  return res.status(200).json({ items: responseItems });
}

/**
 * POST - Reverte uma alteração individual ou um lote (groupId)
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { userId, role } = await authenticate(req);

  if (role === "VIEWER") {
    return res.status(403).json({
      error: "Visualizadores não podem reverter alterações.",
    });
  }

  const { groupId, items, table, id, timestamp, mode = "QUICK" }: RevertBody = req.body || {};

  // Normalização do payload: aceita lista `items` ou registro único (`table`, `id`, `timestamp`)
  let itemsToRevert: RevertItem[] = [];

  if (Array.isArray(items) && items.length > 0) {
    itemsToRevert = items;
  } else if (table && id && timestamp) {
    itemsToRevert = [{ table, id, timestamp }];
  } else {
    return res.status(400).json({
      error: "Forneça os campos 'table', 'id' e 'timestamp' ou um array em 'items'.",
    });
  }

  // Validação dos itens
  for (const item of itemsToRevert) {
    if (!item.table || !item.id || !item.timestamp) {
      return res.status(400).json({
        error: "Todos os itens de reversão devem conter table, id e timestamp.",
      });
    }

    if (!isValidTable(item.table)) {
      return res.status(400).json({
        error: `Tabela '${item.table}' não é permitida para reversão.`,
      });
    }

    if (!isValidTimestamp(item.timestamp)) {
      return res.status(400).json({
        error: `Timestamp inválido fornecido para o item ${item.id}.`,
      });
    }

    if (mode === "QUICK") {
      const changeTime = new Date(item.timestamp).getTime();
      const elapsed = Date.now() - changeTime;

      if (elapsed < -1000 || elapsed > 11000) {
        return res.status(410).json({
          error: "O período de 10 segundos para desfazer esta alteração expirou.",
        });
      }
    }
  }

  // Executa todas as reversões atomicamente em lote
  const results = await db.$transaction(async (tx) => {
    const revertResults = [];
    for (const item of itemsToRevert) {
      const result = await revertSingleRecordTx(
        tx,
        item.table as AllowedTable,
        item.id,
        item.timestamp
      );
      revertResults.push(result);
    }
    return revertResults;
  });

  const groupDetails = groupId ? ` (groupId: ${groupId})` : "";
  await createLog(
    req,
    String(userId),
    groupId ? "REVERSÃO EM LOTE" : "REVERSÃO DE ALTERAÇÃO",
    `Reverteu ${results.length} item(ns) com sucesso: ${groupDetails}.`
  );

  return res.status(200).json({
    success: true,
    groupId: groupId || null,
    revertedCount: results.length,
    results,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      return await handleGet(req, res);
    }

    if (req.method === "POST") {
      return await handlePost(req, res);
    }

    return res.status(405).json({
      error: "Método não permitido.",
    });
  } catch (error: unknown) {
    console.error("❌ Erro no endpoint de reversão:", error);

    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return res.status(401).json({ error: "Sessão expirada." });
      }
      if (error.message === "JWT_SECRET_MISSING") {
        return res.status(500).json({ error: "JWT_SECRET não configurado." });
      }
      if (error.message === "USER_NOT_FOUND") {
        return res.status(401).json({ error: "Usuário não identificado." });
      }
    }

    return res.status(500).json({
      error: "Erro interno ao processar a reversão.",
      details: error instanceof Error ? error.message : "Erro desconhecido.",
    });
  }
}
