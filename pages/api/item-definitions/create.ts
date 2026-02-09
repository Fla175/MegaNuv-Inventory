// pages/api/item-definitions/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, sku, imageUrl, brand, line } = req.body;

  try {
    const newDef = await prisma.itemDefinition.create({
      data: {
        name: String(name),
        sku: sku ? String(sku).toUpperCase() : null,
        imageUrl: imageUrl || null,
        brand: brand || null,
        line: line || null,
        isNative: true 
      }
    });
    return res.status(201).json(newDef);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return res.status(500).json({ message: "Erro ao salvar.", error: error.message });
  }
}