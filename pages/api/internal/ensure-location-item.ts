// pages/api/internal/ensure-location-item.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1] || req.cookies['auth_token'];
  if (!token || !verifyAuthToken(token)) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  try {
    // 1. Garantir Categoria (ESTRUTURA)
    let sysCategory = await prisma.category.findFirst({
      where: { name: 'ESTRUTURA' }
    });

    if (!sysCategory) {
      sysCategory = await prisma.category.create({
        data: {
          name: 'ESTRUTURA',
          color: '#6366f1',
        }
      });
    }

    // 2. Garantir um FatherSpace Base (Obrigatório pelo Schema)
    // Usando '0000' como um ID padrão de sistema para a infraestrutura raiz
    let sysFatherSpace = await prisma.fatherSpace.findFirst({
      where: { name: 'INFRAESTRUTURA SISTEMA' }
    });

    if (!sysFatherSpace) {
      sysFatherSpace = await prisma.fatherSpace.create({
        data: {
          id: '0000', 
          name: 'INFRAESTRUTURA SISTEMA',
          notes: 'Espaço pai gerado automaticamente para conter ativos de estrutura.'
        }
      });
    }
    
    // 3. Buscar ou criar o ativo base de localização
    // Usando 'ffff' como ID para este ativo de sistema
    let locationActive = await prisma.active.findFirst({
      where: { isPhysicalSpace: true },
    });

    if (!locationActive) {
      locationActive = await prisma.active.create({
        data: {
          id: 'ffff', // ID manual hexadecimal
          name: 'Estrutura de Espaço Físico',
          sku: 'SYS-BASE',
          categoryId: sysCategory.id,
          isPhysicalSpace: true,
          fatherSpaceId: sysFatherSpace.id, // Agora passamos o ID obrigatório
          tag: 'IN-USE',
          notes: 'Ativo gerado automaticamente para representar definições de estrutura física no sistema.',
          manufacturer: 'Sistema',
          model: 'Base v2',
          fixedValue: 0
        },
      });
    }

    return res.status(200).json({
      message: 'Estrutura base de Ativo Físico garantida!',
      activeId: locationActive.id,
      isPhysical: locationActive.isPhysicalSpace,
      categoryId: locationActive.categoryId,
      fatherSpaceId: locationActive.fatherSpaceId
    });

  } catch (error: unknown) {
    console.error('Erro ao garantir item de localização:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      message: 'Erro interno ao processar a estrutura de ativos.',
      error: message
    });
  }
}