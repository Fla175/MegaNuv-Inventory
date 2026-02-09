// pages/api/internal/ensure-location-item.ts (Leitura de JWT de Cookie)
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1] || req.cookies['auth_token'];
  if (!token || !verifyAuthToken(token)) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  try {
    const internalSku = 'INTERNAL_LOCATION_SPACE';

    const definition = await prisma.itemDefinition.upsert({
      where: { sku: internalSku },
      update: {}, 
      create: {
        name: 'Espaço Físico',
        sku: internalSku,
        description: 'Definição base para itens que representam subespaços ou ativos de estrutura.',
        isNative: true,
      },
    });

    let locationItem = await prisma.item.findFirst({
      where: { definitionId: definition.id },
    });

    if (!locationItem) {
      locationItem = await prisma.item.create({
        data: {
          definitionId: definition.id,
          tag: 'IN-USE',
          notes: 'Ativo gerado automaticamente para representar a estrutura física.',
        },
      });
    }

    return res.status(200).json({
      message: 'Estrutura de definição e ativo garantida!',
      locationItemId: locationItem.id,
      definitionId: definition.id
    });

  } catch (error) {
    console.error('Erro ao garantir item de localização:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}