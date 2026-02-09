// pages/api/item-instances/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, onlyRoots, fetchChildren, includeItems } = req.query;

  try {
    if (id && id !== 'undefined') {
      const location = await prisma.itemInstance.findUnique({
        where: { id: String(id) },
        include: {
          children: {
            include: {
              _count: { select: { items: true, children: true } }
            }
          },
          items: includeItems === 'true' ? { include: { definition: true } } : false,
          _count: { select: { items: true, children: true } }
        }
      });
      return res.status(200).json({ itemInstances: location ? [location] : [] });
    }

    if (fetchChildren === 'true' && !id) {
      const allData = await prisma.itemInstance.findMany({
        include: {
          items: includeItems === 'true' ? { include: { definition: true } } : false,
          _count: { select: { items: true, children: true } }
        }
      });

      const map = new Map();
      allData.forEach(item => {
        map.set(item.id, { 
          ...item, 
          children: [],
          totalAtivos: item._count?.items || 0 
        });
      });
      
      const tree: unknown[] = []; // Alterado de any[] para unknown[]
      allData.forEach(item => {
        const current = map.get(item.id);
        if (item.parentId && map.has(item.parentId)) {
          map.get(item.parentId).children.push(current);
        } else {
          tree.push(current);
        }
      });

      if (onlyRoots === 'true') {
        return res.status(200).json({ itemInstances: tree });
      }
      return res.status(200).json({ itemInstances: Array.from(map.values()) });
    }

    const items = await prisma.itemInstance.findMany({
      where: onlyRoots === 'true' ? { parentId: null } : {},
      include: { 
        _count: { select: { items: true, children: true } } 
      }
    });

    return res.status(200).json({ itemInstances: items });

  } catch (error) {
    const err = error as Error;
    console.error("Erro na API:", err.message);
    return res.status(500).json({ message: "Erro ao buscar dados." });
  }
}