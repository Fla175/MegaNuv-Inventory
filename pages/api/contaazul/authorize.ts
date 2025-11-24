// pages/api/contaazul/authorize.ts (Aceita POST e Retorna URL)

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import * as cookie from 'cookie';
import { verifyAuthToken } from '@/lib/auth';

const CONTAAZUL_CLIENT_ID = process.env.CLIENT_ID;
const CONTAAZUL_REDIRECT_URI = process.env.CONTAAZUL_REDIRECT_URI;
const CONTA_AZUL_OAUTH_BASE_URL = process.env.CONTA_AZUL_OAUTH_BASE_URL || 'https://auth.contaazul.com';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // NOVO: Agora aceita apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
  }

  if (!CONTAAZUL_CLIENT_ID || !CONTAAZUL_REDIRECT_URI || !CONTA_AZUL_OAUTH_BASE_URL) {
    console.error('CONTAAZUL_CLIENT_ID, CONTAAZUL_REDIRECT_URI ou CONTA_AZUL_OAUTH_BASE_URL não estão configurados no .env');
    return res.status(500).json({ message: 'Internal Server Error: Conta Azul credentials/URLs missing.' });
  }

  // --- CORREÇÃO: Obter userId do cabeçalho Authorization ou cookie ---
  // O frontend AGORA enviará o JWT no cabeçalho Authorization
  const authHeader = req.headers.authorization;
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const tokenFromCookie = cookies.auth_token;
  let authenticatedUserId: string | undefined;

  let tokenToVerify: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenToVerify = authHeader.split(' ')[1];
  } else if (tokenFromCookie) { // Mantém fallback para cookie, mas a prioridade é o header
    tokenToVerify = tokenFromCookie;
  }

  if (tokenToVerify) {
    const decodedPayload = verifyAuthToken(tokenToVerify);
    if (decodedPayload && decodedPayload.userId) {
      authenticatedUserId = decodedPayload.userId;
    }
  }

  console.log(`[AUTHORIZE] authenticatedUserId obtido do header/cookie: ${authenticatedUserId || 'NÃO ENCONTRADO'}`);

  if (!authenticatedUserId) {
    console.warn('Usuário não autenticado. Redirecionando para login para iniciar a autorização da Conta Azul.');
    return res.status(401).json({ message: 'Não autorizado: É necessário estar logado para iniciar a autorização da Conta Azul.' });
  }
  // --- FIM DA CORREÇÃO ---

  const scopes = 'openid profile aws.cognito.signin.user.admin';
  const randomState = crypto.randomBytes(16).toString('hex');
  const state = `${authenticatedUserId}-${randomState}`;

  const authorizationUrl = `${CONTA_AZUL_OAUTH_BASE_URL}/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${CONTAAZUL_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(CONTAAZUL_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `state=${state}`;

  // NOVO: Em vez de res.redirect, retorna a URL para o frontend
  res.status(200).json({ redirectUrl: authorizationUrl });
}
