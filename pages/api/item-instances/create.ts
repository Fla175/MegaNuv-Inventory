// pages/api/item-instances/create.ts (Com parentId)

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth';
import { Prisma } from '@prisma/client'; // Importe 'Prisma' para usar suas tipagens de erro

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
    const { 
      itemId, 
      serialNumber, 
      location, 
      isInUse, 
      purchaseDate, 
      warrantyEndDate, 
      lastMaintenanceDate, 
      notes,
      parentId // NOVO: parentId recebido no body
    } = req.body;

    // --- Validação básica dos dados recebidos ---
    if (!itemId || !serialNumber) {
      return res.status(400).json({ message: 'ID do Item e Número de Série são obrigatórios.' });
    }

    // Verificar se o Item principal ao qual a instância pertence existe
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      return res.status(404).json({ message: 'Item principal não encontrado. A instância deve pertencer a um Item existente.' });
    }

    // Opcional: Verificar se o parentId existe e é uma ItemInstance válida
    if (parentId) {
      const existingParent = await prisma.itemInstance.findUnique({
        where: { id: parentId },
      });
      if (!existingParent) {
        return res.status(400).json({ message: 'ParentId fornecido não corresponde a uma ItemInstance existente.' });
      }
    }

    // Criar a nova instância do item
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
        parentId: parentId || null, // NOVO: Salvar o parentId
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
