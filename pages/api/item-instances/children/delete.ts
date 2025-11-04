// pages/api/item-instances/children/delete.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { verifyAuthToken } from '../../../../lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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
    const { childId, recursive } = req.query;

    if (!childId) return res.status(400).json({ message: 'Parâmetro childId é obrigatório.' });

    const recursiveDelete = recursive === 'true';

    // --- Função recursiva: apaga filhos e subfilhos ---
    const deleteRecursive = async (id: string): Promise<void> => {
      const children = await prisma.itemInstance.findMany({ where: { parentId: id } });
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      await prisma.itemInstance.delete({ where: { id } });
    };

    if (recursiveDelete) {
      await deleteRecursive(String(childId));
    } else {
      await prisma.itemInstance.delete({ where: { id: String(childId) } });
    }

    return res.status(200).json({
      message: recursiveDelete
        ? 'Filho e seus descendentes deletados com sucesso.'
        : 'Filho deletado com sucesso.',
      childId,
    });
  } catch (error) {
    console.error('Erro ao deletar filho:', error);
    return res.status(500).json({ message: 'Erro interno ao deletar filho.' });
  }
}
