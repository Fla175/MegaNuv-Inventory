/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/actives/delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("ERRO CRÍTICO: JWT_SECRET não definida no ambiente.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Use DELETE." });
  }

  try {
    // Pegamos o token do Cookie ou do Header (Bearer)
    const token = req.cookies.token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) return res.status(401).json({ error: "Sessão expirada ou token ausente." });

    const decoded = jwt.verify(token, JWT_SECRET!) as { id: string; role: string };

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Viewers não podem excluir ativos." });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID obrigatório." });
    }

    const deletedActive = await prisma.active.delete({
      where: { id: id },
    });

    return res.status(200).json({ message: "Ativo removido.", id: deletedActive.id });

  } catch (error: any) {
    console.error("ERRO JWT/DELETE:", error.message);

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Sessão inválida. Faça login novamente." });
    }
    if (error.code === 'P2025') return res.status(404).json({ error: "Ativo não encontrado." });
    return res.status(500).json({ error: "Erro interno ao processar requisição." });
  }
}