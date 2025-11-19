// pages/api/item-instances/create.ts (Leitura de JWT de Cookie)

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import * as cookie from 'cookie'; // Importar a biblioteca 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let authenticatedUserId: string | undefined;

  // --- INÍCIO: AUTENTICAÇÃO ATRAVÉS DO CABEÇALHO OU COOKIE ---
  const authHeader = req.headers.authorization;
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const tokenFromCookie = cookies.auth_token; // O nome do seu cookie é 'auth_token'

  let tokenToVerify: string | null = null;

  // Prioriza o cabeçalho Authorization, depois o cookie
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
  // --- FIM: AUTENTICAÇÃO ATRAVÉS DO CABEÇALHO OU COOKIE ---

  try {
    const { 
      itemId, 
      serialNumber, 
      location, 
      isInUse, 
      purchaseDate, 
      warrantyEndDate, 
      lastMaintenanceDate, 
      notes,
      parentId
    } = req.body;

    if (!itemId || !serialNumber) {
      return res.status(400).json({ message: 'ID do Item e Número de Série são obrigatórios.' });
    }

    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Item principal não encontrado. A instância deve pertencer a um Item existente.' });
    }

    if (parentId) {
      const existingParent = await prisma.itemInstance.findUnique({
        where: { id: parentId },
      });
      if (!existingParent) {
        return res.status(400).json({ message: 'ParentId fornecido não corresponde a uma ItemInstance existente.' });
      }
    }

    const newItemInstance = await prisma.itemInstance.create({
      data: {
        itemId: itemId,
        serialNumber: serialNumber,
        location: location || null,
        isInUse: isInUse ?? false,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        notes: notes || null,
        parentId: parentId || null,
      },
    });

    return res.status(201).json({ 
      message: 'Instância do item criada com sucesso!', 
      itemInstance: newItemInstance 
    });

  } catch (error: unknown) {
    console.error('Erro ao criar instância do item:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta && (error.meta.target as string[]).includes('serialNumber')) {
        return res.status(409).json({ message: 'Número de série já existe. Cada instância deve ter um número de série único.' });
      }
    }
    return res.status(500).json({ message: 'Erro interno do servidor ao criar instância do item.' });
  }
}
