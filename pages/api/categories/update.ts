// pages/api/categories/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import * as jose from "jose";
import { createLog } from "@/lib/logger";

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

    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as unknown as DecodedToken;

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Visualizadores não podem atualizar categorias." });
    }

    const { id, name, color } = req.body;

    if (!id) return res.status(400).json({ error: "O ID da área é obrigatório." });

    // 1. Executa o Update
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name, color },
    });

    // 2. Regista a Auditoria
    await createLog(
      req,
      decoded.userId,
      "ATUALIZAÇÃO DA CATEGORIA",
      `Atualizou a categoria; ID: ${id}. Novo Nome: ${name}, Cor: ${color}`
    );

    return res.status(200).json(updatedCategory);
  
  } catch (error: unknown) {
    if (error instanceof jose.errors.JWTInvalid) return res.status(401).json({ error: "Token inválido." });
    
    const err = error as { code?: string };
    if (typeof error === 'object' && error !== null && 'code' in error && err.code === 'P2025') {
      return res.status(404).json({ error: "Categoria não encontrada." });
    }
    
    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar área.';
    return res.status(500).json({ error: message });
  }
}