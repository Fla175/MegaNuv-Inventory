// pages/api/qrcode/public-get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { minioPublicClient, BUCKET_NAME } from '@/lib/minio';
import { getMinioKeyFromUrl } from '@/lib/mediaUrl';

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

// Helpers para pré-assinatura de URLs privadas no MinIO
const signMedia = async (url: string | null | undefined): Promise<string | null> => {
  if (!url) return null;
  const key = getMinioKeyFromUrl(url);
  if (!key) return url;
  try {
    return await minioPublicClient.presignedGetObject(BUCKET_NAME, key, 3600);
  } catch {
    return url;
  }
};

const signFileUrl = async (fileUrl: string | null | undefined): Promise<string | null> => {
  if (!fileUrl) return null;
  let urls: string[];
  try {
    const parsed = JSON.parse(fileUrl);
    urls = Array.isArray(parsed) ? parsed.map(String) : fileUrl.split(',').map(s => s.trim()).filter(Boolean);
  } catch {
    urls = fileUrl.split(',').map(s => s.trim()).filter(Boolean);
  }
  const signed = await Promise.all(urls.map(u => signMedia(u)));
  return signed.filter((u): u is string => u !== null).join(',');
};

async function buildHierarchy(id: string, name: string, isFirstLevel = false, currentDepth = 0): Promise<Section[]> {
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
    // Mapeia e assina as URLs de cada ativo de forma assíncrona
    const signedActives: SectionActive[] = await Promise.all(
      allAssets.map(async (a) => ({
        id: a.id,
        name: a.name,
        imageUrl: await signMedia(a.imageUrl),
        sku: a.sku,
        manufacturer: a.manufacturer,
        model: a.model,
        serialNumber: a.serialNumber,
        tag: a.tag,
        fileUrl: await signFileUrl(a.fileUrl),
        isPhysicalSpace: !!a.isPhysicalSpace,
        category: a.category?.name,
        createdAt: a.createdAt,
        depth: currentDepth,
      }))
    );

    sections.push({
      id: active.id,
      name: isFirstLevel ? "Conteúdo Principal" : `Dentro de: ${active.name}`,
      actives: signedActives
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

      // Assina imagens e documentos do ativo raiz
      const signedRoot = {
        ...rootActive,
        imageUrl: await signMedia(rootActive.imageUrl),
        fileUrl: await signFileUrl(rootActive.fileUrl),
        createdBy: rootActive.createdBy?.name || "Desconhecido",
        category: rootActive.category?.name,
      };

      if (isSpace) {
        const allSections = await buildHierarchy(id, rootActive.name, true);
        return res.status(200).json({
          root: {
            ...signedRoot,
            isPhysicalSpace: true,
          },
          sections: allSections
        });
      }

      // Se for ativo individual
      return res.status(200).json({
        root: { ...signedRoot, isPhysicalSpace: false },
        sections: []
      });
    }

    return res.status(404).json({ message: 'Não encontrado' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ message });
  }
}