// pages/api/items/move.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();
  const { assetIds, newLocationId } = req.body; // Aceita múltiplos IDs

  try {
    await prisma.item.updateMany({
      where: { id: { in: assetIds } },
      data: { locationId: newLocationId }
    });
    return res.status(200).json({ message: "Itens movidos com sucesso." });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}