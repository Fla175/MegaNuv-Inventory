// pages/api/qrcode/public-get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

interface SectionActive {
  id: string;
  name: string;
  imageUrl?: string | null;
  sku?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  tag?: string | null;
  fileUrl?: string | null;
  isPhysicalSpace?: boolean;
  category?: string;
  createdAt?: Date | string;
  depth: number;
}

interface Section {
  id: string;
  name: string;
  actives: SectionActive[];
}

async function buildHierarchy(id: string, name: string, isFirstLevel = false, currentDepth = 0) {
  const active = await prisma.active.findUnique({
    where: { id },
    include: {
      children: {
        include: {
          createdBy: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
      createdBy: { select: { name: true } },
      category: { select: { name: true } },
    }
  });

  if (!active) return [];

  let sections: Section[] = [];

  const allAssets = active.children;
  const physicalSpaces = active.children.filter(c => c.isPhysicalSpace);

  if (allAssets.length > 0 || isFirstLevel) {
    sections.push({
      id: active.id,
      name: isFirstLevel ? "Conteúdo Principal" : `Dentro de: ${active.name}`,
      // 👇 Injeta a profundidade correta (depth) em cada ativo desta seção
      actives: allAssets.map(a => ({
        id: a.id,
        name: a.name,
        imageUrl: a.imageUrl,
        sku: a.sku,
        manufacturer: a.manufacturer,
        model: a.model,
        serialNumber: a.serialNumber,
        tag: a.tag,
        fileUrl: a.fileUrl,
        isPhysicalSpace: !!a.isPhysicalSpace,
        category: a.category?.name,
        createdAt: a.createdAt,
        depth: currentDepth,
      }))
    });
  }

  for (const space of physicalSpaces) {
    const subSections = await buildHierarchy(space.id, space.name, false, currentDepth + 1);
    sections = [...sections, ...subSections];
  }

  return sections;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'ID inválido' });

  try {
    const rootActive = await prisma.active.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (rootActive) {
      const isSpace = rootActive.isPhysicalSpace === true;

      if (isSpace) {
        const allSections = await buildHierarchy(id, rootActive.name, true);
        return res.status(200).json({
          root: {
            ...rootActive,
            isPhysicalSpace: true,
            category: rootActive.category?.name,
            createdBy: rootActive.createdBy?.name || "Desconhecido",
          },
          sections: allSections
        });
      }

      // Se for ativo individual
      return res.status(200).json({
        root: { ...rootActive, isPhysicalSpace: false, createdBy: rootActive.createdBy?.name || "Desconhecido" },
        sections: []
      });
    }

    return res.status(404).json({ message: 'Não encontrado' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ message });
  }
}