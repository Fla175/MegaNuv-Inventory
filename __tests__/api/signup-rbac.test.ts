import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * RBAC de `POST /api/auth/signup`.
 *
 * Regressão: o gate usava `session.role !== 'ADMIN'`, o que barrava o próprio
 * DIRECTOR — apesar de a tabela de RBAC (SPECS.md §4.2) dar a DIRECTOR "todos"
 * em *Gerencia usuários*. O Admin Criador, que é ADMIN, não era afetado; o
 * DIRECTOR não conseguia criar usuário nenhum pelo signup.
 */

let currentRole = 'ADMIN';

vi.mock('@/lib/auth', () => ({
  verifyAuthToken: vi.fn(async (token: string) =>
    token ? { userId: 'u1', email: 'dir@x.com', role: currentRole, name: 'Teste' } : null
  ),
  AuthTokenPayload: {},
}));

const dbMock = {
  user: {
    count: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  log: { create: vi.fn() },
  $transaction: vi.fn(async (txs: any[]) => Promise.all(txs)),
};

vi.mock('@/lib/prisma', () => ({ default: dbMock }));

type ResMock = { status: any; json: any; setHeader: any; end: any };

function makeReq(overrides: any = {}) {
  return {
    method: 'POST',
    cookies: {},
    headers: {},
    body: {},
    query: {},
    // o handler registra a origem do cadastro em Log e lê req.socket.remoteAddress
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as any;
}

function makeRes(): ResMock {
  const json = vi.fn();
  const status = vi.fn();
  status.mockReturnValue({ json });
  return { status, json, setHeader: vi.fn(), end: vi.fn() };
}

async function callSignup(res: ResMock, role: string, cookies: any = { auth_token: 'token-valido' }) {
  currentRole = role;
  const { default: handler } = await import('@/pages/api/auth/signup');
  const req = makeReq({
    cookies,
    body: { email: `novo-${role}@x.com`, password: 'senha123456', name: 'Novo', role: 'VIEWER' },
  });
  await handler(req, res as any);
}

describe('POST /api/auth/signup — gate de papel (RBAC SPECS.md §4.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.user.count.mockResolvedValue(1); // já existe ADMIN -> gate se aplica
    dbMock.user.findUnique.mockResolvedValue(null);
    dbMock.user.findFirst.mockResolvedValue(null);
    dbMock.user.create.mockResolvedValue({
      id: 'u9',
      email: 'novo@x.com',
      name: 'Novo',
      role: 'VIEWER',
      isCreator: false,
      createdAt: new Date(),
    });
  });

  it('ADMIN pode criar usuário (201)', async () => {
    const res = makeRes();
    await callSignup(res, 'ADMIN');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('DIRECTOR pode criar usuário (201) — regressão do bug corrigido', async () => {
    const res = makeRes();
    await callSignup(res, 'DIRECTOR');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(dbMock.user.create).toHaveBeenCalled();
  });

  it('MANAGER é barrado (403)', async () => {
    const res = makeRes();
    await callSignup(res, 'MANAGER');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('VIEWER é barrado (403)', async () => {
    const res = makeRes();
    await callSignup(res, 'VIEWER');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('sem sessão é barrado (401) mesmo quando existe ADMIN', async () => {
    const res = makeRes();
    await callSignup(res, 'DIRECTOR', {});
    expect(res.status).toHaveBeenCalledWith(401);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/signup — bootstrap do primeiro ADMIN', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.user.count.mockResolvedValue(0); // nenhum ADMIN ainda
    dbMock.user.findUnique.mockResolvedValue(null);
    dbMock.user.create.mockResolvedValue({
      id: 'u1',
      email: 'primeiro@x.com',
      name: 'Criador',
      role: 'ADMIN',
      isCreator: true,
      createdAt: new Date(),
    });
  });

  it('sem sessão cria o primeiro ADMIN como isCreator, ignorando o papel pedido', async () => {
    const res = makeRes();
    currentRole = 'VIEWER';
    const { default: handler } = await import('@/pages/api/auth/signup');
    const req = makeReq({
      cookies: {},
      body: { email: 'primeiro@x.com', password: 'senha123456', name: 'Criador', role: 'DIRECTOR' },
    });
    await handler(req, res as any);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(dbMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ADMIN', isCreator: true }),
      })
    );
  });
});