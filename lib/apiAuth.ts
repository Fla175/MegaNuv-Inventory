// lib/apiAuth.ts

import type { NextApiRequest } from 'next';
import { verifyAuthToken, type AuthTokenPayload } from './auth';

/**
 * Helper único para resolver a sessão de uma requisição de API.
 *
 * Antes desta consolidação, 17 arquivos em `pages/api/**` repetiam a mesma
 * sequência com pequenas variações:
 *
 *   const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
 *   const secret = new TextEncoder().encode(JWT_SECRET!);
 *   const { payload } = await jose.jwtVerify(token, secret);
 *
 * As variações não eram cosméticas:
 * - o prefixo `Bearer ` não era validado — um header sem o esquema ainda era
 *   repassado ao verificador;
 * - cada arquivo repetia `new TextEncoder().encode(JWT_SECRET!)`, Some já
 *   usavam `verifyAuthToken`, que é a fonte de verdade (`SPECS.md` §5.1);
 * - a leitura do id do usuário divergia (`id || userId || sub`, `id || sub ||
 *   userId` ou só `userId`), embora o token emitido pelo login carregue apenas
 *   `userId` (`SPECS.md` §4.2) — as outras expressões eram código morto.
 *
 * Este módulo delega a verificação a `verifyAuthToken()` e resolve as duas
 * fontes de credencial (cookie httpOnly e header `Authorization: Bearer`).
 * Não escreve na resposta: quem chama decide o status e o corpo, preservando o
 * envelope `{ error: string }` de cada endpoint (`SPECS.md` §4.2).
 */

/** Extrai o token da requisição, aceitando cookie `auth_token` ou header Bearer. */
export function getSessionToken(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header === 'string') {
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (match?.[1]) return match[1].trim();
  }

  const cookieToken = req.cookies?.auth_token;
  return cookieToken && cookieToken.length > 0 ? cookieToken : null;
}

/**
 * Resolve a sessão da requisição.
 * Devolve `null` quando não há token ou quando o token é inválido/expirado.
 * Nunca lança.
 */
export async function getSessionUser(req: NextApiRequest): Promise<AuthTokenPayload | null> {
  const token = getSessionToken(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

/** Verdadeiro para papéis sem permissão de escrita (SPECS.md §4.2). */
export function isViewer(user: Pick<AuthTokenPayload, 'role'> | null | undefined): boolean {
  return user?.role === 'VIEWER';
}

/** Verdadeiro para papéis que administram usuários/infra (DIRECTOR, ADMIN). */
export function isPrivileged(user: Pick<AuthTokenPayload, 'role'> | null | undefined): boolean {
  return user?.role === 'DIRECTOR' || user?.role === 'ADMIN';
}

/**
 * Verdadeiro para papéis autorizados a ver o patrimônio de um ativo (`fixedValue`) —
 * decisão de produto de 18/10/2026: ADMIN, MANAGER e DIRECTOR veem e editam o valor;
 * **apenas VIEWER** não o vê. O card de patrimônio total do dashboard é a exceção e
 * permanece restrito em dashboard/stats.ts (ADR-001 §1).
 *
 * Predicado puro, ao lado de `isViewer`, para os endpoints de leitura aplicarem
 * o mesmo critério (`actives/list`, `qrcode/public-get`): quem não pode ver não
 * recebe o campo no payload — a regra vive no servidor, não na UI (`SPECS.md §5.1`).
 */
export function canViewValue(user: Pick<AuthTokenPayload, 'role'> | null | undefined): boolean {
  return (
    user?.role === 'DIRECTOR' || user?.role === 'ADMIN' || user?.role === 'MANAGER'
  );
}