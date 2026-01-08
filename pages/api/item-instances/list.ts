// pages/api/item-instances/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id, onlyRoots, fetchChildren, includeItems } = req.query;

  try {
    // Definição do Include para reutilizar recursivamente (até 3 níveis de profundidade para performance)
    const selectItems = {
      id: true,
      serialNumber: true,
      purchaseDate: true,
      usefulLifeMonths: true,
      definition: {
        select: { name: true, sku: true, cost: true }
      }
    };

    const commonInclude = {
      _count: { select: { items: true, children: true } }, // Garante que a contagem venha correta
      items: includeItems === 'true' ? { select: selectItems } : false,
    };

    // Construção da Query
    const whereClause: any = {};
    if (id) whereClause.id = String(id);
    else if (onlyRoots === 'true') whereClause.parentId = null;

    // Prisma não suporta recursão infinita no include, então definimos manualmente 3 níveis
    // Isso resolve o problema de "não ver itens dentro de subespaços" na tela de Mover
    const deepInclude = fetchChildren === 'true' ? {
      ...commonInclude,
      children: {
        include: {
          ...commonInclude,
          children: { // Nível 2
            include: {
              ...commonInclude,
              children: { // Nível 3
                include: commonInclude
              }
            }
          }
        }
      }
    } : commonInclude;

    const itemInstances = await prisma.itemInstance.findMany({
      where: whereClause,
      include: deepInclude,
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({ itemInstances });
  } catch (error: any) {
    console.error("Erro API:", error);
    return res.status(500).json({ message: error.message });
  }
}