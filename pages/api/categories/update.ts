// pages/api/categories/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

interface DecodedToken {
  userId: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Aceita PUT ou PATCH para atualizações
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as DecodedToken;

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores atualizam áreas." });
    }

    const { id, name, color } = req.body;

    if (!id) return res.status(400).json({ error: "O ID da área é obrigatório." });

    // 1. Executa o Update
    const updatedArea = await prisma.category.update({
      where: { id },
      data: { name, color },
    });

    // 2. Regista a Auditoria
    await createLog(
      req,
      decoded.userId,
      "UPDATE_AREA",
      `Atualizou a área ID: ${id}. Novo Nome: ${name}, Cor: ${color}`
    );

    return res.status(200).json(updatedArea);

  } catch (error) {
    console.error("API_AREA_UPDATE_ERROR:", error);
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: "Token inválido." });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }

    return res.status(500).json({ error: "Erro interno ao atualizar área." });
  } finally {
    await prisma.$disconnect();
  }
}