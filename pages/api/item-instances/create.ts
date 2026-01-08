// pages/api/item-instances/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, parentId, cost, purchaseDate, usefulLifeMonths } = req.body;

  if (!name) return res.status(400).json({ message: 'Nome é obrigatório.' });

  try {
    const newItemInstance = await prisma.itemInstance.create({
      data: {
        name,
        parentId: parentId || null,
        // Converte string vazia para null e números corretamente
        cost: cost ? Number(cost) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        usefulLifeMonths: usefulLifeMonths ? Number(usefulLifeMonths) : null,
      }
    });

    return res.status(201).json(newItemInstance);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}