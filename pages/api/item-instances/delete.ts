// pages/api/item-instances/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = req.headers.authorization?.split(' ')[1] || cookies.auth_token;
  if (!token) return res.status(401).json({ message: 'Não autorizado' });

  const { id, force } = req.query;

  if (!id) return res.status(400).json({ message: 'ID é obrigatório' });

  try {
    // 1. Busca profunda para verificar dependências
    const instance = await prisma.itemInstance.findUnique({
      where: { id: String(id) },
      include: {
        children: {
          select: { id: true }
        },
        _count: {
          select: { items: true, children: true }
        }
      }
    });

    if (!instance) return res.status(404).json({ message: "Espaço não encontrado." });

    const hasContent = instance._count.items > 0 || instance._count.children > 0;

    // 2. Bloqueio de segurança sem confirmação
    if (hasContent && force !== 'true') {
      return res.status(409).json({ 
        message: "Este espaço contém itens ou subespaços.",
        requireConfirmation: true,
        details: {
          items: instance._count.items,
          subspaces: instance._count.children
        }
      });
    }

    // 3. Exclusão em Cadeia Manual (Garante que o MySQL não bloqueie)
    if (force === 'true') {
      // Função recursiva para coletar IDs de todos os subespaços (descendentes)
      const getAllDescendantIds = async (parentId: string): Promise<string[]> => {
        const children = await prisma.itemInstance.findMany({
          where: { parentId },
          select: { id: true }
        });
        
        let ids = children.map(c => c.id);
        for (const child of children) {
          const subIds = await getAllDescendantIds(child.id);
          ids = [...ids, ...subIds];
        }
        return ids;
      };

      const descendantIds = await getAllDescendantIds(String(id));
      const allTargetIds = [String(id), ...descendantIds];

      // Executa a limpeza em uma transação para garantir que ou apaga tudo ou nada
      await prisma.$transaction([
        // Limpa os itens de TODOS os espaços envolvidos (Pai e Filhos)
        prisma.item.deleteMany({
          where: { locationId: { in: allTargetIds } }
        }),
        // Deleta os espaços (O Prisma cuidará da ordem inversa devido à relação)
        prisma.itemInstance.delete({
          where: { id: String(id) }
        })
      ]);
    } else {
      // Se estiver vazio, deleta direto
      await prisma.itemInstance.delete({ where: { id: String(id) } });
    }

    return res.status(200).json({ success: true, message: "Espaço e conteúdos removidos." });

  } catch (error: any) {
    console.error("[DELETE LOCATION ERROR]:", error);
    if (error.code === 'P2003') {
      return res.status(409).json({ 
        message: "Erro de restrição: Remova os produtos manualmente antes de excluir este espaço." 
      });
    }
    return res.status(500).json({ message: error.message });
  }
}