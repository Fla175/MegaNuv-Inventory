// pages/api/actives/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Autenticação JWT
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const actives = await db.active.findMany({
      include: {
        category: true,
        createdBy: { select: { name: true, email: true } },
        fatherSpace: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        _count: {
          select: { children: true }
        }
      },
      orderBy: { name: 'desc', },
    });

    const formatted = actives.map(item => ({
      ...item,
      childrenCount: item._count?.children || 0,
      _count: undefined
    }));

    return res.status(200).json(formatted);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar ativos';
    return res.status(500).json({ error: message });
  }
}