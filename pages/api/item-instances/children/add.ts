// pages/api/item-instances/children/add.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '@/lib/auth';
import * as cookie from 'cookie';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- AUTENTICAÇÃO ---
  const authHeader = req.headers.authorization;
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticação ausente.' });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded?.userId) {
    return res.status(401).json({ message: 'Token JWT inválido.' });
  }

  try {
    const { parentId, itemId, serialNumber, location, isInUse, purchaseDate, warrantyEndDate, lastMaintenanceDate, notes } = req.body;

    if (!parentId || !itemId || !serialNumber) {
      return res.status(400).json({ message: 'Campos obrigatórios: parentId, itemId e serialNumber.' });
    }

    // Verifica se o pai existe
    const parent = await prisma.itemInstance.findUnique({ where: { id: parentId } });
    if (!parent) {
      return res.status(404).json({ message: 'Instância pai não encontrada.' });
    }

    // Cria o filho vinculado
    const newChild = await prisma.itemInstance.create({
      data: {
        itemId,
        serialNumber,
        location: location || null,
        isInUse: isInUse ?? false,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        notes: notes || null,
        parentId,
      },
    });

    return res.status(201).json({
      message: 'Filho criado e vinculado com sucesso.',
      child: newChild,
    });
  } catch (error) {
    console.error('Erro ao adicionar filho:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Número de série já existe.' });
    }
    return res.status(500).json({ message: 'Erro interno ao adicionar filho.' });
  }
}
