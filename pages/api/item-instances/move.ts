// pages/api/item-instances/move.ts (Corrigido)

import type { NextApiRequest, NextApiResponse } from 'next';
// CORREÇÃO: Remova as chaves de 'prisma'
import prisma from '@/lib/prisma'; 
// Importe sua lógica de autenticação/sessão aqui, se houver.

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
  
  // TODO: Adicionar lógica para prevenir mover um pai para dentro de um filho (loop)

  try {
    // 3. Atualizar o item no banco de dados
    const updatedInstance = await prisma.itemInstance.update({
      where: {
        id: instanceId,
      },
      data: {
        parentId: newParentId,
        // Opcional: Limpar a localização explícita, já que agora está "dentro" de algo
        // location: null, 
      },
    });

    return res.status(200).json(updatedInstance);

  } catch (error: any) {
    console.error('Erro ao mover instância:', error);
    if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Instância ou novo Pai não encontrado.' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}