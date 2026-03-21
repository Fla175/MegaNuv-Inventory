// pages/api/actives/move.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

interface MoveActivePayload {
  id: string;
  newFatherSpaceId: string;
  newParentId?: string | null;
}

interface DecodedToken {
  userId: string;
  role: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Método não permitido. Use PATCH." });
  }

  try {
    // 1. AUTENTICAÇÃO E AUTORIZAÇÃO
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Sessão expirada ou token ausente." });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as DecodedToken;

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Acesso negado. Viewers não podem mover ativos." });
    }

    // 2. VALIDAÇÃO DO PAYLOAD
    const { id, newFatherSpaceId, newParentId } = req.body as MoveActivePayload;

    if (!id || !newFatherSpaceId) {
      return res.status(400).json({ error: "ID do ativo e o novo Espaço Pai são obrigatórios." });
    }

    // Impede que um ativo seja colocado dentro dele mesmo (evita loop infinito na árvore)
    if (id === newParentId) {
      return res.status(400).json({ error: "Um ativo não pode ser colocado dentro de si mesmo." });
    }

    // 3. EXECUÇÃO DA MOVIMENTAÇÃO
    const movedActive = await prisma.active.update({
      where: { id },
      data: {
        fatherSpaceId: newFatherSpaceId,
        // Se newParentId for null, ele é removido de dentro de um ativo pai (vai para a raiz do espaço)
        parentId: newParentId !== undefined ? newParentId : undefined,
      },
    });

    return res.status(200).json({ success: true, active: movedActive });

  } catch (error: unknown) {
    console.error("ERRO MOVE ACTIVE:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token inválido." });
    }

    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ error: "Ativo não encontrado." });
    }

    return res.status(500).json({ error: "Erro interno ao mover o ativo." });
  } finally {
    await prisma.$disconnect();
  }
}