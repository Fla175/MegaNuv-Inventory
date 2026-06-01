// pages/api/categories/check-assets.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from "@/lib/prisma"; 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'O ID da categoria é obrigatório.' });
  }

  try {
    const assetCount = await prisma.active.count({
      where: {
        categoryId: id,
      },
    });

    const hasAssets = assetCount > 0;

    return res.status(200).json({ hasAssets });
  } catch (error) {
    console.error('Erro ao verificar ativos da categoria:', error);
    return res.status(500).json({ error: 'Erro interno no servidor ao verificar dependências.' });
  }
}