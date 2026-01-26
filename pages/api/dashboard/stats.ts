// pages/api/dashboard/stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    // 1. Cálculo de ATIVOS (Model Item)
    const totalAtivos = await prisma.item.count();

    // 2. Cálculo de VALOR TOTAL (Soma do fixedValue em ItemInstance)
    const valueStats = await prisma.itemInstance.aggregate({
      _sum: {
        fixedValue: true,
      }
    });

    // 3. Estatísticas de ESPAÇOS FÍSICOS (Model ItemInstance)
    const totalEspacos = await prisma.itemInstance.count();

    const espacosPai = await prisma.itemInstance.count({
      where: { parentId: null },
    });

    const subEspacos = await prisma.itemInstance.count({
      where: { parentId: { not: null } },
    });

    // 4. Últimos 5 ATIVOS com os nomes de suas definições
    const recentAtivosRaw = await prisma.item.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        definition: {
          select: { name: true }
        }
      }
    });

    // Formatando para o frontend não quebrar
    const recentAtivos = recentAtivosRaw.map(item => ({
      id: item.id,
      name: item.definition.name, // Nome oficial vem da definição
      fixedValue: 0, // No seu schema, o valor está na Instância, não no Item
      tag: item.tag
    }));

    return res.status(200).json({
      totalValue: valueStats._sum?.fixedValue ?? 0,
      totalAtivos,
      totalEspacos,
      espacosPai,
      subEspacos,
      recentAtivos,
    });
  } catch (error) {
    console.error("ERRO DASHBOARD API:", error);
    return res.status(500).json({ error: 'Falha ao processar estatísticas' });
  }
}