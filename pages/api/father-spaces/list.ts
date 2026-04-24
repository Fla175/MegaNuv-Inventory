// pages/api/father-spaces/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas o método GET é permitido
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  try {
    // Verificação de autenticação
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as { role: string };
    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Visualizadores não podem listar espaços." });

    // 2. BUSCA NO BANCO COM RELACIONAMENTOS E CONTAGENS
    const spaces = await prisma.fatherSpace.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            actives: true,
            children: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 3. RETORNO DOS DADOS
    return res.status(200).json(spaces);

  } catch (error: unknown) {
    console.error("ERRO father-spaces/list:", error);
    const message = error instanceof Error ? error.message : 'Erro interno ao listar os espaços pai.';
    return res.status(500).json({ error: message });
  } finally {
    await prisma.$disconnect();
  }
}