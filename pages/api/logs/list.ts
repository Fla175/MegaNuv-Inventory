// pages/api/logs/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";
import { canReadLogs } from "@/lib/rbac";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    if (!canReadLogs(session)) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const logs = await prisma.log.findMany({
      take: 200,
      orderBy: { createdAt: 'asc', },
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar logs de auditoria.';
    return res.status(500).json({ error: message });
  }
}