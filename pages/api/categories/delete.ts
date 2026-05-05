// pages/api/categories/delete.ts
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
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as unknown as DecodedToken;

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Visualizadores não podem excluir categorias." });
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID inválido para exclusão." });
    }

    // Buscamos o nome antes de apagar para o log ficar informativo
    const categoryToDelete = await prisma.category.findUnique({ where: { id } });
    if (!categoryToDelete) return res.status(404).json({ error: "Área não encontrada." });

    // 1. Elimina a Área
    await prisma.category.delete({ where: { id } });

    // 2. Regista a Auditoria
    await createLog(
      req,
      decoded.userId,
      "DELEÇÃO DE CATEGORIA",
      `Removeu a Categoria: ${categoryToDelete.name}`
    );

    return res.status(200).json({ message: "Área removida com sucesso." });
  
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao remover área. Verifique se existem ativos vinculados a ela.';
    return res.status(500).json({ error: message });
  }
}