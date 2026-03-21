// pages/api/actives/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Area } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

interface UpdateActivePayload {
  id: string;
  name?: string;
  area?: Area;
  sku?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  fixedValue?: number;
  tag?: string;
  notes?: string;
  fatherSpaceId?: string;
  parentId?: string;
}

interface DecodedToken {
  userId: string;
  role: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    // 1. AUTENTICAÇÃO E AUTORIZAÇÃO
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Sessão expirada ou token ausente." });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as DecodedToken;

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Acesso negado. Viewers não podem editar ativos." });
    }

    // 2. VALIDAÇÃO DO PAYLOAD
    const data = req.body as UpdateActivePayload;
    
    if (!data.id) {
      return res.status(400).json({ error: "O ID do ativo é obrigatório para atualização." });
    }

    // 3. EXECUÇÃO DO UPDATE
    const updatedActive = await prisma.active.update({
      where: { id: data.id },
      data: {
        name: data.name,
        area: data.area,
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

    return res.status(200).json(updatedActive);

  } catch (error: unknown) {
    console.error("ERRO UPDATE ACTIVE:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token inválido." });
    }

    // Tratamento de erro específico do Prisma para registro não encontrado
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ error: "Ativo não encontrado para atualização." });
    }

    return res.status(500).json({ error: "Erro interno ao atualizar o ativo." });
  } finally {
    await prisma.$disconnect();
  }
}