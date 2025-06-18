// pages/api/contaazul/products.ts (Axios Keep-Alive e Timeout)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth';

const CONTAAZUL_API_BASE_URL = 'https://api-v2.contaazul.com';
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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
      console.warn('Token JWT decodificado, mas userId não encontrado no payload ou payload é nulo.');
      return res.status(401).json({ message: 'Não autorizado: ID de usuário ausente no token JWT.' });
    }
  } else {
    console.warn('Cabeçalho de autenticação Bearer não encontrado ou formato inválido.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação JWT válido.' });
  }

  if (!authenticatedUserId) {
    return res.status(500).json({ message: 'Erro interno do servidor: Usuário não identificado.' });
  }

  try {
    let integration = await prisma.contaAzulIntegration.findUnique({
      where: { userId: authenticatedUserId },
      select: { accessToken: true, refreshToken: true, expiresAt: true },
    });

    if (!integration || !integration.accessToken || !integration.refreshToken) {
      return res.status(404).json({ message: 'Integração Conta Azul não encontrada para este usuário ou tokens ausentes.' });
    }

    const now = new Date();
    console.log(`Current Time (UTC): ${now.toISOString()}`);
    console.log(`Access Token Expires At (UTC): ${integration.expiresAt.toISOString()}`);

    const tokenIsExpiredOrSoonToExpire = integration.expiresAt.getTime() - now.getTime() < (5 * 60 * 1000);

    if (tokenIsExpiredOrSoonToExpire) {
      console.log(`Access token para ${authenticatedUserId} expirado ou prestes a expirar. Tentando refrescar...`);
      console.log('AccessToken atual (antes do refresh):', integration.accessToken.substring(0, Math.min(integration.accessToken.length, 60)) + '...');

      try {
        const refreshUrl = `${NEXT_PUBLIC_BASE_URL}/api/contaazul/refresh-access-token`;

        const refreshResponse = await axios.post(refreshUrl, {}, {
          headers: {
            'Authorization': `Bearer ${authHeader.split(' ')[1]}`,
            'Content-Type': 'application/json',
            'Connection': 'keep-alive' // Adicionado
          },
          timeout: 10000 // Adicionado: 10 segundos de timeout
        });

        console.log('Resposta bruta do refresh-access-token:', JSON.stringify(refreshResponse.data, null, 2));

        if (refreshResponse.status === 200) {
          const reloadedIntegration = await prisma.contaAzulIntegration.findUnique({
            where: { userId: authenticatedUserId },
            select: { accessToken: true, refreshToken: true, expiresAt: true },
          });

          if (reloadedIntegration && reloadedIntegration.accessToken) {
            integration = reloadedIntegration;
          } else {
            throw new Error('Falha ao recuperar novo access token após refresh. Integração recarregada é nula ou sem token.');
          }

          console.log('AccessToken atual (após o refresh):', integration.accessToken.substring(0, Math.min(integration.accessToken.length, 60)) + '...');

          console.log(`Access token para ${authenticatedUserId} refrescado com sucesso.`);
          console.log(`Novo Access Token Expires At (UTC): ${integration.expiresAt.toISOString()}`);
        }
      } catch (refreshError) {
        console.error('Erro ao refrescar o access token. O usuário pode precisar reautorizar a Conta Azul.', refreshError);
        if (axios.isAxiosError(refreshError) && refreshError.response) {
          console.error('Refresh API Error Response:', refreshError.response.data);
        }
        return res.status(401).json({ message: 'Token da Conta Azul expirado. Por favor, reautorize a integração com a Conta Azul.' });
      }
    }

    console.log(`Usando Access Token da Conta Azul (APÓS POTENCIAL REFRESH) para o usuário ${authenticatedUserId} para buscar produtos.`);

    const productsResponse = await axios.get(`${CONTAAZUL_API_BASE_URL}/v1/produto/busca`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive' // Adicionado
      },
      params: {
        pagina: 1,
        tamanho_pagina: 50,
      },
      timeout: 10000 // Adicionado: 10 segundos de timeout
    });

    return res.status(200).json(productsResponse.data);

  } catch (error) {
    console.error('Erro ao buscar produtos da Conta Azul:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Conta Azul API Error Response:', error.response.data);
      if (error.response.status === 401 && error.response.data.error === 'invalid_token') {
        return res.status(401).json({ message: 'Token da Conta Azul expirado ou inválido. Por favor, reautorize a integração com a Conta Azul.', details: error.response.data });
      }
      return res.status(error.response.status).json({
        message: 'Erro ao buscar produtos da Conta Azul.',
        details: error.response.data,
        status: error.response.status,
      });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
