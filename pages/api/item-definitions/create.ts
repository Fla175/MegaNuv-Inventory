// pages/api/item-definitions/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, sku, imageUrl, manufacturer, model, datasheetUrl } = req.body;

  try {
    const newDef = await prisma.itemDefinition.create({
      data: {
        name: String(name),
        sku: String(sku).toUpperCase(),
        imageUrl: imageUrl || null,
        manufacturer: manufacturer || null,
        model: model || null,
        datasheetUrl: datasheetUrl || null,
        isNative: true,
      }
    });
    return res.status(201).json(newDef);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao salvar.", error: error.message });
  }
}