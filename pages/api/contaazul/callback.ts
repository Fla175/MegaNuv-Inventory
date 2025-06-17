// pages/api/contaazul/callback.ts (SALVANDO TOKENS)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma'; // Importa o Prisma Client

const CONTAAZUL_CLIENT_ID = process.env.CLIENT_ID;
const CONTAAZUL_CLIENT_SECRET = process.env.CLIENT_SECRET;
const CONTAAZUL_REDIRECT_URI = process.env.CONTAAZUL_REDIRECT_URI;

// Importar o middleware de autenticação (vamos usá-lo para obter o userId)
import { verifyAuthToken } from '../../../lib/auth'; // Presumindo que verifyAuthToken está aqui

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Verificar se as variáveis de ambiente estão configuradas
  if (!CONTAAZUL_CLIENT_ID || !CONTAAZUL_CLIENT_SECRET || !CONTAAZUL_REDIRECT_URI) {
    console.error('Credenciais da Conta Azul incompletas no .env');
    return res.status(500).json({ message: 'Internal Server Error: Conta Azul credentials missing.' });
  }

  const { code, state } = req.query;

  // Validação básica do 'code'
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Authorization code missing.' });
  }

  // TODO: Em um sistema real, você DEVE validar o 'state'
  // obtendo-o de um armazenamento temporário seguro (ex: sessão, cookie)
  // e comparando-o com o 'state' recebido para prevenir CSRF.
  // Por enquanto, apenas logamos.
  console.log('State recebido (para depuração):', state);

  try {
    const tokenUrl = 'https://auth.contaazul.com/oauth2/token'; // URL CORRETA

    const credentials = Buffer.from(`${CONTAAZUL_CLIENT_ID}:${CONTAAZUL_CLIENT_SECRET}`).toString('base64');

    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: CONTAAZUL_REDIRECT_URI,
      client_id: CONTAAZUL_CLIENT_ID,
      client_secret: CONTAAZUL_CLIENT_SECRET,
    }).toString();

    const tokenResponse = await axios.post(tokenUrl, requestBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
    });

    const { access_token, refresh_token, expires_in, scope: grantedScope } = tokenResponse.data;

    // Calcular o tempo de expiração do access token
    // O 'expires_in' geralmente está em segundos
    const expiresAt = new Date(Date.now() + (expires_in * 1000));

    // --- LÓGICA PARA SALVAR/ATUALIZAR OS TOKENS NO BANCO DE DADOS ---

    // **IMPORTANTE:** Para saber qual usuário associar, você precisará
    // obter o ID do usuário que iniciou o fluxo de autorização.
    // Isso geralmente é feito através de um cookie de sessão, ou
    // de um JWT da sua própria autenticação que você passou.

    // Por agora, VAMOS SIMPLIFICAR E PEGAR UM USUÁRIO EXISTENTE
    // OU UM USUÁRIO DE TESTE PARA ASSOCIAR A INTEGRAÇÃO.
    // Em um cenário real, você teria um middleware de autenticação
    // ANTES desta rota de callback, que anexaria o `req.user.id` à requisição.

    // Tentar encontrar um usuário para associar (ex: o primeiro usuário do banco ou um específico)
    // REMOVA ESTA LÓGICA EM PRODUÇÃO E USE A AUTENTICAÇÃO REAL DO USUÁRIO!
    let authenticatedUserId: string | undefined;
    try {
        // Tentativa de obter o userId do seu próprio JWT (se o usuário estiver logado no seu sistema)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyAuthToken(token); // Usando sua função de verificação JWT
            if (decoded && decoded.id) {
                authenticatedUserId = decoded.id;
            }
        }
        // Se não conseguiu pelo JWT, tente pegar o primeiro usuário disponível para teste
        if (!authenticatedUserId) {
            const firstUser = await prisma.user.findFirst();
            if (firstUser) {
                authenticatedUserId = firstUser.id;
            }
        }
    } catch (jwtError) {
        console.warn('Não foi possível obter userId do JWT ou do primeiro usuário para associação da Conta Azul:', jwtError);
        // Continuar sem um userId autenticado, ou decidir por retornar erro
        return res.status(401).json({ message: "Usuário não autenticado para associar a integração da Conta Azul." });
    }

    if (!authenticatedUserId) {
        return res.status(401).json({ message: "Não foi possível identificar o usuário para salvar a integração da Conta Azul." });
    }

    // Tentar encontrar uma integração existente para este usuário
    const existingIntegration = await prisma.contaAzulIntegration.findUnique({
      where: { userId: authenticatedUserId },
    });

    if (existingIntegration) {
      // Atualizar a integração existente
      await prisma.contaAzulIntegration.update({
        where: { id: existingIntegration.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: expiresAt,
          scope: grantedScope,
          updatedAt: new Date(),
        },
      });
      console.log(`Integração Conta Azul para o usuário ${authenticatedUserId} atualizada.`);
    } else {
      // Criar uma nova integração
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

    // Redirecionar o usuário para uma página de sucesso no seu frontend
    // Em vez de retornar os tokens diretamente na resposta HTTP
    // Você pode redirecionar para uma dashboard, por exemplo.
    // Ex: res.redirect('/dashboard?integration=success');
    return res.status(200).json({
      message: 'Autorização Conta Azul bem-sucedida! Tokens salvos no banco de dados.',
      // Não expor tokens diretamente em produção
    });

  } catch (error) {
    console.error('Erro ao trocar código de autorização ou salvar tokens da Conta Azul:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Conta Azul API Error Response:', error.response.data);
      return res.status(error.response.status).json({
        message: 'Erro na autorização com a Conta Azul.',
        details: error.response.data,
      });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
