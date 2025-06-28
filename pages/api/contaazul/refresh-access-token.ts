// pages/api/contaazul/refresh-access-token.ts (Lê JWT do Authorization Header)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { AuthTokenPayload, verifyAuthToken } from '../../../lib/auth';
import * as cookie from 'cookie';

const CONTA_AZUL_CLIENT_ID = process.env.CLIENT_ID;
const CONTA_AZUL_CLIENT_SECRET = process.env.CLIENT_SECRET;
const CONTA_AZUL_OAUTH_BASE_URL = process.env.CONTA_AZUL_OAUTH_BASE_URL || 'https://auth.contaazul.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!CONTA_AZUL_CLIENT_ID || !CONTA_AZUL_CLIENT_SECRET) {
    console.error('Credenciais da Conta Azul (Client ID/Secret) incompletas no .env para refresh de token.');
    return res.status(500).json({ message: 'Internal Server Error: Conta Azul credentials missing.' });
  }

  // --- CORREÇÃO: Obter userId do cabeçalho Authorization ou cookie ---
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
    console.warn('Token de autenticação ausente para refresh-access-token.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação.' });
  }

  const decodedPayload: AuthTokenPayload | null = verifyAuthToken(tokenToVerify);
  if (decodedPayload && decodedPayload.userId) {
    authenticatedUserId = decodedPayload.userId;
  } else {
    console.warn('Token JWT inválido ou sem ID do usuário para refresh de token.');
    return res.status(401).json({ message: 'Não autorizado: Token JWT inválido ou ausente.' });
  }
  // --- FIM DA CORREÇÃO ---

  if (!authenticatedUserId) {
    return res.status(401).json({ message: 'Não foi possível identificar o usuário autenticado para refresh de token.' });
  }

  try {
    const integration = await prisma.contaAzulIntegration.findUnique({
      where: { userId: authenticatedUserId },
      select: { refreshToken: true, scope: true },
    });

    if (!integration || !integration.refreshToken) {
      return res.status(404).json({ message: 'Refresh token da Conta Azul não encontrado para este usuário.' });
    }

    const tokenUrl = `${CONTA_AZUL_OAUTH_BASE_URL}/oauth2/token`;

    const credentials = Buffer.from(`${CONTA_AZUL_CLIENT_ID}:${CONTA_AZUL_CLIENT_SECRET}`).toString('base64');

    const refreshResponse = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refreshToken,
      client_id: CONTA_AZUL_CLIENT_ID,
      client_secret: CONTA_AZUL_CLIENT_SECRET,
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Connection': 'keep-alive'
      },
      timeout: 10000
    });

    const { access_token, refresh_token: new_refresh_token, expires_in, scope: new_scope } = refreshResponse.data;

    const newExpiresAt = new Date(Date.now() + (expires_in * 1000));

    await prisma.contaAzulIntegration.update({
      where: { userId: authenticatedUserId },
      data: {
        accessToken: access_token,
        refreshToken: new_refresh_token || integration.refreshToken,
        expiresAt: newExpiresAt,
        scope: new_scope || integration.scope,
        updatedAt: new Date(),
      },
    });

    console.log(`Access token da Conta Azul para o usuário ${authenticatedUserId} foi refrescado e salvo.`);

    return res.status(200).json(refreshResponse.data);

  } catch (error: any) {
    console.error('Erro ao refrescar o access token da Conta Azul:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Conta Azul API Error Response:', error.response.data);
      return res.status(error.response.status).json({
        message: 'Erro ao refrescar o access token da Conta Azul.',
        details: error.response.data,
        status: error.response.status,
      });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
