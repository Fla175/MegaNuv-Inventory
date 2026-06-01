// pages/api/dashboard/stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Sessão expirada." });

  try {
    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { role: string };
    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Acesso negado." });

    const activeStats = await prisma.active.aggregate({
      _sum: { fixedValue: true },
      _count: { id: true }
    });

    const allCategoriesList = await prisma.category.findMany({
      select: { id: true, name: true, color: true }
    });

    const totalValue = activeStats._sum.fixedValue || 0;
    const totalActives = activeStats._count.id || 0;
    const totalCategories = allCategoriesList.length;

    const totalFatherSpaces = await prisma.fatherSpace.count();
    const totalPhysicalSpaces = await prisma.active.count({ where: { isPhysicalSpace: true } });
    const totalSpaces = totalFatherSpaces + totalPhysicalSpaces;

    const allActives = await prisma.active.findMany({
      select: {
        id: true,
        name: true,
        tag: true,
        isPhysicalSpace: true,
        category: {
          select: { name: true, color: true }
        }
      }
    });

    const assetsByCategory = allActives.reduce<Record<string, typeof allActives>>((acc, active) => {
      const categoryName = active.category?.name || 'OUTROS';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(active);
      return acc;
    }, {});

    const rawRecentActives = await prisma.active.findMany({
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

    const recentActives = rawRecentActives.map(ativo => ({
      ...ativo,
      createdAt: ativo.createdAt ? ativo.createdAt.toISOString() : undefined
    }));

    const movementsHistory = await prisma.movement.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        active: {
          select: {
            imageUrl: true,
            id: true,
            name: true,
            tag: true,
            category: { select: { name: true, color: true } }
          }
        }
      }
    });

    const spaceIds = new Set<string>();
    movementsHistory.forEach(mov => {
      if (mov.fromSpaceId) spaceIds.add(mov.fromSpaceId);
      if (mov.toSpaceId) spaceIds.add(mov.toSpaceId);
    });
    const uniqueSpaceIds = Array.from(spaceIds);

    const [fatherSpacesDb, physicalSpacesDb] = await Promise.all([
      prisma.fatherSpace.findMany({
        where: { id: { in: uniqueSpaceIds } },
        select: { id: true, name: true }
      }),
      prisma.active.findMany({
        where: { 
          id: { in: uniqueSpaceIds },
          isPhysicalSpace: true
        },
        select: { id: true, name: true }
      })
    ]);

    const spaceNameMap = new Map<string, string>();
    fatherSpacesDb.forEach(space => spaceNameMap.set(space.id, space.name));
    physicalSpacesDb.forEach(space => spaceNameMap.set(space.id, space.name));

    const recentMovements = movementsHistory.map(mov => {
      const fromName = spaceNameMap.get(mov.fromSpaceId) || `Espaço (${mov.fromSpaceId.substring(0, 5)}...)`;
      const toName = spaceNameMap.get(mov.toSpaceId) || `Espaço (${mov.toSpaceId.substring(0, 5)}...)`;

      return {
        imageUrl: mov.active?.imageUrl || null,
        id: mov.active?.id,
        name: mov.active?.name,
        tag: mov.active?.tag,
        category: mov.active?.category || null,
        updatedAt: mov.createdAt ? mov.createdAt.toISOString() : undefined,
        fromSpaceId: fromName,
        toSpaceId: toName,
      };
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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao processar estatísticas do dashboard';
    return res.status(500).json({ 
      error: message,
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