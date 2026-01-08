// pages/api/item-instances/children/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = req.headers.authorization?.split(' ')[1] || cookies.auth_token;
  if (!token || !verifyAuthToken(token)) return res.status(401).json({ message: 'Unauthorized' });

  const { childId } = req.query; // No front-end, passas ?childId=...

  try {
    // No teu novo schema, 'ItemInstance' tem relação 'children' e 'items'
    // Como definimos 'onDelete: Cascade' no Prisma, basta apagar o pai:
    await prisma.itemInstance.delete({
      where: { id: String(childId) }
    });

    return res.status(200).json({ message: 'Espaço e dependências eliminados com sucesso.' });
  } catch (error: any) {
    // Se o erro for P2025, o item já não existia
    if (error.code === 'P2025') return res.status(404).json({ message: 'ID não encontrado.' });
    return res.status(500).json({ message: error.message });
  }
}