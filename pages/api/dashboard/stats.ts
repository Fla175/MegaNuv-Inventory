// pages/api/dashboard/stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    // 1. Estatísticas de Ativos
    const activeStats = await prisma.active.aggregate({
      _sum: { fixedValue: true, quantity: true },
      _count: { id: true }
    });

    // 2. Cálculo do Valor Total do Inventário
    const inventoryValues = await prisma.active.findMany({
      select: { fixedValue: true, quantity: true }
    });

    const totalValue = inventoryValues.reduce((acc, item) => {
      return acc + ((item.fixedValue || 0) * (item.quantity || 1));
    }, 0);

    // 3. Contagem de Espaços
    const totalFatherSpaces = await prisma.fatherSpace.count();
    const totalPhysicalSpaces = await prisma.active.count({ where: { isPhysicalSpace: true } });
    const totalSpaces = totalFatherSpaces + totalPhysicalSpaces;

    // 4. Ativos agrupados por Área (Para a nova seção e o Pop-up)
    const allActives = await prisma.active.findMany({
      select: {
        id: true,
        name: true,
        tag: true,
        area: true,
        quantity: true
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assetsByArea = allActives.reduce((acc: any, active) => {
      const area = active.area || 'OUTROS';
      if (!acc[area]) acc[area] = [];
      acc[area].push(active);
      return acc;
    }, {});

    // 5. Listagens Recentes
    const recentActives = await prisma.active.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { imageUrl: true, id: true, name: true, tag: true, area: true, createdAt: true }
    });

    const recentMovements = await prisma.active.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: { imageUrl: true, id: true, name: true, tag: true, area: true, updatedAt: true }
    });
    
    return res.status(200).json({
      totalValue: totalValue || 0,
      totalActives: activeStats._count.id || 0,
      totalActivesQuantity: activeStats._sum.quantity || 0,
      totalSpaces: totalSpaces,
      fatherSpaces: totalFatherSpaces,
      PhysicalSpaces: totalPhysicalSpaces,
      recentActives: recentActives || [],
      recentMovements: recentMovements || [],
      assetsByArea: assetsByArea // Novo campo com os dados para o Modal
    });

  } catch (error) {
    console.error("ERRO dashboard/stats:", error);
    return res.status(500).json({ 
      error: 'Falha ao processar estatísticas do dashboard',
      totalValue: 0,
      totalActives: 0,
      totalActivesQuantity: 0,
      totalSpaces: 0,
      fatherSpaces: 0,
      PhysicalSpaces: 0,
      recentActives: [],
      recentMovements: [],
      assetsByArea: {}
    });
  }
}