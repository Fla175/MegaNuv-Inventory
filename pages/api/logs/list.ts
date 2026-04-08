// pages/api/logs/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

interface DecodedToken {
  userId: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as DecodedToken;

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { defaultSort: true }
    });

    const sortOrder = user?.defaultSort === "name" ? "asc" : "desc";

    const logs = await prisma.log.findMany({
      take: 200,
      orderBy: { createdAt: sortOrder },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json(logs);

  } catch (error) {
    console.error("API_LOG_LIST_ERROR:", error);
    return res.status(500).json({ error: "Erro ao buscar logs de auditoria." });
  } finally {
    await prisma.$disconnect();
  }
}