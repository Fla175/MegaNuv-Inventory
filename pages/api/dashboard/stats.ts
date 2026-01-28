// pages/api/dashboard/stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    // 1. Contagem de Itens (Ativos)
    const totalAtivos = await prisma.item.count();

    // 2. Soma de Valor (Soma o fixedValue da tabela ItemInstance)
    const valueStats = await prisma.itemInstance.aggregate({
      _sum: { fixedValue: true }
    });

    // 3. Contagem de Espaços
    const totalEspacos = await prisma.itemInstance.count();
    const espacosPai = await prisma.itemInstance.count({ where: { parentId: null } });
    const subEspacos = await prisma.itemInstance.count({ where: { parentId: { not: null } } });

    // 4. Últimos Ativos (Com include para pegar o nome da definição)
    const recentAtivosRaw = await prisma.item.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { definition: { select: { name: true } } }
    });

    const recentAtivos = recentAtivosRaw.map(item => ({
      id: item.id,
      name: item.definition?.name || "Sem Nome",
      tag: item.tag || "N/A"
    }));

    // SEMPRE retorne um status e um objeto JSON
    return res.status(200).json({
      totalValue: valueStats._sum?.fixedValue ?? 0,
      totalAtivos: totalAtivos || 0,
      totalEspacos: totalEspacos || 0,
      espacosPai: espacosPai || 0,
      subEspacos: subEspacos || 0,
      recentAtivos: recentAtivos || []
    });

  } catch (error) {
    console.error("ERRO DASHBOARD API:", error);
    // Em caso de erro, retorna um objeto vazio mas VÁLIDO para o JSON.parse não quebrar
    return res.status(500).json({ 
      error: 'Falha ao processar estatísticas',
      totalValue: 0,
      totalAtivos: 0,
      totalEspacos: 0,
      espacosPai: 0,
      subEspacos: 0,
      recentAtivos: []
    });
  }
}