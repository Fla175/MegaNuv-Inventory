// pages/api/contaazul/authorize.ts (SCOPES CORRIGIDOS)

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const CONTAAZUL_CLIENT_ID = process.env.CLIENT_ID;
const CONTAAZUL_REDIRECT_URI = process.env.CONTAAZUL_REDIRECT_URI;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!CONTAAZUL_CLIENT_ID || !CONTAAZUL_REDIRECT_URI) {
    console.error('CONTAAZUL_CLIENT_ID ou CONTAAZUL_REDIRECT_URI não estão configurados no .env');
    return res.status(500).json({ message: 'Internal Server Error: Conta Azul credentials missing.' });
  }

  // --- MUDANÇA AQUI: ESCAPOS CORRETOS PARA A AUTORIZAÇÃO INICIAL ---
  // Conforme a documentação, esses são os escopos esperados para a primeira etapa de autorização.
  // Os escopos de 'products' e 'stocks' provavelmente serão concedidos
  // implicitamente pela configuração da sua aplicação na Conta Azul APÓS esta fase de autenticação.
  const scopes = 'openid profile aws.cognito.signin.user.admin';

  // GERA UM PARÂMETRO STATE ALEATÓRIO PARA SEGURANÇA (PROTEÇÃO CSRF)
  const state = crypto.randomBytes(16).toString('hex');

  const authorizationUrl = `https://auth.contaazul.com/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${CONTAAZUL_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(CONTAAZUL_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `state=${state}`;

  res.redirect(authorizationUrl);
}
