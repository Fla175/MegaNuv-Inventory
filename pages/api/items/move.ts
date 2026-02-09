// pages/api/items/move.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { itemIds, newLocationId } = body; 

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ message: "Nenhum ID recebido." });
  }

  try {
    const result = await prisma.item.updateMany({
      where: { id: { in: itemIds as string[] } },
      data: { locationId: newLocationId as string }
    });
    return res.status(200).json({ count: result.count });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
}