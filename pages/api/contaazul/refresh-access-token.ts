// pages/api/contaazul/refresh-access-token.ts (Axios Keep-Alive e Timeout)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { AuthTokenPayload, verifyAuthToken } from '../../../lib/auth';

const CLIENT_ID_ENV = process.env.CLIENT_ID;
const CLIENT_SECRET_ENV = process.env.CLIENT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!CLIENT_ID_ENV || !CLIENT_SECRET_ENV) {
    console.error('Credenciais da Conta Azul (Client ID/Secret) incompletas no .env para refresh de token.');
    return res.status(500).json({ message: 'Internal Server Error: Conta Azul credentials missing.' });
  }

  let authenticatedUserId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decodedPayload: AuthTokenPayload | null = verifyAuthToken(token);
    if (decodedPayload && decodedPayload.userId) {
      authenticatedUserId = decodedPayload.userId;
    } else {
      console.warn('Token JWT decodificado inválido ou sem ID para refresh de token.');
      return res.status(401).json({ message: 'Não autorizado: Token JWT inválido ou ausente.' });
    }
  } else {
    console.warn('Cabeçalho de autenticação Bearer não encontrado para refresh de token.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação.' });
  }

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

    const tokenUrl = 'https://auth.contaazul.com/oauth2/token';

    const credentials = Buffer.from(`${CLIENT_ID_ENV}:${CLIENT_SECRET_ENV}`).toString('base64');

    const refreshResponse = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refreshToken,
      client_id: CLIENT_ID_ENV,
      client_secret: CLIENT_SECRET_ENV,
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Connection': 'keep-alive' // Adicionado
      },
      timeout: 10000 // Adicionado: 10 segundos de timeout
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

  } catch (error) {
    console.error('Erro ao refrescar o access token da Conta Azul:', error);
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
