    // lib/auth.ts
    import { verify, sign, JwtPayload } from 'jsonwebtoken';
    import { UserRole } from '@prisma/client';

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não está definido no ambiente. Por favor, adicione-o ao seu arquivo .env.');
    }

    export interface AuthTokenPayload extends JwtPayload {
      // CORREÇÃO: Mudar de 'id' para 'userId' para corresponder ao payload do JWT gerado
      userId: string; // O ID do usuário (do seu modelo User), conforme gerado no JWT
      email: string;
      role: UserRole;
      name?: string;
    }

    export function verifyAuthToken(token: string): AuthTokenPayload | null {
      try {
        console.log('--- verifyAuthToken START ---');
        console.log('Attempting to verify token (first 30 chars):', token.substring(0, 30) + '...');

        const decoded = verify(token, JWT_SECRET as string) as JwtPayload;

        console.log('Raw Decoded JWT Payload:', decoded);

        // CORREÇÃO: Verificar 'userId' em vez de 'id'
        if (decoded && typeof decoded === 'object' && 'userId' in decoded && 'email' in decoded && 'role' in decoded) {
          const finalDecoded: AuthTokenPayload = {
            userId: decoded.userId as string, // Usar 'userId' aqui
            email: decoded.email as string,
            role: decoded.role as UserRole,
            name: decoded.name as string | undefined,
            iat: decoded.iat,
            exp: decoded.exp,
          };
          console.log('Successfully decoded and typed JWT payload:', finalDecoded);
          console.log('--- verifyAuthToken END (Success) ---');
          return finalDecoded;
        } else {
          console.error('Decoded JWT payload is missing required fields (userId, email, role) or is not an object. Decoded:', decoded);
          console.log('--- verifyAuthToken END (Missing Fields) ---');
          return null;
        }
      } catch (error) {
        console.error('Error during JWT verification:', (error as Error).message);
        if (error instanceof Error) {
          console.error('Full JWT verification error object:', error);
        }
        console.log('--- verifyAuthToken END (Error) ---');
        return null;
      }
    }

    export function generateAuthToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
      const tokenPayload = {
        userId: payload.userId, // CORREÇÃO: Garantir que 'userId' é passado para 'sign'
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
      console.log('--- generateAuthToken START ---');
      console.log('Payload for token generation:', tokenPayload);
      const token = sign(tokenPayload, JWT_SECRET as string, { expiresIn: '1h' });
      console.log('Generated Token (first 30 chars):', token.substring(0, 30) + '...');
      console.log('--- generateAuthToken END ---');
      return token;
    }