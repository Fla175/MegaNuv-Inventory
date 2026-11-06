// lib/authHelper.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { verifyAuthToken } from './auth';

// Cookie names
export const COOKIE_AUTH_TOKEN = 'auth_token';
export const COOKIE_AUTH_TOKEN_CREATOR = 'auth_token_creator';

/**
 * Define cookie options padrão para httpOnly cookies
 */
export const defaultCookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  path: '/',
  sameSite: 'lax' as const,
};

/**
 * Verifica se o cookie auth_token_creator está presente e válido
 * em relação ao token auth_token atual. Retorna true se:
 * - O stash cookie existe e corresponde ao usuário do token principal
 * - Ou false se o stash foi invalidado/removido
 *
 * @param req - Request object
 * @returns {Promise<{ hasStash: boolean; creatorId?: string }>}
 */
export async function checkStashConsistency(req: NextApiRequest): Promise<{ hasStash: boolean; creatorId?: string }> {
  const stashCookie = req.cookies.auth_token_creator;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  const mainToken = bearerToken || req.cookies.auth_token;

  // Se não há stash cookie, consistência é falsa
  if (!stashCookie) {
    return { hasStash: false };
  }

  // Se há token principal, verifica se o stash pertence ao mesmo usuário
  if (mainToken) {
    const payload = await verifyAuthToken(mainToken);
    if (payload && payload.userId) {
      return { hasStash: true, creatorId: payload.userId };
    }
  }

  // Token inválido ou inexistente com stash órfão - remove o stash
  return { hasStash: false };
}

/**
 * Invalida ambos os cookies (auth_token e auth_token_creator).
 * Usado no logout comum do usuário.
 *
 * @param res - Response object to set the cookie header
 * @param options - Opções adicionais
 */
export function invalidateAllCookies(res: NextApiResponse, options?: {
  maxAge?: number;
  sameSite?: typeof defaultCookieOptions.sameSite;
}) {
  const cookieOpts = {
    ...defaultCookieOptions,
    ...options,
    maxAge: options?.maxAge ?? -1,
  };

  res.setHeader('Set-Cookie', [
    serialize(COOKIE_AUTH_TOKEN, '', cookieOpts),
    serialize(COOKIE_AUTH_TOKEN_CREATOR, '', cookieOpts),
  ]);
}

export {
  checkStashConsistency as checkStash,
  invalidateAllCookies as invalidateCookies
};