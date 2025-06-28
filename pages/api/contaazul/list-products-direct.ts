// pages/api/contaazul/list-products-direct.ts (Com Logs Detalhados de Token Recuperado)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth';
import * as cookie from 'cookie';

const CONTA_AZUL_API_V2_BASE_URL = process.env.CONTA_AZUL_API_V2_BASE_URL || 'https://api-v2.contaazul.com';

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
    console.warn('Token de autenticação ausente para listagem direta de produtos da Conta Azul.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação JWT válido.' });
  }

  const decodedPayload: AuthTokenPayload | null = verifyAuthToken(tokenToVerify);
  if (decodedPayload && decodedPayload.userId) {
    authenticatedUserId = decodedPayload.userId;
  } else {
    console.warn('Token JWT inválido ou sem ID para listagem direta de produtos da Conta Azul.');
    return res.status(401).json({ message: 'Não autorizado: Token JWT inválido ou ausente.' });
  }

  if (!authenticatedUserId) {
    return res.status(500).json({ message: 'Erro interno do servidor: Usuário não identificado para listagem direta de produtos da Conta Azul.' });
  }

  try {
    const integration = await prisma.contaAzulIntegration.findUnique({
      where: { userId: authenticatedUserId },
      select: { accessToken: true, expiresAt: true },
    });

    if (!integration || !integration.accessToken) {
      return res.status(404).json({ message: 'Integração Conta Azul ou access token não encontrado para o usuário.' });
    }

    // --- LOGS DETALHADOS AQUI ---
    console.log(`[LIST-DIRECT] Access Token Recuperado (primeiros 30 chars): ${integration.accessToken.substring(0, 30)}...`);
    console.log(`[LIST-DIRECT] Expires At Recuperado: ${integration.expiresAt.toISOString()}`);
    console.log(`[LIST-DIRECT] Hora Atual do Servidor: ${new Date().toISOString()}`);
    // --- FIM DOS LOGS DETALHADOS ---

    const productsResponse = await axios.get(`${CONTA_AZUL_API_V2_BASE_URL}/v1/produto/busca`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      },
      params: {
        pagina: 1,
        tamanho_pagina: 50,
        status: 'TODOS',
      },
      timeout: 10000
    });

    return res.status(200).json({
      message: 'Produtos da Conta Azul listados diretamente com sucesso!',
      products: productsResponse.data.itens,
      totalItems: productsResponse.data.itens_totais,
    });

  } catch (error: any) {
    console.error('Erro ao listar produtos diretamente da Conta Azul:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401 && error.response.data.error === 'invalid_token') {
        return res.status(401).json({ message: 'Access token da Conta Azul inválido. Por favor, reautorize a integração.', details: error.response.data });
      }
      return res.status(error.response.status).json({
        message: 'Erro ao listar produtos diretamente da Conta Azul.',
        details: error.response.data,
        status: error.response.status,
      });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
