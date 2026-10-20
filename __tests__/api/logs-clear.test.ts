import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers/http';

/**
 * `DELETE /api/logs/clear` — ADR-002: DIRECTOR e ADMIN apagam; MANAGER só lê.
 *
 * Antes o handler era ADMIN-only, enquanto a UI mostrava o botão ao DIRECTOR
 * (que recebia 403) e a matriz dava ao DIRECTOR "inclusive edita/deleta".
 */

let currentRole = 'ADMIN';

vi.mock('@/lib/auth', () => ({
  verifyAuthToken: vi.fn(async (token: string) =>
    token ? { userId: 'u1', email: 'a@x.com', role: currentRole, name: 'Teste' } : null
  ),
  AuthTokenPayload: {},
}));

const createLog = vi.fn(async () => {});

vi.mock('@/lib/logger', () => ({ createLog }));

const dbMock = {
  log: { deleteMany: vi.fn(async () => ({ count: 0 })) },
};

vi.mock('@/lib/prisma', () => ({ default: dbMock }));

async function clearLogs(role: string) {
  currentRole = role;
  const { default: handler } = await import('@/pages/api/logs/clear');
  const res = makeRes();
  await handler(
    makeReq({ method: 'DELETE', cookies: { auth_token: 'tok' }, query: { range: 'all' } }),
    res
  );
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DELETE /api/logs/clear — RBAC', () => {
  it.each(['DIRECTOR', 'ADMIN'])('%s apaga os logs', async (role) => {
    const res = await clearLogs(role);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(dbMock.log.deleteMany).toHaveBeenCalled();
    expect(createLog).toHaveBeenCalled();
  });

  it.each(['MANAGER', 'VIEWER'])('%s não apaga os logs', async (role) => {
    const res = await clearLogs(role);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.log.deleteMany).not.toHaveBeenCalled();
    expect(createLog).not.toHaveBeenCalled();
  });

  it('sem sessão devolve 401', async () => {
    currentRole = 'ADMIN';
    const { default: handler } = await import('@/pages/api/logs/clear');
    const res = makeRes();
    await handler(makeReq({ method: 'DELETE', cookies: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(dbMock.log.deleteMany).not.toHaveBeenCalled();
  });
});
