// pages/api/qrcode/public-get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

// Função auxiliar para buscar recursivamente
async function getLocationWithChildren(locationId: string) {
  const location = await prisma.itemInstance.findUnique({
    where: { id: locationId },
    include: {
      items: {
        include: {
          definition: {
            select: { name: true, brand: true, imageUrl: true, sku: true }
          }
        },
        where: {
          // Opcional: Se quiser mostrar apenas o que está "EM ESTOQUE"
          // tag: 'IN-STOCK' 
        }
      },
      children: {
        select: { id: true } // Pegamos apenas o ID para buscar recursivamente depois
      }
    }
  });

  if (!location) return null;

  // Formata o objeto atual para o formato de "Seção"
  const currentSection = {
    id: location.id,
    name: location.name,
    type: 'LOCATION',
    items: location.items.map(item => ({
      id: item.id,
      name: item.definition.name,
      brand: item.definition.brand,
      sku: item.definition.sku,
      image: item.imageUrl || item.definition.imageUrl,
      tag: item.tag,
      notes: item.notes
    }))
  };

  let allSections = [currentSection];

  // Busca recursiva dos filhos (Deep Search)
  if (location.children && location.children.length > 0) {
    for (const child of location.children) {
      const childSections = await getLocationWithChildren(child.id);
      if (childSections) {
        // Adiciona as seções do filho à lista principal
        allSections = [...allSections, ...childSections];
      }
    }
  }

  return allSections;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'ID do local é obrigatório.' });
  }

  try {
    // 1. Busca nome do local raiz para o cabeçalho
    const rootLocation = await prisma.itemInstance.findUnique({
      where: { id },
      select: { name: true, id: true }
    });

    if (!rootLocation) {
      return res.status(404).json({ message: 'Local não encontrado.' });
    }

    // 2. Gera a lista achatada de itens agrupados por subespaços
    const hierarchy = await getLocationWithChildren(id);

    // 3. Limpeza: Remove seções (subespaços) que não têm nenhum item
    // (Opcional: remova o filter se quiser mostrar gavetas vazias)
    const filteredHierarchy = hierarchy?.filter(section => section.items.length > 0) || [];

    return res.status(200).json({
      root: rootLocation,
      sections: filteredHierarchy
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao processar estrutura do local.' });
  }
}