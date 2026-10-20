import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers/http';

/**
 * Prévia e cascata de exclusão de espaço — Etapa 2 da ADR-001 (2.5).
 *
 * `SPECS.md` §4.1 exige que o endpoint de delete avise o tamanho da subárvore.
 * Antes, a exclusão apagava apenas os ativos com `fatherSpaceId = id` e deixava
 * os ativos dos espaços-filho fora da conta: o cascade de `FatherSpace` removia
 * os filhos, mas `Active.fatherSpace` é Restrict — o DELETE desses espaços
 * abortava em 500 genérico, e o usuário via "erro" sem saber o que sobrou.
 *
 * Agora a mesma subárvore calculada por `lib/spaceTree.ts` alimenta a prévia
 * (`GET`) e a exclusão (`DELETE`). Os testes prendem exatamente essa
 * equivalência: o que o aviso conta é o que o delete apaga.
 */

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

const dbMock = {
  fatherSpace: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  active: {
    count: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  default: dbMock,
  prisma: dbMock,
}));

const createLog = vi.fn<
  (req: unknown, userId: unknown, action: unknown, details: string) => Promise<void>
>(async () => {});
vi.mock('@/lib/logger', () => ({ createLog }));

const deleteFileFromMinio = vi.fn(async () => {});
vi.mock('@/lib/minio', () => ({ deleteFileFromMinio }));

type Req = ReturnType<typeof makeReq>;
type Res = ReturnType<typeof makeRes>;

const authedReq = (overrides: Record<string, unknown> = {}) =>
  makeReq({ cookies: { auth_token: 'token-valido' }, query: { id: 'root' }, ...overrides });

async function callHandler(req: Req, res: Res) {
  const { default: handler } = await import('@/pages/api/father-spaces/delete');
  await handler(req, res);
}

describe('GET /api/father-spaces/delete — prévia da cascata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.fatherSpace.findUnique.mockResolvedValue({ id: 'root', name: 'Sede', imageUrl: null });
    // root → child-a → grandchild; child-b solto; outro espaço fora da árvore.
    dbMock.fatherSpace.findMany.mockResolvedValue([
      { id: 'root', parentId: null },
      { id: 'child-a', parentId: 'root' },
      { id: 'grandchild', parentId: 'child-a' },
      { id: 'child-b', parentId: 'root' },
      { id: 'unrelated', parentId: null },
    ]);
    dbMock.active.count.mockResolvedValue(5);
  });

  it('ADMIN recebe a contagem da subárvore inteira', async () => {
    setRole('ADMIN');
    const res = makeRes();

    await callHandler(authedReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      spaceId: 'root',
      spaceName: 'Sede',
      spaces: 4,
      actives: 5,
    });

    // A contagem precisa cobrir os filhos — não só o espaço clicado.
    expect(dbMock.active.count).toHaveBeenCalledWith({
      where: {
        fatherSpaceId: { in: ['root', 'child-a', 'child-b', 'grandchild'] },
      },
    });
  });

  it('não ADMIN é barrado antes de qualquer contagem', async () => {
    setRole('MANAGER');
    const res = makeRes();

    await callHandler(authedReq(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(dbMock.active.count).not.toHaveBeenCalled();
  });

  it('sem sessão devolve 401', async () => {
    setRole('ADMIN');
    const res = makeRes();

    await callHandler(authedReq({ cookies: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(dbMock.fatherSpace.findUnique).not.toHaveBeenCalled();
  });

  it('espaço inexistente devolve 404', async () => {
    setRole('ADMIN');
    dbMock.fatherSpace.findUnique.mockResolvedValue(null);
    const res = makeRes();

    await callHandler(authedReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('DELETE /api/father-spaces/delete — cascata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.fatherSpace.findUnique.mockResolvedValue({ id: 'root', name: 'Sede', imageUrl: 'http://minio/space.png' });
    dbMock.fatherSpace.findMany.mockResolvedValue([
      { id: 'root', parentId: null },
      { id: 'child-a', parentId: 'root' },
      { id: 'grandchild', parentId: 'child-a' },
      { id: 'unrelated', parentId: null },
    ]);
    dbMock.active.findMany.mockResolvedValue([
      { imageUrl: 'http://minio/a.png' },
      { imageUrl: null },
    ]);
    dbMock.active.deleteMany.mockResolvedValue({ count: 4 });
    dbMock.fatherSpace.delete.mockResolvedValue({ id: 'root' });
  });

  it('apaga os ativos da subárvore inteira, não só do espaço clicado', async () => {
    setRole('ADMIN');
    const res = makeRes();

    await callHandler(authedReq({ method: 'DELETE' }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(dbMock.active.deleteMany).toHaveBeenCalledWith({
      where: { fatherSpaceId: { in: ['root', 'child-a', 'grandchild'] } },
    });
    expect(dbMock.fatherSpace.delete).toHaveBeenCalledWith({ where: { id: 'root' } });
  });

  it('remove imagens dos ativos da subárvore e do espaço', async () => {
    setRole('ADMIN');
    const res = makeRes();

    await callHandler(authedReq({ method: 'DELETE' }), res);

    expect(deleteFileFromMinio).toHaveBeenCalledWith('http://minio/a.png');
    expect(deleteFileFromMinio).toHaveBeenCalledWith('http://minio/space.png');
  });

  it('registra no log o tamanho real da cascata', async () => {
    setRole('ADMIN');
    const res = makeRes();

    await callHandler(authedReq({ method: 'DELETE' }), res);

    const details = createLog.mock.calls[0][3];
    expect(details).toContain('4 ativo(s)');
    expect(details).toContain('3 espaço(s)');
  });

  it('método não suportado devolve 405 sem tocar o banco', async () => {
    setRole('ADMIN');
    const res = makeRes();

    await callHandler(authedReq({ method: 'POST' }), res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(dbMock.active.deleteMany).not.toHaveBeenCalled();
  });
});
