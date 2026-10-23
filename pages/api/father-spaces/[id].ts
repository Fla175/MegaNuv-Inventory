// pages/api/father-spaces/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";

/**
 * Detail payload for a single father space (ADR-004).
 *
 * The list endpoint already returns every column, but the list type
 * (`FatherSpace`) does not include the location metadata. The detail modal
 * fetches this endpoint so it can render address, responsible, phone and image
 * without widening the list type or casting.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const { id } = req.query;
    if (typeof id !== "string" || id.length === 0) {
      return res.status(400).json({ error: "ID do espaço é obrigatório." });
    }

    const space = await prisma.fatherSpace.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!space) {
      return res.status(404).json({ error: "Espaço não encontrado." });
    }

    return res.status(200).json(space);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno ao buscar o espaço pai.";
    return res.status(500).json({ error: message });
  }
}
