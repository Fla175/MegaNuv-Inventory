// pages/api/contaazul/callback.ts (Correção da Extração do UserId)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { verifyAuthToken } from '../../../lib/auth';
import * as cookie from 'cookie';

const CONTA_AZUL_CLIENT_ID = process.env.CLIENT_ID;
const CONTA_AZUL_CLIENT_SECRET = process.env.CLIENT_SECRET;
const CONTA_AZUL_REDIRECT_URI = process.env.CONTAAZUL_REDIRECT_URI;
const CONTA_AZUL_OAUTH_BASE_URL = process.env.CONTA_AZUL_OAUTH_BASE_URL || 'https://auth.contaazul.com';
const NODE_ENV = process.env.NODE_ENV;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!CONTA_AZUL_CLIENT_ID || !CONTA_AZUL_CLIENT_SECRET || !CONTA_AZUL_REDIRECT_URI || !CONTA_AZUL_OAUTH_BASE_URL) {
    console.error('Credenciais ou URLs da Conta Azul incompletas no .env para o callback.');
    return res.status(500).json({ message: 'Internal Server Error: Conta Azul credentials/URLs missing.' });
  }

  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Authorization code missing.' });
  }

  // --- CORREÇÃO AQUI: Extrair userId completo do parâmetro state ---
  let authenticatedUserId: string | undefined;
  if (state && typeof state === 'string') {
    const lastHyphenIndex = state.lastIndexOf('-');
    if (lastHyphenIndex !== -1) { // Garante que há pelo menos um hífen para dividir
      authenticatedUserId = state.substring(0, lastHyphenIndex); // Pega tudo antes do último hífen
    }
  }

  if (!authenticatedUserId) {
    console.error('ID do usuário não encontrado ou inválido no parâmetro state para associar a integração da Conta Azul.');
    return res.status(401).json({ message: "Usuário não identificado para associar a integração da Conta Azul. Por favor, tente novamente a autorização a partir do sistema logado." });
  }
  // --- FIM DA CORREÇÃO ---

  console.log('State recebido (para depuração):', state);
  console.log(`[CALLBACK] Autenticando integração para o userId extraído do state: ${authenticatedUserId}`);

  try {
    const tokenUrl = `${CONTA_AZUL_OAUTH_BASE_URL}/oauth2/token`;

    const credentials = Buffer.from(`${CONTA_AZUL_CLIENT_ID}:${CONTA_AZUL_CLIENT_SECRET}`).toString('base64');

    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: CONTA_AZUL_REDIRECT_URI,
      client_id: CONTA_AZUL_CLIENT_ID,
      client_secret: CONTA_AZUL_CLIENT_SECRET,
    }).toString();

    const tokenResponse = await axios.post(tokenUrl, requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
    });

    const { access_token, refresh_token, expires_in, scope: grantedScope } = tokenResponse.data;

    console.log(`[CALLBACK] Access Token Recebido (primeiros 30 chars): ${access_token.substring(0, 30)}...`);
    console.log(`[CALLBACK] Refresh Token Recebido (primeiros 30 chars): ${refresh_token.substring(0, 30)}...`);
    console.log(`[CALLBACK] Expires In (segundos): ${expires_in}`);
    console.log(`[CALLBACK] Date.now() antes do cálculo de expiresAt: ${new Date(Date.now()).toISOString()}`);

    const expiresAt = new Date(Date.now() + (expires_in * 1000));
    console.log(`[CALLBACK] Expires At Calculado: ${expiresAt.toISOString()}`);

    let savedIntegration;

    await prisma.contaAzulIntegration.deleteMany({
      where: { userId: authenticatedUserId },
    });
    console.log(`[CALLBACK] Registro antigo de ContaAzulIntegration para ${authenticatedUserId} deletado (se existia).`);

    savedIntegration = await prisma.contaAzulIntegration.create({
      data: {
        userId: authenticatedUserId, // AGORA ESTE SERÁ O UUID COMPLETO
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expiresAt,
        scope: grantedScope,
      },
    });
    console.log(`Nova integração Conta Azul criada para o usuário ${authenticatedUserId}.`);

    if (savedIntegration) {
      console.log(`[CALLBACK] Access Token SALVO (primeiros 30 chars): ${savedIntegration.accessToken.substring(0, 30)}...`);
      console.log(`[CALLBACK] Expires At SALVO: ${savedIntegration.expiresAt.toISOString()}`);
    } else {
      console.warn('[CALLBACK] savedIntegration é nulo após operação de DB.');
    }

    return res.status(200).json({
      message: 'Autorização Conta Azul bem-sucedida! Tokens salvos no banco de dados.',
    });

  } catch (error: any) {
    console.error('Erro ao trocar código de autorização ou salvar tokens da Conta Azul:', error.response?.data || error.message);
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
