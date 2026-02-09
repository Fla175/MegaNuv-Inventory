// pages/api/item-instances/children/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Método não permitido' });

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = req.headers.authorization?.split(' ')[1] || cookies.auth_token;
  if (!token || !verifyAuthToken(token)) return res.status(401).json({ message: 'Não autorizado' });

  const id = String(req.query.childId || req.body.childId || '');

  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'ID inválido ou ausente.' });
  }

  try {
    // 1. Coleta todos os IDs da hierarquia
    const descendants = await getDescendantsIds(id);
    const allTargetIds = [id, ...descendants];

    // 2. Executa a deleção protegida por Transaction
    await prisma.$transaction(async (tx) => {
      await tx.item.deleteMany({
        where: { 
          locationId: { in: allTargetIds } 
        }
      });

      await tx.itemInstance.delete({
        where: { id: id }
      });
    });

    return res.status(200).json({ message: 'Subespaço e todos os seus itens foram eliminados.' });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[PRISMA_DELETE_FATAL]:", error);

    // Erro P2025: Record to delete does not exist
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'ID inexistente.' });
    }

    // Erro P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      return res.status(409).json({ 
        message: 'Conflito de dependência: verifique vínculos de inventário ativos.' 
      });
    }

    return res.status(500).json({ error: error.message });
  }
}

async function getDescendantsIds(parentId: string): Promise<string[]> {
  const children = await prisma.itemInstance.findMany({
    where: { parentId },
    select: { id: true }
  });

  let ids = children.map(child => child.id);
  
  for (const child of children) {
    const subIds = await getDescendantsIds(child.id);
    ids = [...ids, ...subIds];
  }
  
  return ids;
}