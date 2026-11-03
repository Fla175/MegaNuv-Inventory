// pages/api/settings/has-physical-spaces.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas o método GET é permitido
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  try {
    // Verificação de autenticação
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    // Contar ativos-espaços-físicos no banco de dados
    const physicalSpaceCount = await prisma.active.count({
      where: {
        isPhysicalSpace: true,
      },
    });

    return res.status(200).json({ hasPhysicalSpaces: physicalSpaceCount > 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno ao verificar espaços físicos";
    return res.status(500).json({ error: message });
  }
}