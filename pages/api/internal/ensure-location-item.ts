// pages/api/internal/ensure-location-item.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 1. Verificação de Autenticação (Cookie ou Header)
  const token = req.headers.authorization?.split(' ')[1] || req.cookies['auth_token'];
  if (!token || !verifyAuthToken(token)) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  try {
    // Identificador único para a estrutura base no novo modelo
    const isPhysicalSpace = true;

    /**
     * No novo Schema, não temos mais ItemDefinition.
     * Vamos usar a tabela Active com a flag isPhysicalSpace para representar
     * esse "item de localização" genérico.
     */
    
    let locationActive = await prisma.active.findFirst({
      where: { isPhysicalSpace: isPhysicalSpace },
    });

    if (!locationActive) {
      locationActive = await prisma.active.create({
        data: {
          name: 'Estrutura de Espaço Físico',
          sku: '',
          area: 'SERVIDOR',
          isPhysicalSpace: true,
          tag: 'IN-USE',
          quantity: 1,
          notes: 'Ativo gerado automaticamente para representar definições de estrutura física no sistema.',
          manufacturer: 'Sistema',
          model: 'Base v2',
          fixedValue: 0
        },
      });
    }

    // Retornamos os IDs conforme o novo mapeamento
    return res.status(200).json({
      message: 'Estrutura base de Ativo Físico garantida!',
      activeId: locationActive.id,
      isPhysical: locationActive.isPhysicalSpace,
      area: locationActive.area
    });

  } catch (error) {
    console.error('Erro ao garantir item de localização:', error);
    return res.status(500).json({ 
      message: 'Erro interno ao processar a estrutura de ativos.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}