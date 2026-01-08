// pages/api/items/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { definitionId, locationId, serialNumber, purchaseDate, usefulLifeMonths, tag, notes } = req.body;

  try {
    const newItem = await prisma.item.create({
      data: {
        definitionId,
        locationId,
        serialNumber,
        tag: tag || 'IN-STOCK',
        notes,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        usefulLifeMonths: parseInt(usefulLifeMonths) || 60, // Padrão 5 anos
      }
    });
    return res.status(201).json(newItem);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}