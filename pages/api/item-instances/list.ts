// pages/api/item-instances/list.ts (Com Log de Depuração)

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth'; // Verifique o caminho se necessário

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let authenticatedUserId: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decodedPayload: AuthTokenPayload | null = verifyAuthToken(token);

    if (decodedPayload && decodedPayload.userId) {
      authenticatedUserId = decodedPayload.userId;
    } else {
      console.warn('Token JWT decodificado inválido ou sem ID do usuário.');
      return res.status(401).json({ message: 'Não autorizado: Token JWT inválido ou ausente.' });
    }
  } else {
    console.warn('Cabeçalho de autenticação Bearer não encontrado.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação JWT válido.' });
  }

  if (!authenticatedUserId) {
    return res.status(500).json({ message: 'Erro interno do servidor: Usuário não identificado.' });
  }

  try {
    const { itemId, serialNumber, location, isInUse, parentId, fetchChildren } = req.query;

    const whereClause: any = {};

    if (itemId) {
      whereClause.itemId = String(itemId);
    }
    if (serialNumber) {
      whereClause.serialNumber = String(serialNumber);
    }
    if (location) {
      whereClause.location = {
        contains: String(location),
        mode: 'insensitive'
      };
    }
    if (isInUse !== undefined) {
      whereClause.isInUse = isInUse === 'true';
    }
    if (parentId !== undefined) {
      if (String(parentId).toLowerCase() === 'null') {
        whereClause.parentId = null;
      } else {
        whereClause.parentId = String(parentId);
      }
    }

    const itemInstances = await prisma.itemInstance.findMany({
      where: whereClause,
      include: {
        item: { // Inclui o Item para a instância principal
          select: {
            name: true,
            sku: true,
            contaAzulId: true,
            status: true,
            price: true,
            cost: true,
          },
        },
        parent: { // Inclui o ItemInstance pai
          select: {
            id: true,
            serialNumber: true,
            location: true,
          }
        },
        children: fetchChildren === 'true' ? {
          // CORREÇÃO: Removido o bloco 'select' direto aqui.
          // O Prisma irá incluir todos os campos escalares do filho por padrão
          // quando uma relação (como 'item') é incluída via 'include'.
          include: { // Este 'include' é para as RELAÇÕES DO MODELO FILHO
            item: { // Inclui o Item para CADA filho
                select: {
                    name: true,
                    sku: true,
                    price: true,
                    cost: true,
                }
            }
          }
        } : false,
      },
    });

    // --- CRUCIAL: Log do resultado BRUTO do Prisma. Isso nos dirá se 'item' está vindo para os filhos. ---
    console.log("Raw itemInstances from Prisma:", JSON.stringify(itemInstances, null, 2));


    // Mapear as instâncias para garantir que price e cost são Numbers
    // e para fazer a conversão dos Decimal para Number.
    const formattedItemInstances = itemInstances.map(instance => {
      // Cria uma cópia da instância para manipulação
      const formattedInstance: any = { ...instance };

      // Formata o item da instância principal
      if (formattedInstance.item) {
        formattedInstance.item.price = formattedInstance.item.price ? parseFloat(formattedInstance.item.price.toString()) : 0.00;
        formattedInstance.item.cost = formattedInstance.item.cost ? parseFloat(formattedInstance.item.cost.toString()) : null;
      }

      // Formata os itens dos filhos
      if (formattedInstance.children && Array.isArray(formattedInstance.children)) {
        formattedInstance.children = formattedInstance.children.map((child: any) => { // Tipagem 'any' temporariamente para depuração
          const formattedChild: any = { ...child };
          if (formattedChild.item) {
            formattedChild.item.price = formattedChild.item.price ? parseFloat(formattedChild.item.price.toString()) : 0.00;
            formattedChild.item.cost = formattedChild.item.cost ? parseFloat(formattedChild.item.cost.toString()) : null;
          }
          return formattedChild;
        });
      }
      return formattedInstance;
    });


    return res.status(200).json({ 
      message: 'Instâncias de itens listadas com sucesso!', 
      itemInstances: formattedItemInstances 
    });

  } catch (error) {
    console.error('Erro ao listar instâncias de itens:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao listar instâncias de itens.' });
  }
}
