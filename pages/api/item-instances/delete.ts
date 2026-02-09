// pages/api/item-instances/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import * as cookie from 'cookie';
import { deleteFileFromMinio } from '@/lib/minio';

interface TargetData {
  id: string;
  imageUrl: string | null;
}

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

    if ((instance._count.items > 0 || instance._count.children > 0) && force !== 'true') {
      return res.status(409).json({ 
        message: "Este espaço contém conteúdo.",
        requireConfirmation: true,
        details: { items: instance._count.items, subspaces: instance._count.children }
      });
    }

    if (force === 'true') {
      const getDescendantsData = async (parentId: string): Promise<TargetData[]> => {
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
      const allTargetData: TargetData[] = [
        { id: instance.id, imageUrl: instance.imageUrl },
        ...descendants
      ];
      
      const allTargetIds = allTargetData.map(item => item.id);

      for (const item of allTargetData) {
        if (item.imageUrl) await deleteFileFromMinio(item.imageUrl);
      }

      await prisma.$transaction([
        prisma.item.deleteMany({ where: { locationId: { in: allTargetIds } } }),
        prisma.itemInstance.delete({ where: { id: String(id) } })
      ]);
    } else {
      if (instance.imageUrl) await deleteFileFromMinio(instance.imageUrl);
      await prisma.itemInstance.delete({ where: { id: String(id) } });
    }

    return res.status(200).json({ success: true, message: "Removido." });
  } catch (error) {
    const err = error as Error;
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}