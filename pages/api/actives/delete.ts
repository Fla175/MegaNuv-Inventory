// pages/api/actives/delete.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Use DELETE." });

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    const userId = decoded.id || decoded.userId;

    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Acesso negado." });

    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "ID obrigatório." });

    // Busca dados antes de deletar para um log informativo
    const active = await db.active.findUnique({ where: { id } });
    if (!active) return res.status(404).json({ error: "Ativo não encontrado." });

    await db.active.delete({ where: { id } });

    await createLog(
      req,
      userId,
      "DELEÇÃO DE ATIVO",
      `Excluiu o ativo: ${active.name} (ID: ${id})`
    );

    return res.status(200).json({ message: "Ativo removido com sucesso." });

  } catch (error: any) {
    console.error("ERRO DELETE ACTIVE:", error.message);
    return res.status(500).json({ error: "Erro ao excluir ativo." });
  }
}