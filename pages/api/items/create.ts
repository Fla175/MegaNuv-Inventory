// pages/api/items/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const itemsData = req.body; 

  try {
    const result = await prisma.item.createMany({
      data: itemsData
    });
    
    return res.status(201).json({ 
      message: `${result.count} itens criados com sucesso!`,
      count: result.count 
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return res.status(500).json({ message: "Erro ao salvar no banco." });
  }
}
