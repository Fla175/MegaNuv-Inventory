import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers/http';

/**
 * Gates de `father-spaces/create` e `father-spaces/update` — ADR-002.
 *
 * A regra é a mesma de `delete` (`canManageSpaces`): DIRECTOR e ADMIN. Os
 * testes usam uma requisição que falharia na validação de corpo logo depois do
 * gate (nome curto / id ausente): chegar ao 400 prova que o gate deixou passar;
 * o 403 prova que barrou antes de tocar o banco.
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
  fatherSpace: {
    findUnique: vi.fn(async () => null),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => data),
  },
};

vi.mock('@/lib/prisma', () => ({ default: dbMock }));

async function callCreate(role: string, body: Record<string, unknown>) {
  currentRole = role;
  const { default: handler } = await import('@/pages/api/father-spaces/create');
  const res = makeRes();
  await handler(makeReq({ method: 'POST', cookies: { auth_token: 'tok' }, body }), res);
  return res;
}

async function callUpdate(role: string, body: Record<string, unknown>) {
  currentRole = role;
  const { default: handler } = await import('@/pages/api/father-spaces/update');
  const res = makeRes();
  await handler(makeReq({ method: 'PATCH', cookies: { auth_token: 'tok' }, body }), res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/father-spaces/create — RBAC', () => {
  it.each(['DIRECTOR', 'ADMIN'])('%s passa pelo gate (400 de validação do nome)', async (role) => {
    const res = await callCreate(role, { name: 'X' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it.each(['MANAGER', 'VIEWER'])('%s recebe 403 antes de tocar o banco', async (role) => {
    const res = await callCreate(role, { name: 'Sala Nova' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.fatherSpace.findUnique).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/father-spaces/update — RBAC', () => {
  it.each(['DIRECTOR', 'ADMIN'])('%s passa pelo gate (400 de id obrigatório)', async (role) => {
    const res = await callUpdate(role, {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it.each(['MANAGER', 'VIEWER'])('%s recebe 403 antes de tocar o banco', async (role) => {
    const res = await callUpdate(role, { id: 'root', name: 'Sala Nova' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.fatherSpace.update).not.toHaveBeenCalled();
  });
});
