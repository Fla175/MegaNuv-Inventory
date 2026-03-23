// pages/api/actives/update.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    const userId = decoded.id || decoded.userId;

    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Acesso negado." });

    const data = req.body;
    if (!data.id) return res.status(400).json({ error: "ID do ativo é obrigatório." });

    // Busca o nome antes para o log
    const currentActive = await db.active.findUnique({ where: { id: data.id } });

    const updatedActive = await db.active.update({
      where: { id: data.id },
      data: {
        name: data.name,
        // Conexão correta com a Tabela Area
        area: data.areaId ? { connect: { id: data.areaId } } : undefined,
        sku: data.sku,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        fixedValue: data.fixedValue !== undefined ? Number(data.fixedValue) : undefined,
        tag: data.tag,
        notes: data.notes,
        fatherSpaceId: data.fatherSpaceId,
        parentId: data.parentId,
      },
    });

    await createLog(
      req,
      userId,
      "UPDATE_ACTIVE",
      `Atualizou o ativo: ${currentActive?.name || 'Desconhecido'} (ID: ${data.id})`
    );

    return res.status(200).json(updatedActive);

  } catch (error: any) {
    console.error("ERRO UPDATE ACTIVE:", error.message);
    return res.status(500).json({ error: "Erro interno ao atualizar ativo." });
  }
}