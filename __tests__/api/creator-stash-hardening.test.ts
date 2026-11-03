// __tests__/api/creator-stash-hardening.test.ts
//
// Regressão do P0 "login após expiração herda o stash do criador".
//
// Antes desta correção, a cadeia era:
//   1. `POST /api/creator-access` gravava `auth_token` (2 h) e
//      `auth_token_creator` (8 h);
//   2. o `auth_token` expirava e o `middleware.ts` apagava só ele;
//   3. o login seguinte (`/api/auth/login`) gravava só `auth_token`;
//   4. `DELETE /api/creator-access` copiava o stash para `auth_token` **sem
//      senha, sem validar o token e sem checar a quem ele pertencia**.
//
// Resultado: quem fizesse login naquela janela de 8 h assumia o criador com uma
// requisição. Os testes abaixo travam cada elo da cadeia.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { generateAuthToken } from '@/lib/auth';
import { asMock } from '../helpers/http';
import creatorAccessHandler from '@/pages/api/creator-access';
import loginHandler from '@/pages/api/auth/login';
import prisma from '@/lib/prisma';

vi.mock('@/lib/prisma', () => {
  const mockUser = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const mockLog = { create: vi.fn() };

  return {
    default: {
      user: mockUser,
      log: mockLog,
      $transaction: vi.fn(async (cb) => cb({ user: mockUser, log: mockLog })),
    },
  };
});

vi.mock('bcryptjs', () => {
  const compare = vi.fn(async () => true);
  return {
    default: {
      compare,
      hash: vi.fn(async () => 'fake-hash'),
      genSalt: vi.fn(async () => 'fake-salt'),
    },
  };
});

interface JsonBody {
  [key: string]: unknown;
  error?: string;
  message?: string;
  restored?: boolean;
}

