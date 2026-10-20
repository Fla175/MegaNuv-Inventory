import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserRole } from '@prisma/client';
import { makeReq, makeRes } from '../helpers/http';

/**
 * RBAC de usuários — matriz da ADR-002 / `SPECS.md` §4.2.
 *
 * Regressões que estes testes prendem (todas existiam em `f2c93e7`):
 * - `POST /api/users` só barrava MANAGER de criar ADMIN: um MANAGER criava
 *   DIRECTOR, papel acima do dele.
 * - `PATCH/DELETE /api/users/[id]` comparavam apenas com ADMIN: um MANAGER
 *   editava/excluía DIRECTOR, e o DIRECTOR não gerenciava ninguém.
 * - ADMIN criava DIRECTOR pelo signup (o papel é singleton do criador).
 */

let requester = {
  id: 'u-req',
  email: 'req@x.com',
  role: 'ADMIN' as UserRole,
  isCreator: false,
};
let target: { id: string; role: UserRole } = { id: 'target-1', role: 'VIEWER' };
let directorExists = false;

vi.mock('@/lib/auth', () => ({
  verifyAuthToken: vi.fn(async (token: string) =>
    token
      ? { userId: requester.id, email: requester.email, role: requester.role, name: 'Teste' }
      : null
  ),
  AuthTokenPayload: {},
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(async (password: string) => `hash:${password}`), compare: vi.fn() },
}));

const dbMock = {
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.email === requester.email || where.id === requester.id) return requester;
      if (where.id === target.id) return target;
      return null;
    }),
    findFirst: vi.fn(async () => (directorExists ? { id: 'dir-existente' } : null)),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'new', ...data })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: target.id, ...data })),
    delete: vi.fn(async () => ({ id: target.id })),
  },
  log: { create: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ default: dbMock }));

function setActor(role: UserRole, isCreator = false) {
  requester = { id: 'u-req', email: 'req@x.com', role, isCreator };
}

function setTarget(role: UserRole, id = 'target-1') {
  target = { id, role };
}

async function postUser(body: Record<string, unknown>) {
  const { default: handler } = await import('@/pages/api/users/index');
  const res = makeRes();
  await handler(makeReq({ method: 'POST', cookies: { auth_token: 'tok' }, body }), res);
  return res;
}

async function patchUser(body: Record<string, unknown>, id = target.id) {
  const { default: handler } = await import('@/pages/api/users/[id]');
  const res = makeRes();
  await handler(
    makeReq({ method: 'PATCH', cookies: { auth_token: 'tok' }, query: { id }, body }),
    res
  );
  return res;
}

async function deleteUser(id = target.id) {
  const { default: handler } = await import('@/pages/api/users/[id]');
  const res = makeRes();
  await handler(makeReq({ method: 'DELETE', cookies: { auth_token: 'tok' }, query: { id } }), res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  directorExists = false;
  setActor('ADMIN');
  setTarget('VIEWER');
});

