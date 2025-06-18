// pages/api/contaazul/callback.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { verifyAuthToken } from '../../../lib/auth';

// Acessar variáveis de ambiente diretamente com os nomes do .env
const CLIENT_ID_ENV = process.env.CLIENT_ID;
const CLIENT_SECRET_ENV = process.env.CLIENT_SECRET;
const CONTAAZUL_REDIRECT_URI = process.env.CONTAAZUL_REDIRECT_URI;
const NODE_ENV = process.env.NODE_ENV;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Usar os nomes locais para a verificação
  if (!CLIENT_ID_ENV || !CLIENT_SECRET_ENV || !CONTAAZUL_REDIRECT_URI) {
    console.error('Credenciais da Conta Azul incompletas no .env.');
    return res.status(500).json({ message: 'Internal Server Error: Conta Azul credentials missing.' });
  }

  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Authorization code missing.' });
  }

  console.log('State recebido (para depuração):', state);

  try {
    const tokenUrl = 'https://auth.contaazul.com/oauth2/token';

    // Usar os nomes locais na construção do Basic Auth e body
    const credentials = Buffer.from(`${CLIENT_ID_ENV}:${CLIENT_SECRET_ENV}`).toString('base64');

    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: CONTAAZUL_REDIRECT_URI,
      client_id: CLIENT_ID_ENV, // Usar o nome local
      client_secret: CLIENT_SECRET_ENV, // Usar o nome local
    }).toString();

    const tokenResponse = await axios.post(tokenUrl, requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
    });

    const { access_token, refresh_token, expires_in, scope: grantedScope } = tokenResponse.data;

    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    let authenticatedUserId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decodedPayload = verifyAuthToken(token);
      if (decodedPayload && decodedPayload.userId) {
        authenticatedUserId = decodedPayload.userId;
      }
    }

    if (!authenticatedUserId && NODE_ENV === 'development') {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        authenticatedUserId = firstUser.id;
        console.warn(`[DEVELOPMENT MODE] Usando o primeiro usuário do DB (${authenticatedUserId}) como fallback para associar a integração Conta Azul.`);
      }
    }

    if (!authenticatedUserId) {
      console.error('Usuário não autenticado para associar a integração da Conta Azul.');
      return res.status(401).json({ message: "Usuário não autenticado para associar a integração da Conta Azul." });
    }

    const existingIntegration = await prisma.contaAzulIntegration.findUnique({
      where: { userId: authenticatedUserId },
    });

    if (existingIntegration) {
      await prisma.contaAzulIntegration.update({
        where: { id: existingIntegration.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || existingIntegration.refreshToken,
          expiresAt: expiresAt,
          scope: grantedScope || existingIntegration.scope,
          updatedAt: new Date(),
        },
      });
      console.log(`Integração Conta Azul para o usuário ${authenticatedUserId} atualizada.`);
    } else {
      await prisma.contaAzulIntegration.create({
        data: {
          userId: authenticatedUserId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiresAt,
          scope: grantedScope,
        },
      });
      console.log(`Nova integração Conta Azul criada para o usuário ${authenticatedUserId}.`);
    }

    return res.status(200).json({
      message: 'Autorização Conta Azul bem-sucedida! Tokens salvos no banco de dados.',
    });

  } catch (error) {
    console.error('Erro ao trocar código de autorização ou salvar tokens da Conta Azul:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Conta Azul API Error Response:', error.response.data);
      return res.status(error.response.status).json({
        message: 'Erro na autorização com a Conta Azul.',
        details: error.response.data,
        status: error.response.status,
      });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
