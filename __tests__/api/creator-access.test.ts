import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '@prisma/client';
import { generateAuthToken, verifyAuthToken } from '@/lib/auth';
import creatorAccessHandler from '@/pages/api/creator-access';
import logoutHandler from '@/pages/api/auth/logout';
import meHandler from '@/pages/api/auth/me';
import usersHandler from '@/pages/api/users/index';
import userDetailHandler from '@/pages/api/users/[id]';
import prisma from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => {
  const mockUser = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const mockLog = {
    create: vi.fn(),
  };

  return {
    default: {
      user: mockUser,
      log: mockLog,
      $transaction: vi.fn(async (cb) => cb({ user: mockUser, log: mockLog })),
    },
  };
});

function createMockReqRes(options: {
  method?: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}) {
  const req: Partial<NextApiRequest> = {
    method: options.method || 'GET',
    cookies: options.cookies || {},
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
    socket: { remoteAddress: '127.0.0.1' } as any,
  };

  const resState: {
    statusCode: number;
    headers: Record<string, any>;
    jsonBody: any;
  } = {
    statusCode: 200,
    headers: {},
    jsonBody: null,
  };

  const res: Partial<NextApiResponse> = {
    status: vi.fn((code: number) => {
      resState.statusCode = code;
      return res as NextApiResponse;
    }),
    json: vi.fn((body: any) => {
      resState.jsonBody = body;
      return res as NextApiResponse;
    }),
    setHeader: vi.fn((key: string, value: any) => {
      resState.headers[key] = value;
      return res as NextApiResponse;
    }),
  };

  return { req: req as NextApiRequest, res: res as NextApiResponse, resState };
}

