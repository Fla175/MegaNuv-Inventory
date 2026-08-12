// pages/api/actives/clone-batch.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma, generateUniqueHexId } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { activeIds, quantity = 1, destinationSpaceId } = req.body;

    if (!activeIds || !Array.isArray(activeIds) || activeIds.length === 0) {
      return res.status(400).json({ error: 'Nenhum ativo selecionado para clonagem.' });
    }

    const qty = Math.max(1, Math.min(Number(quantity) || 1, 50));

    // Busca os ativos originais no banco
    const sourceActives = await prisma.active.findMany({
      where: {
        id: { in: activeIds },
      },
    });

    if (sourceActives.length === 0) {
      return res.status(404).json({ error: 'Nenhum dos ativos selecionados foi encontrado.' });
    }

    // Variáveis com tipos estritos para o Prisma
    let resolvedFatherSpaceId: string | undefined = undefined;
    let resolvedParentId: string | null = null;

    if (destinationSpaceId) {
      // 1. Tenta encontrar o destino como um Espaço Pai (FatherSpace)
      const space = await prisma.fatherSpace.findUnique({
        where: { id: destinationSpaceId }
      });

      if (space) {
        resolvedFatherSpaceId = space.id;
        resolvedParentId = null;
      } else {
        // 2. Se não for espaço pai, verifica se é um Espaço Físico / Container (Active)
        const container = await prisma.active.findUnique({
          where: { id: destinationSpaceId }
        });

        if (container) {
          resolvedParentId = container.id;
          // Herda o fatherSpaceId obrigatorio do container pai
          resolvedFatherSpaceId = container.fatherSpaceId; 
        } else {
          return res.status(400).json({ error: 'O local de destino informado é inválido ou foi excluído.' });
        }
      }
    }

    const newActivesData: Prisma.ActiveCreateManyInput[] = [];

    for (const active of sourceActives) {
      for (let i = 1; i <= qty; i++) {

        // Garante que o valor final seja estritamente 'string'
        const targetFatherSpaceId: string = resolvedFatherSpaceId ?? active.fatherSpaceId;
        const targetParentId: string | null = destinationSpaceId ? resolvedParentId : active.parentId;

        newActivesData.push({
          id: await generateUniqueHexId(prisma.active),
          name: active.name,
          sku: active.sku,
          serialNumber: null, 
          fatherSpaceId: targetFatherSpaceId,
          parentId: targetParentId,
          categoryId: active.categoryId ?? null,
          manufacturer: active.manufacturer ?? null,
          model: active.model ?? null,
          fixedValue: active.fixedValue ?? 0,
          notes: active.notes ?? null,
          imageUrl: active.imageUrl ?? null,
          fileUrl: active.fileUrl ?? null,
          isPhysicalSpace: active.isPhysicalSpace ?? false,
        });
      }
    }

    // Gravação em lote com prisma.active.createMany
    const result = await prisma.active.createMany({
      data: newActivesData,
    });

    return res.status(200).json({
      message: 'Ativos clonados com sucesso.',
      count: result.count,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Erro interno do servidor ao tentar clonar ativos.';
    console.error('Erro ao clonar em lote:', error);
    return res.status(500).json({
      error: errMessage,
    });
  }
}