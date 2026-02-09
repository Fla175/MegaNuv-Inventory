// pages/api/item-instances/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, parentId, fixedValue, imageUrl } = req.body;

  if (!name) return res.status(400).json({ message: 'Nome é obrigatório.' });

  // Lógica de Tratamento de Moeda
  let valueToSave = 0;
  if (fixedValue) {
    // 1. Converte para string para garantir
    // 2. Troca vírgula por ponto (caso venha "150,00")
    // 3. Remove qualquer caractere que não seja número ou ponto (ex: "R$")
    const cleanString = String(fixedValue).replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleanString);
    // 4. Se der NaN (erro), salva 0
    valueToSave = isNaN(parsed) ? 0 : parsed;
  }

  try {
    const newItemInstance = await prisma.itemInstance.create({
      data: {
        name,
        parentId: parentId || null,
        fixedValue: valueToSave,
        imageUrl: imageUrl || null
      }
    });

    return res.status(201).json(newItemInstance);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}