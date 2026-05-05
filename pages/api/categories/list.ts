// pages/api/categories/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    // Autenticação JWT
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { role: string };
    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Visualizadores não podem listar categorias." });

    // Busca todas as áreas ordenadas por nome
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { actives: true }
        }
      }
    });

    return res.status(200).json(categories);
 
   } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar categorias.';
     return res.status(500).json({ error: message });
   }
}