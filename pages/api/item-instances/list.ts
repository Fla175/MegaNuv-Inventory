// pages/api/item-instances/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, onlyRoots, fetchChildren, includeItems } = req.query;

  try {
    // 1. Se passarmos um ID, queremos apenas aquele local (Inventory View Drill-down)
    if (id && id !== 'undefined') {
      const location = await prisma.itemInstance.findUnique({
        where: { id: String(id) },
        include: {
          children: true, // Subespaços imediatos
          items: includeItems === 'true' ? { include: { definition: true } } : false,
          _count: { select: { items: true, children: true } }
        }
      });
      return res.status(200).json({ itemInstances: location ? [location] : [] });
    }

    // 2. Se não tem ID, mas queremos a ÁRVORE COMPLETA (Actives / Dashboard)
    if (fetchChildren === 'true' && !id) {
      const allData = await prisma.itemInstance.findMany({
        include: {
          items: includeItems === 'true' ? { include: { definition: true } } : false,
        }
      });

      // Montagem da árvore em memória (Recursão Infinita)
      const map = new Map();
      allData.forEach(item => map.set(item.id, { ...item, children: [] }));
      
      const tree: any[] = [];
      allData.forEach(item => {
        if (item.parentId && map.has(item.parentId)) {
          map.get(item.parentId).children.push(map.get(item.id));
        } else {
          tree.push(map.get(item.id));
        }
      });

      // Se quiser apenas as raízes da árvore
      if (onlyRoots === 'true') {
        return res.status(200).json({ itemInstances: tree });
      }
      return res.status(200).json({ itemInstances: Array.from(map.values()) });
    }

    // 3. Caso padrão: Lista simples (Raízes ou Tudo)
    const items = await prisma.itemInstance.findMany({
      where: onlyRoots === 'true' ? { parentId: null } : {},
      include: { _count: { select: { items: true, children: true } } }
    });

    return res.status(200).json({ itemInstances: items });

  } catch (error) {
    console.error("Erro na API:", error);
    return res.status(500).json({ message: "Erro ao buscar dados." });
  }
}