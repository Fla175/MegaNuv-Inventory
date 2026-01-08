import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = req.headers.authorization?.split(' ')[1] || cookies.auth_token;

  if (!token || !verifyAuthToken(token)) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  try {
    const { locationId, tag } = req.query;

    const items = await prisma.item.findMany({
      where: {
        locationId: locationId ? String(locationId) : undefined,
        tag: tag ? String(tag) : undefined,
      },
      include: {
        definition: {
          select: {
            name: true,
            sku: true,
            cost: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatação segura para evitar erros de tipos Decimal do Prisma
    const formattedItems = items.map(item => ({
      ...item,
      // O custo vem da definição agora
      cost: item.definition.cost ? Number(item.definition.cost) : 0,
    }));

    return res.status(200).json({ items: formattedItems });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}