function createMockReqRes(options: {
  method?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}) {
  const req = {
    method: options.method || 'GET',
    cookies: options.cookies || {},
    headers: options.headers || {},
    body: options.body || {},
    query: {},
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as NextApiRequest;

  const resState: {
    statusCode: number;
    headers: Record<string, unknown>;
    jsonBody: JsonBody;
  } = { statusCode: 200, headers: {}, jsonBody: {} };

  const res = {
    status: vi.fn((code: number) => {
      resState.statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      resState.jsonBody = body as JsonBody;
      return res;
    }),
    setHeader: vi.fn((key: string, value: unknown) => {
      resState.headers[key] = value;
      return res;
    }),
  } as unknown as NextApiResponse;

  return { req, res, resState };
}

/** Cookies emitidos na resposta, normalizados em strings `name=value`. */
function setCookies(resState: { headers: Record<string, unknown> }): string[] {
  const raw = resState.headers['Set-Cookie'];
  if (!raw) return [];
  return Array.isArray(raw) ? (raw as string[]) : [String(raw)];
}

function cookieNamed(list: string[], name: string): string | undefined {
  return list.find((c) => c.startsWith(`${name}=`));
}

describe('P0 — o stash do criador não sobrevive ao login', () => {
  const origEnv = process.env;
  const CREATOR_PASSWORD_HASH = '$2a$10$abcdefghijklmnopqrstuvFakeHashForTests00000000';

  beforeEach(() => {
    vi.resetAllMocks();
    (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    process.env = { ...origEnv, JWT_SECRET: 'test-secret-key-1234567890' };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  describe('POST /api/auth/login', () => {
    it('apaga auth_token_creator junto com o auth_token novo', async () => {
      asMock(prisma.user.findUnique).mockResolvedValue({
        id: 'u-1',
        name: 'Someone',
        email: 'someone@ex.com',
        role: UserRole.VIEWER,
        password: CREATOR_PASSWORD_HASH,
      });
      asMock(prisma.user.update).mockResolvedValue({});
      asMock(prisma.log.create).mockResolvedValue({});

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        body: { email: 'someone@ex.com', password: 'whatever' },
      });

      await loginHandler(req, res);

      expect(resState.statusCode).toBe(200);
      const cookies = setCookies(resState);

      // O stash de uma sessão anterior não pode atravessar o login novo.
      const clearedStash = cookieNamed(cookies, 'auth_token_creator');
      expect(clearedStash).toBeDefined();
      expect(clearedStash).toContain('Max-Age=-1');
      expect(clearedStash).toContain('HttpOnly');

      // O token novo continua sendo emitido normalmente.
      expect(cookieNamed(cookies, 'auth_token')).toBeDefined();
    });
  });

  describe('DELETE /api/creator-access (restore)', () => {
    it('exige senha: sem password no body responde 400 e não emite auth_token', async () => {
      const creatorToken = await generateAuthToken({
        userId: 'c-1',
        email: 'creator@ex.com',
        role: UserRole.ADMIN,
      });

      const { req, res, resState } = createMockReqRes({
        method: 'DELETE',
        cookies: { auth_token: 'any-token', auth_token_creator: creatorToken },
        body: {},
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(400);
      expect(resState.jsonBody.error).toMatch(/Senha/);
      // Nenhum Set-Cookie de troca: quem não prova a senha não ganha sessão.
      const authTokenCookie = cookieNamed(setCookies(resState), 'auth_token');
      expect(authTokenCookie).toBeUndefined();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('senha errada responde 401 e mantém o stash (não promove)', async () => {
      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const creatorToken = await generateAuthToken({
        userId: 'c-1',
        email: 'creator@ex.com',
        role: UserRole.ADMIN,
      });
      asMock(prisma.user.findUnique).mockResolvedValue({
        id: 'c-1',
        role: UserRole.ADMIN,
        isCreator: true,
        password: CREATOR_PASSWORD_HASH,
      });

      const { req, res, resState } = createMockReqRes({
        method: 'DELETE',
        cookies: { auth_token: 'viewer-token', auth_token_creator: creatorToken },
        body: { password: 'errada' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(401);
      expect(resState.jsonBody.error).toBe('Senha incorreta.');
      expect(cookieNamed(setCookies(resState), 'auth_token')).toBeUndefined();
    });

    it('stash expirado responde 401 e apaga o cookie em vez de copiá-lo', async () => {
      // Token assinado com exp no passado: `verifyAuthToken` devolve null.
      const expiredStash = await generateAuthToken(
        { userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN },
        { expiresIn: '-1s' },
      );

      const { req, res, resState } = createMockReqRes({
        method: 'DELETE',
        cookies: { auth_token: 'target-token', auth_token_creator: expiredStash },
        body: { password: 'qualquer' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(401);
      expect(resState.jsonBody.error).toMatch(/expirada/);

      const cookies = setCookies(resState);
      // Nada de `auth_token=<stash expirado>`; só a limpeza do stash.
      expect(cookieNamed(cookies, 'auth_token')).toBeUndefined();
      const clearedStash = cookieNamed(cookies, 'auth_token_creator');
      expect(clearedStash).toContain('Max-Age=-1');
      // Senha nem é consultada: o token morto não vira sessão de ninguém.
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('stash válido de quem não é mais criador responde 403 e não promove', async () => {
      const stash = await generateAuthToken({
        userId: 'ex-creator',
        email: 'ex@ex.com',
        role: UserRole.ADMIN,
      });
      asMock(prisma.user.findUnique).mockResolvedValue({
        id: 'ex-creator',
        role: UserRole.ADMIN,
        isCreator: false,
        password: CREATOR_PASSWORD_HASH,
      });

      const { req, res, resState } = createMockReqRes({
        method: 'DELETE',
        cookies: { auth_token: 'target-token', auth_token_creator: stash },
        body: { password: 'CreatorPassword123!' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(403);
      expect(cookieNamed(setCookies(resState), 'auth_token')).toBeUndefined();
    });

    it('com senha correta troca auth_token pelo stash e limpa o stash', async () => {
      const creatorToken = await generateAuthToken({
        userId: 'c-1',
        email: 'creator@ex.com',
        role: UserRole.ADMIN,
        name: 'Creator',
      });
      asMock(prisma.user.findUnique).mockResolvedValue({
        id: 'c-1',
        role: UserRole.ADMIN,
        isCreator: true,
        password: CREATOR_PASSWORD_HASH,
      });
      asMock(prisma.log.create).mockResolvedValue({});

      const { req, res, resState } = createMockReqRes({
        method: 'DELETE',
        cookies: { auth_token: 'target-token', auth_token_creator: creatorToken },
        body: { password: 'CreatorPassword123!' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody).toEqual({ restored: true });
      expect(bcrypt.compare).toHaveBeenCalledWith('CreatorPassword123!', CREATOR_PASSWORD_HASH);

      const cookies = setCookies(resState);
      expect(cookieNamed(cookies, 'auth_token')).toContain(creatorToken);
      expect(cookieNamed(cookies, 'auth_token_creator')).toContain('Max-Age=-1');
    });

    it('renova o auth_token apenas até o exp do stash (8 h fixas eram mais longas que o token)', async () => {
      const creatorToken = await generateAuthToken(
        { userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN },
        { expiresIn: '2h' },
      );
      asMock(prisma.user.findUnique).mockResolvedValue({
        id: 'c-1',
        role: UserRole.ADMIN,
        isCreator: true,
        password: CREATOR_PASSWORD_HASH,
      });
      asMock(prisma.log.create).mockResolvedValue({});

      const { req, res, resState } = createMockReqRes({
        method: 'DELETE',
        cookies: { auth_token: 'target-token', auth_token_creator: creatorToken },
        body: { password: 'CreatorPassword123!' },
      });

      await creatorAccessHandler(req, res);

      const authCookie = cookieNamed(setCookies(resState), 'auth_token') as string;
      const maxAge = Number(/Max-Age=(\d+)/i.exec(authCookie)?.[1]);
      expect(maxAge).toBeGreaterThan(0);
      expect(maxAge).toBeLessThanOrEqual(2 * 60 * 60);
    });
  });

  describe('POST /api/creator-access (entrar em conta)', () => {
    it('stash expirado não bloqueia uma nova entrada com 409', async () => {
      const creatorToken = await generateAuthToken({
        userId: 'c-1',
        email: 'creator@ex.com',
        role: UserRole.ADMIN,
      });
      const expiredStash = await generateAuthToken(
        { userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN },
        { expiresIn: '-1s' },
      );
      asMock(prisma.user.findUnique).mockImplementation(
        async ({ where }: { where: { id?: string } }) => {
          if (where.id === 'c-1')
            return {
              id: 'c-1',
              role: UserRole.ADMIN,
              isCreator: true,
              password: CREATOR_PASSWORD_HASH,
            };
          if (where.id === 'target-1')
            return {
              id: 'target-1',
              name: 'Target',
              email: 'target@ex.com',
              role: UserRole.VIEWER,
            };
          return null;
        },
      );
      asMock(prisma.log.create).mockResolvedValue({});

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: creatorToken, auth_token_creator: expiredStash },
        body: { targetUserId: 'target-1', password: 'CreatorPassword123!' },
      });

      await creatorAccessHandler(req, res);

      // Antes: 409 até o cookie de 8 h caducar. Agora o stash morto é ignorado.
      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody.impersonated).toBe(true);
    });

    it('stash válido continua bloqueando uma segunda entrada com 409', async () => {
      const creatorToken = await generateAuthToken({
        userId: 'c-1',
        email: 'creator@ex.com',
        role: UserRole.ADMIN,
      });
      asMock(prisma.user.findUnique).mockResolvedValue({
        id: 'c-1',
        role: UserRole.ADMIN,
        isCreator: true,
        password: CREATOR_PASSWORD_HASH,
      });

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: creatorToken, auth_token_creator: creatorToken },
        body: { targetUserId: 'target-1', password: 'CreatorPassword123!' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(409);
      expect(resState.jsonBody.error).toMatch(/Restaure sua conta/);
    });

    it('o maxAge do stash emitido nunca passa do exp do token', async () => {
      const creatorToken = await generateAuthToken({
        userId: 'c-1',
        email: 'creator@ex.com',
        role: UserRole.ADMIN,
      });
      asMock(prisma.user.findUnique).mockImplementation(
        async ({ where }: { where: { id?: string } }) => {
          if (where.id === 'c-1')
            return {
              id: 'c-1',
              role: UserRole.ADMIN,
              isCreator: true,
              password: CREATOR_PASSWORD_HASH,
            };
          if (where.id === 'target-1')
            return {
              id: 'target-1',
              name: 'Target',
              email: 'target@ex.com',
              role: UserRole.VIEWER,
            };
          return null;
        },
      );
      asMock(prisma.log.create).mockResolvedValue({});

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: creatorToken },
        body: { targetUserId: 'target-1', password: 'CreatorPassword123!' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(200);
      const stash = cookieNamed(setCookies(resState), 'auth_token_creator') as string;
      const maxAge = Number(/Max-Age=(\d+)/i.exec(stash)?.[1]);
      // Stash emitido a partir de um token de 8 h: o cookie não pode durar 8 h
      // *depois* de agora — `tokenLifetimeSeconds` preserva o `exp` original.
      expect(maxAge).toBeLessThanOrEqual(8 * 60 * 60);
      expect(maxAge).toBeGreaterThan(0);
    });
  });
});
