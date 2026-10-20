import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

type RevertItem = {
  id?: string;
  action?: string;
  table?: string;
  groupId?: string;
  items?: RevertItem[];
};

/**
 * Teste de integração **opt-in** contra o banco de sondagem `revert_probe`
 * (MariaDB com `Active` em SYSTEM VERSIONING).
 *
 * Rodar apenas quando o banco de sondagem estiver disponível:
 *   REVERT_PROBE_DATABASE_URL="mysql://..." yarn test __tests__/integration
 *
 * Sem a variável a suíte é pulada — o `yarn test` padrão não toca em banco.
 * O banco de sondagem contém os cenários conhecidos:
 *   A1: criado + movido 1x (ativo)      → MOVE
 *   A2: criado + editado + movido (ativo) → MOVE
 *   A3: criado + deletado (sem ativo)   → DELETE
 */

const probeUrl = process.env.REVERT_PROBE_DATABASE_URL;

if (probeUrl) {
  process.env.DATABASE_URL = probeUrl;
  process.env.JWT_SECRET = 'test-secret-key-1234567890';
}

vi.mock('@/lib/logger', () => ({ createLog: vi.fn(async () => undefined) }));

const { generateAuthToken } = await import('@/lib/auth');
const { default: revertHandler } = await import('@/pages/api/database/revert');
const { default: prisma } = await import('@/lib/prisma');

function mockRes() {
  const state = { statusCode: 200, jsonBody: null as unknown };
  const res = {
    status: vi.fn((code: number) => {
      state.statusCode = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      state.jsonBody = body;
      return res;
    }),
    setHeader: vi.fn(() => res),
  };
  return { res: res as unknown as NextApiResponse, state };
}

describe.skipIf(!probeUrl)('revert system-versioning (probe DB)', () => {
  let token: string;

  beforeAll(async () => {
    token = await generateAuthToken({
      userId: 'U1',
      email: 'root@ex.com',
      role: 'ADMIN' as never,
      name: 'Root',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function fetchItems() {
    const { res, state } = mockRes();
    await revertHandler(
      {
        method: 'GET',
        cookies: { auth_token: token },
        headers: {},
        query: {},
        socket: {},
      } as unknown as NextApiRequest,
      res
    );

    expect(state.statusCode).toBe(200);
    return (state.jsonBody as { items: RevertItem[] }).items;
  }

  it('A1: criado e movido → MOVE (não CREATE)', async () => {
    const a1 = (await fetchItems()).find((i) => i.id === 'A1');

    expect(a1).toBeDefined();
    expect(a1!.action).toBe('MOVE');
  });

  it('A2: criado, editado e movido → MOVE', async () => {
    const a2 = (await fetchItems()).find((i) => i.id === 'A2');

    expect(a2).toBeDefined();
    expect(a2!.action).toBe('MOVE');
  });

  it('A3: criado e deletado → DELETE (não CREATE)', async () => {
    const a3 = (await fetchItems()).find((i) => i.id === 'A3');

    expect(a3).toBeDefined();
    expect(a3!.action).toBe('DELETE');
  });

  it('nenhum registro do histórico fica de fora da resposta', async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM `Active` FOR SYSTEM_TIME ALL GROUP BY id'
    );
    const dbIds = new Set(rows.map((row) => row.id));

    const items = await fetchItems();
    const responseIds = new Set<string>();
    for (const item of items) {
      if (item.id) responseIds.add(item.id);
      for (const sub of item.items ?? []) {
        if (sub.id) responseIds.add(sub.id);
      }
    }

    for (const id of dbIds) {
      expect(responseIds.has(id), `registro ${id} omitido da resposta`).toBe(true);
    }
  });

  it('itens individuais saem no formato { table, id, ... }', async () => {
    const a1 = (await fetchItems()).find((i) => i.id === 'A1');

    expect(a1!.table).toBe('Active');
    expect(a1!.groupId).toBeUndefined();
    expect(a1!.items).toBeUndefined();
  });
});