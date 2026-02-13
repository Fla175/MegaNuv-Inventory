// pages/api/items/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Use PUT ou PATCH.' });
  }

  const { id, tag, serialNumber, color } = req.body;

  if (!id) return res.status(400).json({ message: 'ID é obrigatório.' });

  try {
    const updatedItem = await prisma.item.update({
      where: { id: String(id) },
      data: {
        tag,
        color: color || null,
        serialNumber: serialNumber || null,
      },
    });

    return res.status(200).json(updatedItem);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Erro ao atualizar ativo:', error);
    if (error.code === 'P2025') return res.status(404).json({ message: 'Não encontrado.' });
    return res.status(500).json({ message: 'Erro interno.' });
  }
}