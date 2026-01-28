// pages/api/item-instances/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';
import * as cookie from 'cookie';
import { deleteFileFromMinio } from '@/lib/minio'; // <--- Importação do helper

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const cookies = cookie.parse(req.headers.cookie || '');
  const token = req.headers.authorization?.split(' ')[1] || cookies.auth_token;
  if (!token) return res.status(401).json({ message: 'Não autorizado' });

  const { id, force } = req.query;

  if (!id) return res.status(400).json({ message: 'ID é obrigatório' });

  try {
    const instance = await prisma.itemInstance.findUnique({
      where: { id: String(id) },
      include: {
        children: { select: { id: true } },
        _count: { select: { items: true, children: true } }
      }
    });

    if (!instance) return res.status(404).json({ message: "Espaço não encontrado." });

    const hasContent = instance._count.items > 0 || instance._count.children > 0;

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

    if (force === 'true') {
      // 1. Alteramos a função para coletar IDs e ImageUrls (para limpeza do MinIO)
      const getDescendantsData = async (parentId: string): Promise<{id: string, imageUrl: string | null}[]> => {
        const children = await prisma.itemInstance.findMany({
          where: { parentId },
          select: { id: true, imageUrl: true }
        });
        
        let data = children.map(c => ({ id: c.id, imageUrl: c.imageUrl }));
        for (const child of children) {
          const subData = await getDescendantsData(child.id);
          data = [...data, ...subData];
        }
        return data;
      };

      const descendants = await getDescendantsData(String(id));
      
      // 2. Criamos a lista completa de alvos (Pai + Descendentes)
      const allTargetData = [
        { id: instance.id, imageUrl: (instance as any).imageUrl }, // Cast caso o TS reclame do schema ainda não migrado
        ...descendants
      ];
      
      const allTargetIds = allTargetData.map(item => item.id);

      // 3. LIMPEZA MINIO: Deleta as imagens de todos os espaços que serão apagados
      for (const item of allTargetData) {
        if (item.imageUrl) {
          await deleteFileFromMinio(item.imageUrl);
        }
      }

      // 4. Executa a limpeza no Banco (Sua lógica original preservada)
      await prisma.$transaction([
        prisma.item.deleteMany({
          where: { locationId: { in: allTargetIds } }
        }),
        prisma.itemInstance.delete({
          where: { id: String(id) }
        })
      ]);
    } else {
      // Se não for forçado (espaço vazio), deleta a imagem do pai e o registro
      if ((instance as any).imageUrl) {
        await deleteFileFromMinio((instance as any).imageUrl);
      }
      await prisma.itemInstance.delete({ where: { id: String(id) } });
    }

    return res.status(200).json({ success: true, message: "Espaço e mídias removidos." });

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