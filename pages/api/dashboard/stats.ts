// pages/api/dashboard/stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    // 1. Estatísticas de Ativos e Valor
    const activeStats = await prisma.active.aggregate({
      _sum: { fixedValue: true },
      _count: { id: true }
    });

    // 2. Busca todas as categorias para garantir que as vazias também apareçam
    const allCategoriesList = await prisma.category.findMany({
      select: { id: true, name: true, color: true }
    });

    const totalValue = activeStats._sum.fixedValue || 0;
    const totalActives = activeStats._count.id || 0;
    const totalCategories = allCategoriesList.length;

    // 3. Contagem de Espaços
    const totalFatherSpaces = await prisma.fatherSpace.count();
    const totalPhysicalSpaces = await prisma.active.count({ where: { isPhysicalSpace: true } });
    const totalSpaces = totalFatherSpaces + totalPhysicalSpaces;

    // 4. Ativos agrupados por Categoria
    const allActives = await prisma.active.findMany({
      where: { isPhysicalSpace: false },
      select: {
        id: true,
        name: true,
        tag: true,
        category: {
          select: { name: true, color: true }
        }
      }
    });

    // Agrupa os ativos pelo nome da categoria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assetsByCategory = allActives.reduce((acc: any, active) => {
      const categoryName = active.category?.name || 'OUTROS';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(active);
      return acc;
    }, {});

    // 5. Listagens Recentes
    const recentActives = await prisma.active.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: { 
        imageUrl: true, 
        id: true, 
        name: true, 
        tag: true, 
        category: { select: { name: true, color: true } }, 
        createdAt: true 
      }
    });

    const recentMovements = await prisma.active.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: { 
        imageUrl: true, 
        id: true, 
        name: true, 
        tag: true, 
        category: { select: { name: true, color: true } }, 
        updatedAt: true 
      }
    });
    
    return res.status(200).json({
      totalValue: totalValue,
      totalActives: totalActives,
      totalActivesQuantity: totalActives,
      totalCategories: totalCategories,
      categories: allCategoriesList,
      totalSpaces: totalSpaces,
      fatherSpaces: totalFatherSpaces,
      PhysicalSpaces: totalPhysicalSpaces,
      recentActives: recentActives || [],
      recentMovements: recentMovements || [],
      assetsByCategory: assetsByCategory
    });

  } catch (error) {
    console.error("ERRO dashboard/stats:", error);
    return res.status(500).json({ 
      error: 'Falha ao processar estatísticas do dashboard',
      totalValue: 0,
      totalActives: 0,
      totalActivesQuantity: 0,
      totalCategories: 0,
      categories: [],
      totalSpaces: 0,
      fatherSpaces: 0,
      PhysicalSpaces: 0,
      recentActives: [],
      recentMovements: [],
      assetsByCategory: {}
    });
  }
}