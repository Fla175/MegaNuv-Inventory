// pages/api/categories/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    // Autenticação JWT
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

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