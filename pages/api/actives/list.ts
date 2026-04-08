// pages/api/actives/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const actives = await db.active.findMany({
      include: {
        category: true, // Adicionado para exibir nomes/cores no front
        createdBy: { select: { name: true, email: true } },
        fatherSpace: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        _count: {
          select: { children: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = actives.map(item => ({
      ...item,
      childrenCount: item._count.children,
      _count: undefined
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    error =  "Erro ao listar ativos";
    return res.status(500).json({ error:error });
  }
}