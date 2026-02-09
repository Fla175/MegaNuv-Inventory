// pages/api/items/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const { itemIds } = req.body;

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ message: "Nenhum item selecionado." });
  }

  try {
    const result = await prisma.item.deleteMany({
      where: {
        id: { in: itemIds } // 👈 Deleta todos cujos IDs estão na lista
      }
    });

    return res.status(200).json({ 
      message: "Itens excluídos com sucesso!",
      count: result.count 
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return res.status(500).json({ message: "Erro ao excluir itens do banco." });
  }
}