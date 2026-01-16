// pages/api/item-instances/update.ts
import prisma from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).end();
  
  const { id, name, parentId } = req.body;

  try {
    const updated = await prisma.itemInstance.update({
      where: { id },
      data: { 
        name,
        parentId: parentId || null // Permite mover um subespaço para ser raiz
      },
    });
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao atualizar espaço." });
  }
}