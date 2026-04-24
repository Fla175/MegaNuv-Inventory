// pages/api/logs/clear.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger";

const prisma = new PrismaClient();
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
    if (!token) return res.status(401).json({ error: "Não autorizado." });

    const decoded = jwt.verify(token, JWT_SECRET!) as DecodedToken;

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso restrito a administradores." });
    }

    const { range } = req.query; // 'all' ou 'old' (mais de 30 dias)

    if (range === "old") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await prisma.log.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
      });
    } else {
      // Deleta TUDO
      await prisma.log.deleteMany({});
    }

    // "No capricho": Após limpar, criamos o rastro de quem limpou
    await createLog(
      req,
      decoded.userId,
      "LIMPEZA DE LOGS",
      `O histórico de logs foi limpo (Filtro: ${range === 'old' ? 'Mais de 30 dias' : 'Tudo'}).`
    );

    return res.status(200).json({ message: "Logs processados com sucesso." });

  } catch (error: unknown) {
    console.error("API_LOG_CLEAR_ERROR:", error);
    const message = error instanceof Error ? error.message : 'Erro ao limpar logs.';
    return res.status(500).json({ error: message });
  } finally {
    await prisma.$disconnect();
  }
}