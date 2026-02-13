// pages/api/qrcode/public-get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

async function getLocationWithChildren(locationId: string) {
  const location = await prisma.itemInstance.findUnique({
    where: { id: locationId },
    include: {
      items: {
        select: {
          id: true,
          color: true,
          tag: true,
          imageUrl: true,
          serialNumber: true,
          definition: {
            select: { 
              name: true, 
              manufacturer: true, 
              model: true, 
              imageUrl: true, 
              sku: true,
              datasheetUrl: true
            }
          }
        }
      },
      children: {
        select: { id: true }
      }
    }
  });

  if (!location) return null;

  const currentSection = {
    id: location.id,
    name: location.name,
    type: 'LOCATION',
    items: location.items.map(item => ({
      id: item.id,
      name: item.definition.name,
      manufacturer: item.definition.manufacturer,
      model: item.definition.model,
      sku: item.definition.sku,
      serialNumber: item.serialNumber,
      color: item.color,
      image: item.imageUrl || item.definition.imageUrl,
      tag: item.tag,
      datasheetUrl: item.definition.datasheetUrl,
    }))
  };

  let allSections = [currentSection];

  if (location.children && location.children.length > 0) {
    for (const child of location.children) {
      const childSections = await getLocationWithChildren(child.id);
      if (childSections) {
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