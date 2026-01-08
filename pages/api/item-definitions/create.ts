// pages/api/item-definitions/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Desestruturação segura
  const { name, sku, cost, depreciationRate } = req.body;

  try {
    const newDef = await prisma.itemDefinition.create({
      data: {
        name: String(name),
        sku: sku ? String(sku).toUpperCase() : null,
        // Usamos Number() ou parseFloat() para garantir que o Decimal do banco receba um número
        cost: cost ? Number(cost) : null,
        depreciationRate: depreciationRate ? Number(depreciationRate) : 0,
        depreciationMethod: 'straight-line' 
      }
    });
    
    return res.status(201).json(newDef);
  } catch (error: any) {
    console.error("ERRO CRÍTICO NO PRISMA:", error);
    return res.status(500).json({ 
      message: "Erro ao salvar no banco de dados.",
      error: error.message 
    });
  }
}