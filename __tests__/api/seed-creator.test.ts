import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers/http';

/**
 * Bootstrap de `POST /api/auth/seed`.
 *
 * Regressão: o seed criava o admin master sem `isCreator`, e o schema aplica o
 * default `false`. Um sistema inicializado por seed ficava SEM criador, e o único
 * caminho para virar criador (`PATCH /api/creator-access`) exige que o solicitante
 * já seja `isCreator` — trava permanente. `POST /api/auth/signup` já fazia certo
 * (`adminCount === 0` -> `isCreator: true`).
 */

const dbMock = {
  user: {
    count: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  log: { create: vi.fn() },
  $transaction: vi.fn(async (txs: Array<Promise<unknown>>) => Promise.all(txs)),
};

vi.mock('@/lib/prisma', () => ({ default: dbMock }));

type Res = ReturnType<typeof makeRes>;

async function callSeed(res: Res, body: Record<string, unknown>, method = 'POST') {
  const { default: handler } = await import('@/pages/api/auth/seed');
  await handler(makeReq({ method, body }), res);
}

describe('POST /api/auth/seed — admin master nasce criador', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.user.count.mockResolvedValue(0); // base vazia -> seed liberado
    dbMock.user.findFirst.mockResolvedValue(null);
    dbMock.log.create.mockResolvedValue({});
    dbMock.user.create.mockResolvedValue({
      id: 'u1',
      email: 'admin@x.com',
      name: 'Administrador',
      role: 'ADMIN',
      isCreator: true,
      createdAt: new Date(),
    });
  });

  it('cria o primeiro ADMIN com isCreator: true', async () => {
    const res = makeRes();
    await callSeed(res, { email: 'admin@x.com', password: 'senha123456' });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(dbMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'ADMIN', isCreator: true }),
      })
    );
  });

  it('não aceita isCreator=false vindo do body', async () => {
    const res = makeRes();
    await callSeed(res, { email: 'admin@x.com', password: 'senha123456', isCreator: false });

    expect(res.status).toHaveBeenCalledWith(201);
    const call = dbMock.user.create.mock.calls[0][0] as {
      data: { isCreator?: unknown };
    };
    expect(call.data.isCreator).toBe(true);
  });

  it('registra o log de inicialização com o id do novo creator', async () => {
    const res = makeRes();
    await callSeed(res, { email: 'admin@x.com', password: 'senha123456' });

    expect(dbMock.log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'SYSTEM_INITIALIZED',
          userId: 'u1',
          ip: '127.0.0.1',
        }),
      })
    );
  });
});

describe('POST /api/auth/seed — travas existentes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.log.create.mockResolvedValue({});
  });

  it('bloqueia o seed quando já existe usuário (403)', async () => {
    dbMock.user.count.mockResolvedValue(1);
    const res = makeRes();
    await callSeed(res, { email: 'admin@x.com', password: 'senha123456' });

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('exige email e password (400)', async () => {
    dbMock.user.count.mockResolvedValue(0);
    const res = makeRes();
    await callSeed(res, { email: 'admin@x.com' });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('GET redireciona para /login quando o sistema já está configurado', async () => {
    dbMock.user.findFirst.mockResolvedValue({ id: 'u1' });
    const res = makeRes();
    await callSeed(res, {}, 'GET');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ redirectTo: '/login', isConfigured: true });
  });
});
