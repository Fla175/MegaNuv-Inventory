// lib/middlewares/authMiddleware.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthToken, AuthTokenPayload } from '../auth'; // Importa o utilitário de verificação

// Estende a interface NextApiRequest para incluir as informações do usuário autenticado
export interface AuthenticatedNextApiRequest extends NextApiRequest {
  user?: AuthTokenPayload; // Informações do usuário autenticado (userId, email, role)
}

// Tipo para um manipulador de API Next.js
type NextApiHandler = (req: AuthenticatedNextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Middleware para proteger rotas de API.
 * Verifica o token JWT no cabeçalho 'Authorization' (Bearer) **ou** no cookie
 * `auth_token` (httpOnly). O cookie é aceito para manter compatibilidade com
 * chamadas feitas pelo próprio frontend (fetch sem header explícito).
 *
 * @param handler O manipulador de API a ser protegido.
 * @param requiredRoles Opcional: Um array de papéis que são permitidos para acessar esta rota.
 * Se não for fornecido, apenas a autenticação é verificada.
 */
export const authMiddleware = (handler: NextApiHandler, requiredRoles?: string[]) => {
  return async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
    // 1. Extrair o token do cabeçalho Authorization ou do cookie de sessão
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
    const cookieToken = req.cookies?.auth_token;

    const token = bearerToken || cookieToken;
    if (!token) {
      return res.status(401).json({ error: 'Autenticação necessária. Faça login para continuar.' });
    }

    // 2. Verificar o token
    const decodedUser = await verifyAuthToken(token);

    if (!decodedUser) {
      // Token inválido ou expirado
      return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    }

    // 3. Anexar as informações do usuário à requisição
    req.user = decodedUser;

    // 4. Verificar papéis (se forem exigidos para esta rota)
    if (requiredRoles && requiredRoles.length > 0) {
      if (!req.user.role || !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Permissões insuficientes para esta operação.' });
      }
    }

    // Se tudo estiver OK, chame o manipulador original da API
    return handler(req, res);
  };
};
