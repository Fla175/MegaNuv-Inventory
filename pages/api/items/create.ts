// pages/api/items/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: "Método não permitido" });

  const itemsData = req.body; 

  if (!Array.isArray(itemsData)) {
    return res.status(400).json({ message: "O corpo da requisição deve ser um array." });
  }

  try {
    const result = await prisma.item.createMany({
      data: itemsData,
      skipDuplicates: true,
    });
    
    return res.status(201).json({ 
      message: `${result.count} itens criados com sucesso!`,
      count: result.count 
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("ERRO NO PRISMA:", error.message);
    
    return res.status(500).json({ 
      message: "Erro ao salvar no banco.",
      error: error.message
    });
  }
}