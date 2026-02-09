// pages/api/item-instances/move.ts (Corrigido)
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; 

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  // 1. Apenas aceitar o método PATCH
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Obter e validar dados do corpo da requisição
  const { instanceId, newParentId } = req.body;

  if (!instanceId || !newParentId) {
    return res.status(400).json({ message: 'instanceId e newParentId são obrigatórios.' });
  }

  if (instanceId === newParentId) {
    return res.status(400).json({ message: 'Um item não pode ser movido para dentro de si mesmo.' });
  }

  try {
    // 3. Atualizar o item no banco de dados
    const updatedInstance = await prisma.itemInstance.update({
      where: {
        id: instanceId,
      },
      data: {
        parentId: newParentId,
      },
    });

    return res.status(200).json(updatedInstance);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Erro ao mover instância:', error);
    if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Instância ou novo Pai não encontrado.' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}