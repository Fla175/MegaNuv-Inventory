// pages/api/logs/clear.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { createLog } from "@/lib/logger";
import { getSessionUser } from "@/lib/apiAuth";
import { canClearLogs } from "@/lib/rbac";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Não autorizado." });

    if (!canClearLogs(session)) {
      return res.status(403).json({ error: "Acesso restrito a ADMIN e DIRECTOR." });
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
      session.userId,
      "LIMPEZA DE LOGS",
      `O histórico de logs foi limpo (Filtro: ${range === 'old' ? 'Mais de 30 dias' : 'Tudo'}).`
    );

    return res.status(200).json({ message: "Logs processados com sucesso." });
 
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao limpar logs.';
    return res.status(500).json({ error: message });
  }
}