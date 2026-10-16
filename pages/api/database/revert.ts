// pages/api/database/revert.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import { createLog } from "@/lib/logger";
import { planRevert, type VersionRow } from "@/lib/revert/history";
import { parseSystemVersioningError } from "@/lib/revert/errors";
import {
  batchActivities,
  toSubItems,
  type PlannedItem,
} from "@/lib/revert/batch";
import type { AllowedTable, RevertSubItem } from "@/lib/revert/types";
import { getSessionUser } from "@/lib/apiAuth";

const ALLOWED_TABLES: Record<
  AllowedTable,
  { table: AllowedTable; idColumn: string }
> = {
  Active: {
    table: "Active",
    idColumn: "id",
  },
  FatherSpace: {
    table: "FatherSpace",
    idColumn: "id",
  },
  Category: {
    table: "Category",
    idColumn: "id",
  },
};

type PrismaClientOrTx =
  | typeof db
  | Parameters<Parameters<(typeof db)["$transaction"]>[0]>[0];

interface RevertBody {
  groupId?: string;
  items?: RevertSubItem[];
  // Suporte legado para item único
  table?: string;
  id?: string;
  timestamp?: string;

  // QUICK = popup de 10 segundos | HISTORY = Settings
  mode?: "QUICK" | "HISTORY";
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
  // `lib/auth.ts` valida JWT_SECRET no import do módulo, então a checagem
  // "JWT_SECRET_MISSING" que existia aqui era inalcançável. `getSessionUser`
  // nunca lança: token ausente, inválido ou expirado resultam em `null`.
  //
  // Antes, um token inválido fazia `jwtVerify` lançar e a exceção caía no catch
  // sem mapeamento, devolvendo 500 em vez de 401.
  const session = await getSessionUser(req);

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const userId = session.userId;

