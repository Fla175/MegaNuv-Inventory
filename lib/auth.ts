// lib/auth.ts

import { verify, sign, JwtPayload } from 'jsonwebtoken'; // Importe JwtPayload
import { UserRole } from '@prisma/client'; // Importa UserRole do Prisma para tipagem

// A chave secreta do JWT. Garanta que seja a mesma do seu .env.
const JWT_SECRET = process.env.JWT_SECRET;

// Verificação no carregamento do módulo: garante que JWT_SECRET sempre terá um valor em tempo de execução.
// Se não estiver definido, o aplicativo falhará ao iniciar, o que é o comportamento desejado.
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não está definido no ambiente. Por favor, adicione-o ao seu arquivo .env.');
}

// Interface para o payload do token JWT.
// Estender JwtPayload do 'jsonwebtoken' para herdar propriedades como 'iat' e 'exp'.
export interface AuthTokenPayload extends JwtPayload {
  // Correção: Usar 'id' para corresponder ao seu modelo User no Prisma
  id: string; // O ID do usuário (do seu modelo User)
  email: string;
  // Correção: Usar o enum UserRole para garantir a tipagem correta dos papéis
  role: UserRole; // Ex: UserRole.ADMIN, UserRole.STAFF, etc.
  name?: string; // Opcional: 'name' do usuário
  // 'iat' e 'exp' já vêm de JwtPayload, então não precisam ser declarados aqui.
}

/**
 * Verifica e decodifica um token JWT.
 * @param token O token JWT a ser verificado.
 * @returns O payload do token se for válido, ou null se for inválido/expirado.
 */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    // Correção 1: Garantir que JWT_SECRET é tratado como string
    // Usamos 'as string' para informar ao TypeScript que, neste ponto, confiamos que JWT_SECRET não é undefined
    // (devido à verificação inicial no módulo).
    // Correção 2: Converter para 'unknown' primeiro antes de 'AuthTokenPayload' para uma asserção mais segura.
    const decoded = verify(token, JWT_SECRET as string) as unknown as AuthTokenPayload;
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', (error as Error).message);
    return null;
  }
}

/**
 * Gera um novo JWT.
 * @param payload Os dados a serem incluídos no token.
 * @returns O token JWT gerado.
 */
export function generateAuthToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  // Use JWT_SECRET como string
  return sign(payload, JWT_SECRET as string, { expiresIn: '1h' });
}
