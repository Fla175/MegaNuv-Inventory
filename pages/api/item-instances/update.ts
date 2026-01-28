// pages/api/item-instances/update.ts
import prisma from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') return res.status(405).end();
  
  const { id, name, parentId, fixedValue, imageUrl } = req.body;

  // Prepara o objeto de dados dinamicamente
  const dataToUpdate: any = {};
  if (name !== undefined) dataToUpdate.name = name;
  if (parentId !== undefined) dataToUpdate.parentId = parentId || null;
  if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;

  // Lógica de Tratamento de Moeda no Update
  if (fixedValue !== undefined) {
    if (fixedValue === '' || fixedValue === null) {
        dataToUpdate.fixedValue = 0;
    } else {
        const cleanString = String(fixedValue).replace(',', '.').replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleanString);
        dataToUpdate.fixedValue = isNaN(parsed) ? 0 : parsed;
    }
  }

  try {
    const updated = await prisma.itemInstance.update({
      where: { id },
      data: dataToUpdate,
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar espaço." });
  }
}