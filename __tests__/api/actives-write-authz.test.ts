import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers/http';

/**
 * Autorização de escrita em `POST /api/actives/clone-batch` e
 * `PUT /api/actives/update` — Etapa 0 da ADR-001.
 *
 * Regressão: os dois endpoints de mutação não verificavam papel algum.
 *
 * - `clone-batch` não importava `authMiddleware` e exportava o handler cru:
 *   qualquer sessão autenticada — inclusive VIEWER — criava até 50 cópias
 *   de qualquer ativo, copiando `fixedValue` e `notes` do original.
 * - `update` usava `authMiddleware(handler)` sem `requiredRoles`, que valida
 *   a sessão mas não o papel: um VIEWER autenticado editava qualquer ativo por
 *   ID, e `applyToSimilar` propagava a alteração para todos os ativos de
 *   mesmo name/manufacturer/model/sku.
 *
 * A regra de produto (ADR-001 §1): ADMIN, MANAGER e DIRECTOR podem ver e
 * editar o valor; somente VIEWER não pode nada. O card de patrimônio total
 * é a exceção e permanece restrito.
 *
 * Semântica de guarda: os endpoints que já seguiam a regra
 * (`delete.ts:17`, `move.ts:41`) rejeitam apenas VIEWER e deixam os demais
 * papéis passarem. A correção adota a mesma semântica — `requiredRoles`
 * lista os três papéis autorizados, que é o conjunto complementar a VIEWER.
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
  active: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  fatherSpace: { findUnique: vi.fn() },
  category: { findUnique: vi.fn() },
  log: { create: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({
  default: dbMock,
  prisma: dbMock,
  generateUniqueHexId: vi.fn(async () => 'a1b2'),
}));

type Res = ReturnType<typeof makeRes>;

const authedReq = (overrides: Record<string, unknown> = {}) =>
  makeReq({ cookies: { auth_token: 'token-valido' }, ...overrides });

async function callCloneBatch(res: Res, role: string, body: Record<string, unknown> = {}) {
  setRole(role);
  const { default: handler } = await import('@/pages/api/actives/clone-batch');
  await handler(authedReq({ method: 'POST', body }), res);
}

async function callUpdate(res: Res, role: string, body: Record<string, unknown> = {}) {
  setRole(role);
  const { default: handler } = await import('@/pages/api/actives/update');
  await handler(authedReq({ method: 'PUT', body }), res);
}

describe('Etapa 0 (ADR-001) — VIEWER não pode escrever em ativos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.active.findMany.mockResolvedValue([]);
    dbMock.active.createMany.mockResolvedValue({ count: 0 });
    dbMock.active.findUnique.mockResolvedValue(null);
    dbMock.active.update.mockResolvedValue({ id: 'a1b2' });
    dbMock.active.updateMany.mockResolvedValue({ count: 0 });
  });

  describe('POST /api/actives/clone-batch', () => {
    it('VIEWER recebe 403 e nenhuma linha é criada', async () => {
      const res = makeRes();
      // Mesmo com o mock devolvendo ativos, o guarda precisa barrar antes
      // de qualquer leitura ou escrita.
      dbMock.active.findMany.mockResolvedValue([
        { id: 'a1b2', name: 'Impressora', fatherSpaceId: '0000', fixedValue: 500 },
      ]);

      await callCloneBatch(res, 'VIEWER', {
        activeIds: ['a1b2'],
        quantity: 50,
        destinationSpaceId: '0000',
      });

      expect(res.status).toHaveBeenCalledWith(403);
      // A gravação nunca pode ocorrer: o defeito original criava até 50 cópias.
      expect(dbMock.active.createMany).not.toHaveBeenCalled();
    });

    it('VIEWER recebe 403 mesmo sem token (sessão ausente)', async () => {
      const res = makeRes();
      setRole('VIEWER');
      const { default: handler } = await import('@/pages/api/actives/clone-batch');

      await handler(makeReq({ method: 'POST', cookies: {}, body: { activeIds: ['a1b2'] } }), res);

      // Sem token, a resposta deve ser 401 (não identificada), nunca 200.
      expect(res.status).toHaveBeenCalledWith(401);
      expect(dbMock.active.createMany).not.toHaveBeenCalled();
    });

    it.each(['ADMIN', 'MANAGER', 'DIRECTOR'])('%s não é barrado por papel', async (role) => {
      const res = makeRes();
      dbMock.active.findMany.mockResolvedValue([
        { id: 'a1b2', name: 'Impressora', fatherSpaceId: '0000', fixedValue: 500 },
      ]);
      dbMock.fatherSpace.findUnique.mockResolvedValue({ id: '0000', name: 'Sede' });

      await callCloneBatch(res, role, { activeIds: ['a1b2'], quantity: 2, destinationSpaceId: '0000' });

      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(dbMock.active.createMany).toHaveBeenCalledTimes(1);
    });

    it('os clones registram a autoria (createdById)', async () => {
      const res = makeRes();
      dbMock.active.findMany.mockResolvedValue([
        { id: 'a1b2', name: 'Impressora', fatherSpaceId: '0000', fixedValue: 500 },
      ]);
      dbMock.fatherSpace.findUnique.mockResolvedValue({ id: '0000', name: 'Sede' });

      await callCloneBatch(res, 'ADMIN', { activeIds: ['a1b2'], quantity: 1, destinationSpaceId: '0000' });

      const args = dbMock.active.createMany.mock.calls[0][0] as {
        data: Array<{ createdById?: string }>;
      };
      expect(args.data[0]).toHaveProperty('createdById', 'u1');
    });
  });

  describe('PUT /api/actives/update', () => {
    it('VIEWER recebe 403 e nenhum registro é alterado', async () => {
      const res = makeRes();
      dbMock.active.findUnique.mockResolvedValue({ id: 'a1b2', name: 'Impressora', fixedValue: 500 });

      await callUpdate(res, 'VIEWER', { id: 'a1b2', name: 'Renomeado' });

      expect(res.status).toHaveBeenCalledWith(403);
      expect(dbMock.active.update).not.toHaveBeenCalled();
    });

    it('VIEWER não propaga via applyToSimilar', async () => {
      const res = makeRes();
      dbMock.active.findUnique.mockResolvedValue({ id: 'a1b2', name: 'Impressora', fixedValue: 500 });

      await callUpdate(res, 'VIEWER', {
        id: 'a1b2',
        name: 'Renomeado',
        applyToSimilar: true,
      });

      expect(res.status).toHaveBeenCalledWith(403);
      // O defeito original escrevia em N registros com um único PUT.
      expect(dbMock.active.updateMany).not.toHaveBeenCalled();
      expect(dbMock.active.update).not.toHaveBeenCalled();
    });

    it('VIEWER não apaga o valor do ativo', async () => {
      const res = makeRes();
      dbMock.active.findUnique.mockResolvedValue({ id: 'a1b2', name: 'Impressora', fixedValue: 1250 });

      await callUpdate(res, 'VIEWER', { id: 'a1b2', fixedValue: 0 });

      expect(res.status).toHaveBeenCalledWith(403);
      expect(dbMock.active.update).not.toHaveBeenCalled();
    });

    it.each(['ADMIN', 'MANAGER', 'DIRECTOR'])('%s não é barrado por papel', async (role) => {
      const res = makeRes();
      dbMock.active.findUnique.mockResolvedValue({ id: 'a1b2', name: 'Impressora', fixedValue: 500 });

      await callUpdate(res, role, { id: 'a1b2', name: 'Renomeado' });

      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(dbMock.active.update).toHaveBeenCalledTimes(1);
    });
  });
});