// lib/auth.ts

import jwt from 'jsonwebtoken';

// Defina a interface para o payload do token JWT,
// contendo as informações que você armazenou no token ao fazer login.
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string; // Ex: "ADMIN", "STAFF", "USER"
  name?: string; // <--- Adicione esta linha: 'name' é opcional no token
  iat: number; // Issued At (timestamp)
  exp: number; // Expiration Time (timestamp)
}

// A chave secreta do JWT. Garanta que seja a mesma do seu .env.
// Em produção, sempre use process.env.JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET || 'J0mywIDqwteMp5s3Ux3UkSaY86hUNK82WovP5opcbn0='; // Deve ser a mesma chave do seu .env!

/**
 * Verifica e decodifica um token JWT.
 * @param token O token JWT a ser verificado.
 * @returns O payload do token se for válido, ou null se for inválido/expirado.
 */
export const verifyAuthToken = (token: string): AuthTokenPayload | null => {
  try {
    // Verifica o token usando a chave secreta.
    // O jwt.verify lança um erro se o token for inválido ou expirado.
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    // Log do erro para depuração (pode ser mais detalhado em produção)
    console.error('Erro ao verificar token JWT:', (error as Error).message);
    return null; // Retorna null para indicar um token inválido ou expirado
  }
};
