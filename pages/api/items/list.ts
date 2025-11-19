// pages/api/items/list.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '@/lib/auth';
import * as cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let authenticatedUserId: string | undefined;

  // --- Autenticação (via Cabeçalho ou Cookie) ---
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
  // --- Fim da Autenticação ---

  try {
    // Parâmetros de filtro opcionais (ex: por nome, SKU, status)
    const { name, sku, status, contaAzulId } = req.query;

    const whereClause: any = {};
    if (name) {
      whereClause.name = {
        contains: String(name),
        mode: 'insensitive', // MySQL pode não suportar 'insensitive' diretamente, mas a query ainda funcionará
      };
    }
    if (sku) {
      whereClause.sku = String(sku);
    }
    if (status) {
      whereClause.status = String(status);
    }
    if (contaAzulId) {
      whereClause.contaAzulId = String(contaAzulId);
    }

    // Buscar todos os itens (produtos)
    const items = await prisma.item.findMany({
      where: whereClause,
      // Você pode adicionar ordenação aqui, se quiser (ex: orderBy: { name: 'asc' })
      orderBy: {
        name: 'asc'
      },
    });

    // Formatar os decimais (price, cost) para float/number antes de enviar a resposta
    const formattedItems = items.map(item => ({
      ...item,
      price: item.price ? parseFloat(item.price.toString()) : 0.00,
      cost: item.cost ? parseFloat(item.cost?.toString() || '0') : null, // Garante que cost é float ou null
      tags: item.tags ? (item.tags as any) : [], // Garante que tags é um array, assume que está como Json
    }));

    return res.status(200).json({
      message: 'Itens listados com sucesso!',
      items: formattedItems,
    });

  } catch (error) {
    console.error('Erro ao listar itens:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao listar itens.' });
  }
}
