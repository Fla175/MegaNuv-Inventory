// pages/api/categories/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    // Autenticação JWT
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    jwt.verify(token, JWT_SECRET!);

    // Busca todas as áreas ordenadas por nome
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { actives: true } // Útil para mostrar quantos ativos tem em cada área
        }
      }
    });

    return res.status(200).json(categories);

  } catch (error) {
    console.error("API_AREA_LIST_ERROR:", error);
    return res.status(500).json({ error: "Erro ao buscar áreas." });
  } finally {
    await prisma.$disconnect();
  }
}