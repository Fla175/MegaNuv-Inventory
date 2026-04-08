// pages/api/categories/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger"; // Importando o logger que acabamos de criar

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

    // 2. AUTORIZAÇÃO (Apenas ADMIN cria áreas)
    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Apenas administradores podem criar áreas." });
    }

    const { name, color } = req.body;

    if (!name) return res.status(400).json({ error: "O nome da área é obrigatório." });

    // 3. EXECUÇÃO
    const newArea = await prisma.category.create({
      data: { name, color }
    });

    // 4. REGISTRO DE AUDITORIA
    await createLog(
      req, 
      decoded.userId, 
      "CRIAÇÃO DE CATEGORIA",
      `Criou a Categoria: ${name} (${color || 'sem cor definida'})`
    );

    return res.status(201).json(newArea);

  } catch (error) {
    console.error("API_AREA_CREATE_ERROR:", error);
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: "Token inválido." });
    
    // Trata nome duplicado (Unique constraint no Prisma)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2002') {
      return res.status(400).json({ error: "Já existe uma área com este nome." });
    }

    return res.status(500).json({ error: "Erro interno ao criar área." });
  } finally {
    await prisma.$disconnect();
  }
}