  if (!userId || userId === "undefined") {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    userId: String(userId),
    role: session.role,
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
 * Deriva o instante de reversão a partir do histórico do registro e valida o
 * `timestamp` enviado pelo cliente contra ele.
 *
 * O `timestamp` do cliente **nunca** chega ao `FOR SYSTEM_TIME AS OF`: ele só
 * serve para detectar lista desatualizada. O servidor é a autoridade.
 *
 * Tolerâncias:
 *  - QUICK: 11 s — o timestamp vem do relógio do app em `move.ts`, e o banco
 *    grava `ROW_END` no commit; a folga absorve o skew app↔banco.
 *  - HISTORY: 5 ms — o timestamp veio do próprio GET (valor derivado); qualquer
 *    mudança no registro desde a consulta estoura a folga.
 */
const HISTORY_TOLERANCE_MS = 5;
const QUICK_TOLERANCE_MS = 11000;

async function resolveRevertAt(
  tx: PrismaClientOrTx,
  table: AllowedTable,
  id: string,
  clientTimestamp: string,
  mode: "QUICK" | "HISTORY"
): Promise<string> {
  const config = ALLOWED_TABLES[table];

  const rows = await tx.$queryRawUnsafe<VersionRow[]>(
    `
      SELECT *, ROW_START, ROW_END
      FROM ${quoteTable(config.table)}
      FOR SYSTEM_TIME ALL
      WHERE ${quoteColumn(config.idColumn)} = ?
      ORDER BY ROW_START DESC
    `,
    id
  );

  const plan = planRevert(table, rows);
  if (!plan) {
    throw new Error(`Nenhum histórico reversível para ${table} ID: ${id}`);
  }

  const derived = plan.revertAt.getTime();
  const client = new Date(clientTimestamp).getTime();
  const tolerance =
    mode === "HISTORY" ? HISTORY_TOLERANCE_MS : QUICK_TOLERANCE_MS;

  if (Math.abs(client - derived) > tolerance) {
    throw new Error("STALE_REVERT_LIST");
  }

  return plan.revertAt.toISOString();
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

  const config = ALLOWED_TABLES.Active;

  // Uma única varredura do histórico: quem classifica a ação é lib/revert/history.
  const rows = await db.$queryRawUnsafe<VersionRow[]>(
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

  const groupedById = new Map<string, VersionRow[]>();

  for (const row of rows) {
    const id = String(row.id);
    const list = groupedById.get(id) || [];
    list.push(row);
    groupedById.set(id, list);
  }

  const plannedItems: PlannedItem[] = [];

  for (const [id, versions] of groupedById) {
    const plan = planRevert("Active", versions);
    if (!plan) continue;

    plannedItems.push({
      table: "Active",
      id,
      name: plan.name,
      action: plan.action,
      timestamp: plan.revertAt.toISOString(),
    });
  }

  // Atividades: registros soltos ou lotes de mesma ação na janela de 2s.
  const responseItems = batchActivities(plannedItems).map((activity) => {
    if (activity.items.length === 1) {
      const only = activity.items[0];
      return {
        table: only.table,
        id: only.id,
        name: activity.name,
        timestamp: activity.timestamp,
        action: activity.action,
      };
    }

    return {
      groupId: activity.groupId,
      name: activity.name,
      timestamp: activity.timestamp,
      action: activity.action,
      items: toSubItems(activity),
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

  const {
    groupId,
    items,
    table,
    id,
    timestamp,
    mode = "QUICK",
  }: RevertBody = req.body || {};

  // Normalização do payload: aceita lista `items` ou registro único (`table`, `id`, `timestamp`)
  let itemsToRevert: RevertSubItem[] = [];

  if (Array.isArray(items) && items.length > 0) {
    itemsToRevert = items;
  } else if (table && id && timestamp) {
    itemsToRevert = [{ table: table as AllowedTable, id, timestamp }];
  } else {
    return res.status(400).json({
      error:
        "Forneça os campos 'table', 'id' e 'timestamp' ou um array em 'items'.",
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
          error:
            "O período de 10 segundos para desfazer esta alteração expirou.",
        });
      }
    }
  }

  // Executa todas as reversões atomicamente em lote
  const results = await db.$transaction(async (tx) => {
    const revertResults = [];
    for (const item of itemsToRevert) {
      const revertAt = await resolveRevertAt(
        tx,
        item.table,
        item.id,
        item.timestamp,
        mode
      );
      const result = await revertSingleRecordTx(
        tx,
        item.table,
        item.id,
        revertAt
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      if (error.message === "USER_NOT_FOUND") {
        return res.status(401).json({ error: "Usuário não identificado." });
      }
      if (error.message === "STALE_REVERT_LIST") {
        return res.status(409).json({
          error:
            "O histórico mudou desde que esta lista foi carregada. Atualize e tente novamente.",
        });
      }
    }

    // Falha de infraestrutura do banco (MariaDB 4124): a tabela reversível não
    // tem `WITH SYSTEM_VERSIONING`, então `FOR SYSTEM_TIME AS OF` não tem o que
    // ler. É uma condição **acionável e persistente** — retry não resolve — por
    // isso 503 com o comando de correção, e não 500 genérico.
    //
    // O app nunca aplica o DDL: ganhar privilégio de `ALTER TABLE` em produção
    // para consertar o próprio schema seria inverter a separação de
    // responsabilidades. A correção é um script operacional idempotente
    // (`scripts/system-v.ts`), executado por quem tem acesso
    // ao banco. Ver SPECS.md §5.5.
    const systemVersioningError = parseSystemVersioningError(error);

    if (systemVersioningError) {
      const target = systemVersioningError.table
        ? `A tabela \`${systemVersioningError.table}\` não está com "system versioning" habilitado.`
        : 'Uma ou mais tabelas usadas pelo Revert não estão com "system versioning" habilitado.';

      // Sem stack e sem a mensagem crua do Prisma/MariaDB: o corpo do 503 é
      // lido pelo frontend e não pode vazar detalhe do driver.
      return res.status(503).json({
        error:
          `${target} O Revert depende do histórico do MariaDB (WITH SYSTEM VERSIONING), ` +
          `que não é modelado pelo Prisma. Para corrigir, execute no servidor: ` +
          `node scripts/system-v.ts --aplicar`,
      });
    }

    return res.status(500).json({
      error: "Erro interno ao processar a reversão.",
      details: error instanceof Error ? error.message : "Erro desconhecido.",
    });
  }
}
