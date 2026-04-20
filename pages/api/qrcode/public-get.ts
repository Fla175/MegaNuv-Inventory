// pages/api/qrcode/public-get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

interface SectionItem {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdBy?: { name: string | null } | string | null;
}

interface Section {
  id: string;
  name: string;
  items: SectionItem[];
}

// Função auxiliar para buscar filhos recursivamente e montar as seções
async function buildHierarchy(id: string, name: string, isFirstLevel = false) {
  const active = await prisma.active.findUnique({
    where: { id },
    include: {
      children: {
        include: { createdBy: { select: { name: true } } }
      },
      createdBy: { select: { name: true } }
    }
  });

  if (!active) return [];

  let sections: Section[] = [];
  
  // Itens que NÃO são espaços (ativos puros) nesta seção
  const assetsOnly = active.children.filter(c => !c.isPhysicalSpace);
  // Itens que SÃO espaços (sub-espaços)
  const subSpaces = active.children.filter(c => c.isPhysicalSpace);

  // Adiciona a seção atual se ela tiver ativos ou se for o nível raiz
  if (assetsOnly.length > 0 || isFirstLevel) {
    sections.push({
      id: active.id,
      name: isFirstLevel ? "Conteúdo Principal" : `Dentro de: ${active.name}`,
      items: assetsOnly.map(a => ({
        ...a,
        image: a.imageUrl,
        createdBy: a.createdBy?.name || "Sistema"
      }))
    });
  }

  // Para cada sub-espaço, chamamos a função recursivamente para trazer os itens DELES
  for (const space of subSpaces) {
    const subSections = await buildHierarchy(space.id, space.name);
    sections = [...sections, ...subSections];
  }

  return sections;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'ID inválido' });

  try {
    // 1. Tenta buscar na tabela ACTIVE (o caso do seu Gabinete/SDKNGAMK)
    const rootActive = await prisma.active.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true } } }
    });

    if (rootActive) {
      const isSpace = rootActive.isPhysicalSpace === true;

      if (isSpace) {
        const allSections = await buildHierarchy(id, rootActive.name, true);
        return res.status(200).json({
          root: {
            ...rootActive,
            isPhysicalSpace: true,
            createdBy: rootActive.createdBy?.name || "Sistema"
          },
          sections: allSections
        });
      }

      // Se for ativo individual
      return res.status(200).json({
        root: { ...rootActive, isPhysicalSpace: false, createdBy: rootActive.createdBy?.name || "Sistema" },
        sections: []
      });
    }

    return res.status(404).json({ message: 'Não encontrado' });
  } catch (error) {
    error = 'Erro interno';
    return res.status(500).json({ message: error });
  }
}