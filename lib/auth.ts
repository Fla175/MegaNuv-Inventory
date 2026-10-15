// lib/auth.ts
import * as jose from 'jose';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não está definido no ambiente. Por favor, adicione-o ao seu arquivo .env.');
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
  iat?: number;
  exp?: number;
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    
    if (payload && typeof payload === 'object' && 'userId' in payload && 'email' in payload && 'role' in payload) {
      const finalDecoded: AuthTokenPayload = {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as UserRole,
        name: payload.name as string | undefined,
        iat: typeof payload.iat === 'number' ? payload.iat : undefined,
        exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      };
      return finalDecoded;
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

export async function generateAuthToken(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  options?: { expiresIn?: string | number },
): Promise<string> {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
  
  const secret = new TextEncoder().encode(JWT_SECRET!);
  const expiresIn = options?.expiresIn ?? '8h';
  const token = await new jose.SignJWT(tokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
    
  return token;
}
