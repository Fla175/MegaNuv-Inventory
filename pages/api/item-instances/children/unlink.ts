// pages/api/item-instances/children/unlink.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { verifyAuthToken } from '../../../../lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- AUTENTICAÇÃO ---
  const authHeader = req.headers.authorization;
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookies.auth_token;

  if (!token) return res.status(401).json({ message: 'Token ausente.' });

  const decoded = verifyAuthToken(token);
  if (!decoded?.userId) return res.status(401).json({ message: 'Token JWT inválido.' });

  try {
    const { childId } = req.query;

    if (!childId) return res.status(400).json({ message: 'Parâmetro childId é obrigatório.' });

    const child = await prisma.itemInstance.findUnique({ where: { id: String(childId) } });
    if (!child) return res.status(404).json({ message: 'Filho não encontrado.' });

    const updated = await prisma.itemInstance.update({
      where: { id: String(childId) },
      data: { parentId: null },
    });

    return res.status(200).json({
      message: 'Filho desvinculado com sucesso.',
      child: updated,
    });
  } catch (error) {
    console.error('Erro ao desvincular filho:', error);
    return res.status(500).json({ message: 'Erro interno ao desvincular filho.' });
  }
}
