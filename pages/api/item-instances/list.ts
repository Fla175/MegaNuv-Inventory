// pages/api/item-instances/list.ts (Remoção de mode: 'insensitive')

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let authenticatedUserId: string | undefined;

  const authHeader = req.headers.authorization;
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const tokenFromCookie = cookies.auth_token;

  let tokenToVerify: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenToVerify = authHeader.split(' ')[1];
  } else if (tokenFromCookie) {
    tokenToVerify = tokenFromCookie;
  }

  if (!tokenToVerify) {
    console.warn('Token de autenticação ausente no cabeçalho ou cookie.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação JWT válido.' });
  }

  const decodedPayload: AuthTokenPayload | null = verifyAuthToken(tokenToVerify);

  if (decodedPayload && decodedPayload.userId) {
    authenticatedUserId = decodedPayload.userId;
  } else {
    console.warn('Token JWT inválido ou sem ID do usuário.');
    return res.status(401).json({ message: 'Não autorizado: Token JWT inválido.' });
  }

  if (!authenticatedUserId) {
    return res.status(500).json({ message: 'Erro interno do servidor: Usuário não identificado após decodificação.' });
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
        // CORREÇÃO: Removido 'mode: "insensitive"'
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
        item: {
          select: {
            name: true,
            sku: true,
            contaAzulId: true,
            status: true,
            price: true,
            cost: true,
          },
        },
        parent: {
          select: {
            id: true,
            serialNumber: true,
            location: true,
          }
        },
        children: fetchChildren === 'true' ? {
          include: {
            item: {
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

    const formattedItemInstances = itemInstances.map(instance => {
      const formattedInstance: any = { ...instance };

      if (formattedInstance.item) {
        formattedInstance.item.price = formattedInstance.item.price ? parseFloat(formattedInstance.item.price.toString()) : 0.00;
        formattedInstance.item.cost = formattedInstance.item.cost ? parseFloat(formattedInstance.item.cost.toString()) : null;
      }

      if (formattedInstance.children && Array.isArray(formattedInstance.children)) {
        formattedInstance.children = formattedInstance.children.map((child: any) => {
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