describe('pages/api/creator-access', () => {
  const origEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...origEnv,
      JWT_SECRET: 'test-secret-key-1234567890',
      CREATOR_ACCESS_ENABLED: 'true',
    };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  describe('Kill Switch Guard', () => {
    it('returns 403 when CREATOR_ACCESS_ENABLED is not true', async () => {
      process.env.CREATOR_ACCESS_ENABLED = 'false';
      const { req, res, resState } = createMockReqRes({ method: 'POST' });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(403);
      expect(resState.jsonBody).toEqual({ error: 'Creator access desabilitado.' });
    });

    it('returns 403 when CREATOR_ACCESS_ENABLED is absent (undefined !== "true")', async () => {
      // Regressão do bug: a flag não é declarada no .env de produção, então
      // `process.env.CREATOR_ACCESS_ENABLED !== 'true'` era sempre verdadeiro e
      // o botão "Entrar" da UI falhava com 403 mesmo para o creator.
      delete process.env.CREATOR_ACCESS_ENABLED;
      expect(process.env.CREATOR_ACCESS_ENABLED).toBeUndefined();

      const { req, res, resState } = createMockReqRes({ method: 'POST' });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(403);
      expect(resState.jsonBody).toEqual({ error: 'Creator access desabilitado.' });
    });

    it('blocks DELETE and PATCH too when CREATOR_ACCESS_ENABLED is absent', async () => {
      delete process.env.CREATOR_ACCESS_ENABLED;

      for (const method of ['DELETE', 'PATCH'] as const) {
        const { req, res, resState } = createMockReqRes({ method });
        await creatorAccessHandler(req, res);
        expect(resState.statusCode).toBe(403);
        expect(resState.jsonBody).toEqual({ error: 'Creator access desabilitado.' });
      }
    });
  });

  describe('RBAC & Auth Guard (POST)', () => {
    it('returns 401 when unauthenticated (no token)', async () => {
      const { req, res, resState } = createMockReqRes({ method: 'POST' });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(401);
    });

    it.each([
      { role: UserRole.VIEWER, isCreator: false },
      { role: UserRole.MANAGER, isCreator: false },
      { role: UserRole.ADMIN, isCreator: false },
      { role: UserRole.DIRECTOR, isCreator: false },
    ])('returns 403 for non-creator user with role %s', async ({ role, isCreator }) => {
      const token = await generateAuthToken({ userId: 'u-1', email: 'test@ex.com', role });
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'u-1', role, isCreator });

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: token },
        body: { targetUserId: 'target-1' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(403);
      expect(resState.jsonBody).toEqual({ error: 'Acesso restrito ao criador.' });
    });

    it('returns 200 for creator user', async () => {
      const token = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockImplementation(async ({ where }: any) => {
        if (where.id === 'c-1') return { id: 'c-1', role: UserRole.ADMIN, isCreator: true };
        if (where.id === 'target-1') return { id: 'target-1', name: 'Target User', email: 'target@ex.com', role: UserRole.VIEWER };
        return null;
      });

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: token },
        body: { targetUserId: 'target-1' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody.impersonated).toBe(true);
      expect(resState.jsonBody.user.id).toBe('target-1');

      // Verify Set-Cookie header issued both auth_token (2h) and auth_token_creator (8h)
      const setCookie = resState.headers['Set-Cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c: string) => c.startsWith('auth_token='))).toBe(true);
      expect(setCookie.some((c: string) => c.startsWith('auth_token_creator='))).toBe(true);
    });
  });

  describe('Input & Stash Guards', () => {
    it('returns 400 when targetUserId is missing', async () => {
      const token = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'c-1', role: UserRole.ADMIN, isCreator: true });

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: token },
        body: {},
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(400);
      expect(resState.jsonBody.error).toMatch(/targetUserId/);
    });

    it('returns 400 when targetUserId is self', async () => {
      const token = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'c-1', role: UserRole.ADMIN, isCreator: true });

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: token },
        body: { targetUserId: 'c-1' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(400);
      expect(resState.jsonBody.error).toMatch(/própria conta/);
    });

    it('returns 409 when stash cookie auth_token_creator is already present', async () => {
      const token = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'c-1', role: UserRole.ADMIN, isCreator: true });

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: token, auth_token_creator: 'existing-stash' },
        body: { targetUserId: 'target-1' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(409);
      expect(resState.jsonBody.error).toMatch(/Restaure sua conta/);
    });

    it('returns 404 when target user does not exist', async () => {
      const token = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockImplementation(async ({ where }: any) => {
        if (where.id === 'c-1') return { id: 'c-1', role: UserRole.ADMIN, isCreator: true };
        return null;
      });

      const { req, res, resState } = createMockReqRes({
        method: 'POST',
        cookies: { auth_token: token },
        body: { targetUserId: 'non-existent' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(404);
    });

    it('returns 405 for unsupported method (PUT)', async () => {
      const { req, res, resState } = createMockReqRes({ method: 'PUT' });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(405);
    });
  });

  describe('DELETE (Restore)', () => {
    it('returns 400 if no auth_token_creator stash cookie exists', async () => {
      const { req, res, resState } = createMockReqRes({ method: 'DELETE' });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(400);
      expect(resState.jsonBody.error).toMatch(/Nenhuma sessão/);
    });

    it('swaps auth_token to stash and clears auth_token_creator on DELETE', async () => {
      const creatorToken = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN, name: 'Creator' });
      const targetToken = await generateAuthToken({ userId: 't-1', email: 'target@ex.com', role: UserRole.VIEWER });

      const { req, res, resState } = createMockReqRes({
        method: 'DELETE',
        cookies: {
          auth_token: targetToken,
          auth_token_creator: creatorToken,
        },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody).toEqual({ restored: true });

      const setCookie = resState.headers['Set-Cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c: string) => c.includes(`auth_token=${creatorToken}`))).toBe(true);
      expect(setCookie.some((c: string) => c.includes('auth_token_creator=') && c.includes('Max-Age=-1'))).toBe(true);
    });
  });

  describe('PATCH (Transfer Creator Title)', () => {
    it('promotes VIEWER target to ADMIN and transfers title', async () => {
      const creatorToken = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockImplementation(async ({ where }: any) => {
        if (where.id === 'c-1') return { id: 'c-1', role: UserRole.ADMIN, isCreator: true };
        if (where.id === 'new-c') return { id: 'new-c', role: UserRole.VIEWER, email: 'new@ex.com' };
        return null;
      });

      const { req, res, resState } = createMockReqRes({
        method: 'PATCH',
        cookies: { auth_token: creatorToken },
        body: { newCreatorId: 'new-c' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody).toEqual({ success: true, newCreatorId: 'new-c' });
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { isCreator: true },
        data: { isCreator: false },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'new-c' },
        data: { isCreator: true, role: UserRole.ADMIN },
      });
    });

    it('preserves DIRECTOR role when transferring title', async () => {
      const creatorToken = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockImplementation(async ({ where }: any) => {
        if (where.id === 'c-1') return { id: 'c-1', role: UserRole.ADMIN, isCreator: true };
        if (where.id === 'dir-1') return { id: 'dir-1', role: UserRole.DIRECTOR, email: 'dir@ex.com' };
        return null;
      });

      const { req, res, resState } = createMockReqRes({
        method: 'PATCH',
        cookies: { auth_token: creatorToken },
        body: { newCreatorId: 'dir-1' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'dir-1' },
        data: { isCreator: true, role: UserRole.DIRECTOR },
      });
    });

    it('returns 400 when attempting self-transfer', async () => {
      const creatorToken = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockResolvedValue({ id: 'c-1', role: UserRole.ADMIN, isCreator: true });

      const { req, res, resState } = createMockReqRes({
        method: 'PATCH',
        cookies: { auth_token: creatorToken },
        body: { newCreatorId: 'c-1' },
      });

      await creatorAccessHandler(req, res);

      expect(resState.statusCode).toBe(400);
    });
  });

  describe('Blindness / Regression Tests (Rule A)', () => {
    it('POST /api/users does NOT accept or save isCreator field', async () => {
      const adminToken = await generateAuthToken({ userId: 'admin-1', email: 'admin@ex.com', role: UserRole.ADMIN });

      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: { authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Hacker User',
          email: 'hacker@ex.com',
          password: 'Password123!',
          role: 'ADMIN',
          isCreator: true, // Malicious payload attempting escalation
        },
      });

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockImplementation(async ({ data }: any) => data);

      await usersHandler(req, res);

      expect(prisma.user.create).toHaveBeenCalled();
      const createdData = (prisma.user.create as any).mock.calls[0][0].data;
      expect(createdData.isCreator).toBeUndefined();
    });

    it('PATCH /api/users/[id] does NOT accept or update isCreator field', async () => {
      const adminToken = await generateAuthToken({ userId: 'admin-1', email: 'admin@ex.com', role: UserRole.ADMIN });

      (prisma.user.findUnique as any).mockImplementation(async ({ where }: any) => {
        if (where.email === 'admin@ex.com') return { id: 'admin-1', email: 'admin@ex.com', role: UserRole.ADMIN };
        if (where.id === 'target-1') return { id: 'target-1', role: UserRole.VIEWER };
        return null;
      });
      (prisma.user.update as any).mockImplementation(async ({ data }: any) => data);

      const { req, res } = createMockReqRes({
        method: 'PATCH',
        query: { id: 'target-1' },
        cookies: { auth_token: adminToken },
        body: {
          name: 'Updated Name',
          email: 'updated@ex.com',
          role: 'ADMIN',
          isCreator: true, // Malicious payload
        },
      });

      await userDetailHandler(req, res);

      expect(prisma.user.update).toHaveBeenCalled();
      const updatedData = (prisma.user.update as any).mock.calls[0][0].data;
      expect(updatedData.isCreator).toBeUndefined();
    });
  });

  describe('Logout behavior (Rule C)', () => {
    it('clears both auth_token and auth_token_creator cookies on logout', async () => {
      const { req, res, resState } = createMockReqRes({ method: 'POST' });

      await logoutHandler(req, res);

      expect(resState.statusCode).toBe(200);
      const setCookie = resState.headers['Set-Cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c: string) => c.startsWith('auth_token=') && c.includes('Max-Age=-1'))).toBe(true);
      expect(setCookie.some((c: string) => c.startsWith('auth_token_creator=') && c.includes('Max-Age=-1'))).toBe(true);
    });
  });

  describe('me API signalization', () => {
    it('returns isCreator field and null impersonation when no stash present', async () => {
      const token = await generateAuthToken({ userId: 'u-1', email: 'user@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u-1',
        name: 'Normal User',
        email: 'user@ex.com',
        role: UserRole.ADMIN,
        theme: 'SYSTEM',
        isCreator: true,
        lastLogin: null,
        createdAt: new Date(),
      });

      const { req, res, resState } = createMockReqRes({
        method: 'GET',
        cookies: { auth_token: token },
      });

      await meHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody.user.isCreator).toBe(true);
      expect(resState.jsonBody.impersonation).toBeNull();
    });

    it('returns impersonation active object when auth_token_creator stash present', async () => {
      const targetToken = await generateAuthToken({ userId: 't-1', email: 'target@ex.com', role: UserRole.VIEWER });
      const stashToken = await generateAuthToken({ userId: 'c-1', email: 'creator@ex.com', role: UserRole.ADMIN, name: 'Boss Creator' });

      (prisma.user.findUnique as any).mockResolvedValue({
        id: 't-1',
        name: 'Target User',
        email: 'target@ex.com',
        role: UserRole.VIEWER,
        theme: 'SYSTEM',
        isCreator: false,
        lastLogin: null,
        createdAt: new Date(),
      });

      const { req, res, resState } = createMockReqRes({
        method: 'GET',
        cookies: {
          auth_token: targetToken,
          auth_token_creator: stashToken,
        },
      });

      await meHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody.user.isCreator).toBe(false);
      expect(resState.jsonBody.impersonation).toEqual({
        active: true,
        creatorName: 'Boss Creator',
      });
    });

    it('exposes creatorAccessEnabled=true when the flag is exactly "true"', async () => {
      process.env.CREATOR_ACCESS_ENABLED = 'true';
      const token = await generateAuthToken({ userId: 'u-1', email: 'user@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u-1',
        name: 'Normal User',
        email: 'user@ex.com',
        role: UserRole.ADMIN,
        theme: 'SYSTEM',
        isCreator: true,
        lastLogin: null,
        createdAt: new Date(),
      });

      const { req, res, resState } = createMockReqRes({ method: 'GET', cookies: { auth_token: token } });
      await meHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody.user.creatorAccessEnabled).toBe(true);
    });

    it.each([
      { label: 'absent', value: undefined },
      { label: '"false"', value: 'false' },
      { label: '"TRUE"', value: 'TRUE' },
      { label: '"1"', value: '1' },
    ])('exposes creatorAccessEnabled=false when the flag is $label', async ({ value }) => {
      if (value === undefined) delete process.env.CREATOR_ACCESS_ENABLED;
      else process.env.CREATOR_ACCESS_ENABLED = value;

      const token = await generateAuthToken({ userId: 'u-1', email: 'user@ex.com', role: UserRole.ADMIN });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'u-1',
        name: 'Normal User',
        email: 'user@ex.com',
        role: UserRole.ADMIN,
        theme: 'SYSTEM',
        isCreator: true,
        lastLogin: null,
        createdAt: new Date(),
      });

      const { req, res, resState } = createMockReqRes({ method: 'GET', cookies: { auth_token: token } });
      await meHandler(req, res);

      expect(resState.statusCode).toBe(200);
      expect(resState.jsonBody.user.creatorAccessEnabled).toBe(false);
    });
  });
});
