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
 * Verifica o token JWT no cabeçalho 'Authorization'.
 *
 * @param handler O manipulador de API a ser protegido.
 * @param requiredRoles Opcional: Um array de papéis que são permitidos para acessar esta rota.
 * Se não for fornecido, apenas a autenticação é verificada.
 */
export const authMiddleware = (handler: NextApiHandler, requiredRoles?: string[]) => {
  return async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
    // 1. Extrair o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or malformed.' });
    }

    const token = authHeader.split(' ')[1]; // Pega a parte do token após "Bearer "

    // 2. Verificar o token
    const decodedUser = await verifyAuthToken(token);

    if (!decodedUser) {
      // Token inválido ou expirado
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    // 3. Anexar as informações do usuário à requisição
    req.user = decodedUser;

    // 4. Verificar papéis (se forem exigidos para esta rota)
    if (requiredRoles && requiredRoles.length > 0) {
      if (!req.user.role || !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
      }
    }

    // Se tudo estiver OK, chame o manipulador original da API
    return handler(req, res);
  };
};