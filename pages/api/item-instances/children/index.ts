// pages/api/item-instances/children/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
    const { parentId, recursive } = req.query;

    if (!parentId) {
      return res.status(400).json({ message: 'Parâmetro "parentId" é obrigatório.' });
    }

    const recursiveSearch = recursive === 'true';

    // Função recursiva para buscar filhos e subfilhos
    const fetchChildren = async (id: string): Promise<any[]> => {
      const children = await prisma.itemInstance.findMany({
        where: { parentId: id },
        include: {
          item: {
            select: { name: true, sku: true, price: true, cost: true },
          },
          children: recursiveSearch
            ? {
                include: {
                  item: { select: { name: true, sku: true, price: true, cost: true } },
                },
              }
            : false,
        },
      });

      if (recursiveSearch) {
        for (const child of children) {
          child.children = await fetchChildren(child.id);
        }
      }

      return children;
    };

    const children = await fetchChildren(String(parentId));

    return res.status(200).json({
      message: 'Filhos listados com sucesso.',
      parentId,
      children,
    });
  } catch (error) {
    console.error('Erro ao listar filhos:', error);
    return res.status(500).json({ message: 'Erro interno ao listar filhos.' });
  }
}
