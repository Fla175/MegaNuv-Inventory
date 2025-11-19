import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Ajuste o import conforme seu projeto

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    res.setHeader('Allow', ['PATCH', 'PUT']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, name, sku, price, cost } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'ID do produto é obrigatório.' });
  }

  try {

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        sku,
        price: price !== undefined ? parseFloat(price) : undefined,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
      },
    });

    return res.status(200).json(updatedItem);
  } catch (error: any) {
    console.error('Erro ao atualizar item:', error);
    return res.status(500).json({ message: 'Erro interno ao atualizar produto.' });
  }
}