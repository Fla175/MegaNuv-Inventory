// pages/api/actives/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Autenticação JWT
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as { role: string };
    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Acesso negado." });

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
      orderBy: { createdAt: 'desc' }
    });

    const formatted = actives.map(item => ({
      ...item,
      childrenCount: item._count.children,
      _count: undefined
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("ERRO actives/list:", error);
    return res.status(500).json({ error: "Erro ao listar ativos" });
  }
}