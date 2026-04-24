// pages/api/categories/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger";
import { CATEGORY_PALETTE } from "@/lib/constants/colors";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

interface DecodedToken {
  userId: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    // 1. AUTENTICAÇÃO JWT (Seu padrão)
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as DecodedToken;

    // 2. AUTORIZAÇÃO (ADMIN e MANAGER criam categorias)
    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Visualizadores não podem criar categorias." });
    }

    // 3. LIMITE DE CATEGORIAS (máximo 18)
    const categoryCount = await prisma.category.count();
    if (categoryCount >= 18) {
      return res.status(400).json({ error: "Limite máximo de 18 categorias atingido." });
    }

    const { name } = req.body;

    if (!name) return res.status(400).json({ error: "O nome da categoria é obrigatório." });

    // 4. COR AUTOMÁTICA (primeira cor disponível)
    const existingColors = await prisma.category.findMany({
      select: { color: true },
      where: { color: { not: null } }
    });
    const usedColors = existingColors.map(c => c.color).filter(Boolean) as string[];
    
    let assignedColor: string | undefined;
    for (let i = 0; i < CATEGORY_PALETTE.length; i++) {
      if (!usedColors.includes(CATEGORY_PALETTE[i])) {
        assignedColor = CATEGORY_PALETTE[i];
        break;
      }
    }

    // 5. EXECUÇÃO
    const newCategory = await prisma.category.create({
      data: { name, color: assignedColor }
    });

    // 5. REGISTRO DE AUDITORIA
    await createLog(
      req, 
      decoded.userId, 
      "CRIAÇÃO DE CATEGORIA",
      `Criou a Categoria: ${name} (${assignedColor || 'sem cor definida'})`
    );

    return res.status(201).json(newCategory);

  } catch (error: unknown) {
    console.error("API_CATEGORY_CREATE_ERROR:", error);
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: "Token inválido." });
    
    const err = error as { code?: string };
    if (typeof error === 'object' && error !== null && 'code' in err && err.code === 'P2002') {
      return res.status(400).json({ error: "Já existe uma categoria com este nome." });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao criar categoria.';
    return res.status(500).json({ error: message });
  } finally {
    await prisma.$disconnect();
  }
}