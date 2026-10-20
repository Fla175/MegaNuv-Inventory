import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers/http';

// Mock do auth: verifyAuthToken devolve um payload válido quando receber qualquer token
// não vazio, para simular sessões autenticadas sem depender de JWT real.
// O papel é configurável por teste via `currentRole`.
let currentRole = 'ADMIN';
const setRole = (role: string) => {
  currentRole = role;
};

vi.mock('@/lib/auth', () => ({
  verifyAuthToken: vi.fn(async (token: string) => {
    if (!token) return null;
    return { userId: 'u1', email: 'a@x.com', role: currentRole, name: 'Teste' };
  }),
  AuthTokenPayload: {},
}));

// Mock do singleton db
const dbMock = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  active: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  category: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  log: { create: vi.fn() },
  $transaction: vi.fn(async (txs: Array<Promise<unknown>>) => Promise.all(txs)),
};

vi.mock('@/lib/prisma', () => ({ default: dbMock }));

describe('GET /api/users (auth)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 quando não há token', async () => {
    const { default: handler } = await import('@/pages/api/users/index');
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('lista usuários autenticado (200)', async () => {
    dbMock.user.findMany.mockResolvedValue([{ id: 'u1', name: 'A', email: 'a@x.com', role: 'VIEWER' }]);
    const { default: handler } = await import('@/pages/api/users/index');
    const req = makeReq({ method: 'GET', cookies: { auth_token: 'valid-token' } });
    const res = makeRes();
    await handler(req, res);
    expect(dbMock.user.findMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('GET /api/users/check-director (auth)', () => {
  it('retorna 401 sem token', async () => {
    const { default: handler } = await import('@/pages/api/users/check-director');
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retorna exists=true autenticado', async () => {
    dbMock.user.findFirst.mockResolvedValue({ id: 'd1' });
    const { default: handler } = await import('@/pages/api/users/check-director');
    const req = makeReq({ method: 'GET', cookies: { auth_token: 'valid-token' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ exists: true });
  });
});

describe('POST /api/users (RBAC)', () => {
  it('VIEWER não pode criar usuário (403)', async () => {
    setRole('VIEWER');
    const { default: handler } = await import('@/pages/api/users/index');
    const req = makeReq({
      method: 'POST',
      cookies: { auth_token: 'valid-token' },
      body: { name: 'X', email: 'x@x.com', password: '123456', role: 'VIEWER' },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('MANAGER não pode criar ADMIN (403)', async () => {
    setRole('MANAGER');
    const { default: handler } = await import('@/pages/api/users/index');
    const req = makeReq({
      method: 'POST',
      cookies: { auth_token: 'valid-token' },
      body: { name: 'X', email: 'x@x.com', password: '123456', role: 'ADMIN' },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('cria usuário quando requester é ADMIN (201)', async () => {
    setRole('ADMIN');
    dbMock.user.create.mockResolvedValue({ id: 'u2', name: 'X', email: 'x@x.com', role: 'ADMIN' });
    const { default: handler } = await import('@/pages/api/users/index');
    const req = makeReq({
      method: 'POST',
      cookies: { auth_token: 'valid-token' },
      body: { name: 'X', email: 'x@x.com', password: '123456', role: 'ADMIN' },
    });
    const res = makeRes();
    await handler(req, res);
    expect(dbMock.user.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('authMiddleware aceita cookie e Bearer', () => {
  it('rejeita token inválido com 401', async () => {
    const { verifyAuthToken } = await import('@/lib/auth');
    vi.mocked(verifyAuthToken).mockResolvedValueOnce(null);
    const { default: handler } = await import('@/pages/api/users/check-director');
    const req = makeReq({ method: 'GET', cookies: { auth_token: 'token-invalido' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('aceita Authorization: Bearer sem cookie', async () => {
    dbMock.user.findFirst.mockResolvedValue(null);
    const { default: handler } = await import('@/pages/api/users/check-director');
    const req = makeReq({
      method: 'GET',
      headers: { authorization: 'Bearer token-valido' },
    });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ exists: false });
  });
});

describe('PUT /api/actives/update (auth)', () => {
  it('retorna 401 sem token', async () => {
    const { default: handler } = await import('@/pages/api/actives/update');
    const req = makeReq({ method: 'PUT', body: { id: 'abc' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('DELETE /api/storage/delete-url (auth)', () => {
  it('retorna 401 sem token', async () => {
    const { default: handler } = await import('@/pages/api/storage/delete-url');
    const req = makeReq({ method: 'DELETE', body: { url: 'http://x/y' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('GET /api/qrcode/public-get (auth)', () => {
  it('retorna 401 sem token', async () => {
    const { default: handler } = await import('@/pages/api/qrcode/public-get');
    const req = makeReq({ method: 'GET', query: { id: 'abc' } });
    const res = makeRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('envelope de erro do authMiddleware (SPECS.md §4.2)', () => {
  it('401 sem sessão usa a chave `error`, não `message`', async () => {
    const { default: handler } = await import('@/pages/api/users/check-director');
    const req = makeReq({ method: 'GET' });
    const res = makeRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    // O frontend lê `data.error` em todos os toasts (components/*.tsx, pages/settings.tsx).
    // Se o authMiddleware responder `message`, o usuário vê a mensagem genérica de fallback.
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('401 com token inválido também usa a chave `error`', async () => {
    const { verifyAuthToken } = await import('@/lib/auth');
    vi.mocked(verifyAuthToken).mockResolvedValueOnce(null);

    const { default: handler } = await import('@/pages/api/users/check-director');
    const req = makeReq({ method: 'GET', cookies: { auth_token: 'token-invalido' } });
    const res = makeRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});

describe('authMiddleware com requiredRoles', () => {
  it('403 usa a chave `error` quando o papel não é permitido', async () => {
    const { authMiddleware } = await import('@/lib/middlewares/authMiddleware');
    const handler = vi.fn();
    const wrapped = authMiddleware(handler, ['DIRECTOR', 'ADMIN']);

    setRole('VIEWER');
    const req = makeReq({ method: 'GET', cookies: { auth_token: 'token-valido' } });
    const res = makeRes();
    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('deixa passar quando o papel é permitido', async () => {
    const { authMiddleware } = await import('@/lib/middlewares/authMiddleware');
    const handler = vi.fn();
    const wrapped = authMiddleware(handler, ['DIRECTOR', 'ADMIN']);

    setRole('ADMIN');
    const req = makeReq({ method: 'GET', cookies: { auth_token: 'token-valido' } });
    const res = makeRes();
    await wrapped(req, res);

    expect(handler).toHaveBeenCalled();
  });
});
