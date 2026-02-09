// pages/api/item-instances/children/add.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1] || req.cookies['auth_token'];

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticação ausente.' });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded?.userId) {
    return res.status(401).json({ message: 'Token JWT inválido.' });
  }

  try {
    const { parentId, name, imageUrl, fixedValue } = req.body;

    if (!parentId || !name) {
      return res.status(400).json({ message: 'Campos obrigatórios: parentId e name.' });
    }

    const parent = await prisma.itemInstance.findUnique({ 
      where: { id: parentId } 
    });
    
    if (!parent) {
      return res.status(404).json({ message: 'Local pai não encontrado.' });
    }

    const newChild = await prisma.itemInstance.create({
      data: {
        name: name,
        parentId: parentId,
        imageUrl: imageUrl || null,
        fixedValue: Number(fixedValue) || 0,
      },
    });

    return res.status(201).json({
      message: 'Sub-local criado com sucesso.',
      child: newChild,
    });

  } catch (error) {
    console.error('Erro ao adicionar sub-local:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Já existe um local com este nome.' });
    }
    
    return res.status(500).json({ message: 'Erro interno ao adicionar sub-local.' });
  }
}