describe('POST /api/users — criação', () => {
  it('MANAGER não cria DIRECTOR (fecha a escalada de privilégio)', async () => {
    setActor('MANAGER');
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'DIRECTOR' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('MANAGER não cria ADMIN', async () => {
    setActor('MANAGER');
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'ADMIN' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('MANAGER cria VIEWER', async () => {
    setActor('MANAGER');
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'VIEWER' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(dbMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'VIEWER' }) })
    );
  });

  it('ADMIN comum não cria DIRECTOR', async () => {
    setActor('ADMIN');
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'DIRECTOR' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('criador ADMIN cria o primeiro DIRECTOR', async () => {
    setActor('ADMIN', true);
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'DIRECTOR' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(dbMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'DIRECTOR' }) })
    );
  });

  it('criador ADMIN não cria um segundo DIRECTOR', async () => {
    setActor('ADMIN', true);
    directorExists = true;
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'DIRECTOR' });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('DIRECTOR cria ADMIN', async () => {
    setActor('DIRECTOR');
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'ADMIN' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('VIEWER não cria ninguém', async () => {
    setActor('VIEWER');
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'VIEWER' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('papel desconhecido devolve 400, não 500', async () => {
    setActor('ADMIN');
    const res = await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'SUPERADMIN' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it('a resposta nunca seleciona o hash de senha', async () => {
    setActor('ADMIN');
    await postUser({ name: 'X', email: 'x@x.com', password: 'p', role: 'VIEWER' });
    const [args] = dbMock.user.create.mock.calls[0] as unknown as [
      { select: Record<string, unknown> },
    ];
    expect(args.select).not.toHaveProperty('password');
  });
});

describe('PATCH /api/users/[id] — edição e troca de papel', () => {
  it('MANAGER não edita DIRECTOR', async () => {
    setActor('MANAGER');
    setTarget('DIRECTOR');
    const res = await patchUser({ name: 'X' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.update).not.toHaveBeenCalled();
  });

  it('MANAGER não edita ADMIN', async () => {
    setActor('MANAGER');
    setTarget('ADMIN');
    const res = await patchUser({ name: 'X' });
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('MANAGER não edita outro MANAGER', async () => {
    setActor('MANAGER');
    setTarget('MANAGER');
    const res = await patchUser({ name: 'X' });
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('MANAGER edita VIEWER', async () => {
    setActor('MANAGER');
    setTarget('VIEWER');
    const res = await patchUser({ name: 'X' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('ADMIN não edita DIRECTOR', async () => {
    setActor('ADMIN');
    setTarget('DIRECTOR');
    const res = await patchUser({ name: 'X' });
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('DIRECTOR edita ADMIN', async () => {
    setActor('DIRECTOR');
    setTarget('ADMIN');
    const res = await patchUser({ name: 'X' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('ADMIN promove VIEWER a ADMIN', async () => {
    setActor('ADMIN');
    setTarget('VIEWER');
    const res = await patchUser({ name: 'X', role: 'ADMIN' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(dbMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'ADMIN' }) })
    );
  });

  it('ADMIN não promove ninguém a DIRECTOR', async () => {
    setActor('ADMIN');
    setTarget('VIEWER');
    const res = await patchUser({ role: 'DIRECTOR' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.update).not.toHaveBeenCalled();
  });

  it('criador ADMIN promove VIEWER a DIRECTOR quando não existe um', async () => {
    setActor('ADMIN', true);
    setTarget('VIEWER');
    const res = await patchUser({ role: 'DIRECTOR' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(dbMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'DIRECTOR' }) })
    );
  });

  it('VIEWER não edita outro usuário', async () => {
    setActor('VIEWER');
    setTarget('VIEWER');
    const res = await patchUser({ name: 'X' });
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('VIEWER edita o próprio perfil', async () => {
    setActor('VIEWER');
    setTarget('VIEWER', 'u-req');
    const res = await patchUser({ name: 'Meu Nome' }, 'u-req');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('ninguém troca o próprio papel', async () => {
    setActor('ADMIN');
    setTarget('ADMIN', 'u-req');
    const res = await patchUser({ role: 'MANAGER' }, 'u-req');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.update).not.toHaveBeenCalled();
  });

  it('papel desconhecido devolve 400', async () => {
    setActor('ADMIN');
    const res = await patchUser({ role: 'SUPERADMIN' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('a resposta nunca seleciona o hash de senha', async () => {
    setActor('ADMIN');
    await patchUser({ name: 'X' });
    const [args] = dbMock.user.update.mock.calls[0] as unknown as [
      { select: Record<string, unknown> },
    ];
    expect(args.select).not.toHaveProperty('password');
  });
});

describe('DELETE /api/users/[id]', () => {
  it('MANAGER não exclui DIRECTOR', async () => {
    setActor('MANAGER');
    setTarget('DIRECTOR');
    const res = await deleteUser();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.user.delete).not.toHaveBeenCalled();
  });

  it('MANAGER exclui VIEWER', async () => {
    setActor('MANAGER');
    setTarget('VIEWER');
    const res = await deleteUser();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(dbMock.user.delete).toHaveBeenCalled();
  });

  it('ADMIN não exclui DIRECTOR', async () => {
    setActor('ADMIN');
    setTarget('DIRECTOR');
    const res = await deleteUser();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('DIRECTOR exclui ADMIN', async () => {
    setActor('DIRECTOR');
    setTarget('ADMIN');
    const res = await deleteUser();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(dbMock.user.delete).toHaveBeenCalled();
  });

  it('VIEWER não exclui ninguém', async () => {
    setActor('VIEWER');
    setTarget('VIEWER');
    const res = await deleteUser();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
