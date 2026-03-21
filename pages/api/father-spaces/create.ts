// pages/api/father-spaces/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as Jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

interface CreateFatherSpacePayload {
  name: string;
  notes?: string;
  parentId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Bloqueio de método
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  // 2. Verificação do Token
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: "Sessão expirada ou usuário não autenticado." });
  }

  if (!JWT_SECRET) {
    console.error("ERRO: JWT_SECRET não definida no ambiente.");
    return res.status(500).json({ error: "Erro de configuração no servidor." });
  }

  try {
    // 3. Validação do JWT e extração de ID e ROLE
    const decoded = Jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    const user = {
      id: decoded.id,
      role: decoded.role
    };

    // 4. Regra de Acesso: Apenas ADMIN
    if (user.role !== "ADMIN") {
      return res.status(403).json({ 
        error: "Permissão insuficiente. Apenas administradores podem criar espaços." 
      });
    }

    // 5. Validação dos Dados do Corpo
    const { name, notes, parentId } = req.body as CreateFatherSpacePayload;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "O nome do espaço deve ter pelo menos 2 caracteres." });
    }

    // 6. Verificação de Duplicidade
    const existingSpace = await prisma.fatherSpace.findUnique({
      where: { name: name.trim() }
    });

    if (existingSpace) {
      return res.status(409).json({ error: "Já existe um espaço cadastrado com este nome." });
    }

    // 7. Persistência no Banco de Dados
    const newSpace = await prisma.fatherSpace.create({
      data: {
        name: name.trim(),
        notes: notes || null,
        parentId: parentId || null,
        createdById: user.id
      }
    });

    return res.status(201).json(newSpace);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Sua sessão expirou. Faça login novamente." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido ou corrompido." });
    }

    console.error("ERRO CRÍTICO (father-spaces/create):", error);
    return res.status(500).json({ error: "Falha interna ao criar o espaço pai." });
  } finally {
    await prisma.$disconnect();
  }
}