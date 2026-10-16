import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Contrato do `GET /api/database/revert` contra a verdade de campo levantada
 * no banco `revert_probe` (system-versioning ativo).
 *
 * O Prisma é substituído por fixtures: este teste não depende de MariaDB e
 * descreve o que a API **deve** devolver — é por isso que ele fica vermelho
 * enquanto a classificação ainda mora dentro do handler.
 */

const probe = vi.hoisted(() => ({ rows: [] as unknown[], error: null as unknown }));

vi.mock('@/lib/prisma', () => {
  const client = {
    // Queries com `WHERE id = ?` recebem o id como último parâmetro (o AS OF
    // vem antes); o GET não passa parâmetros e recebe o histórico completo.
    $queryRawUnsafe: vi.fn(async (_sql: string, ...params: unknown[]) => {
      // Simula a falha do driver (MariaDB 4124) para os casos de 503.
      if (probe.error) throw probe.error;
      const id = params[params.length - 1];
      if (typeof id === 'string') {
        return probe.rows.filter((row) => (row as { id: string }).id === id);
      }
      return probe.rows;
    }),
    $queryRaw: vi.fn(async () => probe.rows),
    $executeRawUnsafe: vi.fn(async () => 0),
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(client)),
  };
  return { default: client };
});

vi.mock('@/lib/logger', () => ({ createLog: vi.fn(async () => undefined) }));

import { generateAuthToken } from '@/lib/auth';
import revertHandler from '@/pages/api/database/revert';

const OPEN = '2038-01-19 03:14:07.999999';

const T0 = '2026-10-01T10:00:00.000Z';
const T1 = '2026-10-01T10:00:02.000Z';
const T2 = '2026-10-01T10:00:05.000Z';
const T4 = '2026-10-01T10:00:20.000Z';

function version(
  id: string,
  name: string,
  start: string,
  end: string | null,
  fatherSpaceId: string
) {
  return { id, name, fatherSpaceId, ROW_START: start, ROW_END: end ?? OPEN };
}

/** Registros do probe: A1/A2/A3 observados, Z1/Z2 descobertos no diagnóstico. */
function fixtureRows() {
  return [
    // A1 — criado e movido 1x (antes: CREATE; correto: MOVE)
    version('A1', 'Rack A1', T0, T1, 'SP1'),
    version('A1', 'Rack A1', T1, null, 'SP2'),

    // A2 — criado, editado e movido (MOVE)
    version('A2', 'Rack A2', T0, T1, 'SP1'),
    version('A2', 'Rack A2 v2', T1, T2, 'SP1'),
    version('A2', 'Rack A2 v3', T2, null, 'SP2'),

    // A3 — criado e deletado (antes: CREATE; correto: DELETE)
    version('A3', 'Sensor A3', T0, T1, 'SP1'),

    // Z1 — 1 versão corrente, nunca alterado (antes: omitido; correto: CREATE)
    version('Z1', 'Sensor Z1', T0, null, 'SP1'),

    // Z2 — criado e editado, mesmo espaço (antes: CREATE; correto: UPDATE)
    version('Z2', 'Sensor Z2', T0, T1, 'SP1'),
    version('Z2', 'Sensor Z2 v2', T1, null, 'SP1'),

    // B1/B2 — dois cadastros simultâneos = clonagem
    version('B1', 'Tomada B1', T4, null, 'SP1'),
    version('B2', 'Tomada B2', T4, null, 'SP1'),
  ];
}

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

async function getToken() {
  return generateAuthToken({
    userId: 'U1',
    email: 'root@example.com',
    role: 'ADMIN',
    name: 'Root',
  });
}

async function getViewerToken() {
  return generateAuthToken({
    userId: 'U2',
    email: 'viewer@example.com',
    role: 'VIEWER',
    name: 'Viewer',
  });
}

async function GET(token: string) {
  const { res, state } = mockRes();
  const req = {
    method: 'GET',
    cookies: { auth_token: token },
    headers: {},
    query: {},
    socket: {},
  } as unknown as NextApiRequest;

  await revertHandler(req, res);
  return state;
}

async function POST(token: string, body: unknown) {
  const { res, state } = mockRes();
  const req = {
    method: 'POST',
    cookies: { auth_token: token },
    headers: {},
    query: {},
    socket: {},
    body,
  } as unknown as NextApiRequest;

  await revertHandler(req, res);
  return state;
}

describe('GET /api/database/revert — classificação de ação', () => {
  let token: string;

  beforeAll(async () => {
    probe.rows = fixtureRows();
    token = await getToken();
  });

  async function fetchItems() {
    const state = await GET(token);
    expect(state.statusCode).toBe(200);
    return (state.jsonBody as { items: Array<Record<string, unknown>> }).items;
  }

  it('A1: criado e movido → MOVE (não CREATE)', async () => {
    const a1 = (await fetchItems()).find((i) => i.id === 'A1');

    expect(a1).toBeDefined();
    expect(a1!.action).toBe('MOVE');
    expect(a1!.timestamp).toBe(new Date(new Date(T1).getTime() - 1).toISOString());
  });

  it('A2: criado, editado e movido → MOVE', async () => {
    const a2 = (await fetchItems()).find((i) => i.id === 'A2');

    expect(a2!.action).toBe('MOVE');
    expect(a2!.timestamp).toBe(new Date(new Date(T2).getTime() - 1).toISOString());
  });

  it('A3: criado e deletado → DELETE (não CREATE)', async () => {
    const a3 = (await fetchItems()).find((i) => i.id === 'A3');

    expect(a3!.action).toBe('DELETE');
    expect(a3!.timestamp).toBe(new Date(new Date(T1).getTime() - 1).toISOString());
  });

  it('Z1: única versão vigente → CREATE (não é omitido)', async () => {
    const z1 = (await fetchItems()).find((i) => i.id === 'Z1');

    expect(z1).toBeDefined();
    expect(z1!.action).toBe('CREATE');
    expect(z1!.timestamp).toBe(new Date(new Date(T0).getTime() - 1).toISOString());
  });

  it('Z2: criado e editado no mesmo espaço → UPDATE (não CREATE)', async () => {
    const z2 = (await fetchItems()).find((i) => i.id === 'Z2');

    expect(z2!.action).toBe('UPDATE');
    expect(z2!.timestamp).toBe(new Date(new Date(T1).getTime() - 1).toISOString());
  });

  it('nome do registro acompanha o item', async () => {
    const items = await fetchItems();

    expect(items.find((i) => i.id === 'A1')!.name).toBe('Rack A1');
    expect(items.find((i) => i.id === 'Z1')!.name).toBe('Sensor Z1');
  });

  it('item individual sai no formato { table, id, ... } sem groupId', async () => {
    const a1 = (await fetchItems()).find((i) => i.id === 'A1');

    expect(a1!.table).toBe('Active');
    expect(a1!.id).toBe('A1');
    expect(a1!.groupId).toBeUndefined();
    expect(a1!.items).toBeUndefined();
  });

  it('B1+B2: cadastros simultâneos viram um único lote CLONE', async () => {
    const clone = (await fetchItems()).find(
      (i) => i.action === 'CLONE'
    ) as { groupId: string; name: string; items: Array<{ id: string }> } | undefined;

    expect(clone).toBeDefined();
    expect(clone!.items.map((i) => i.id).sort()).toEqual(['B1', 'B2']);
    expect(clone!.name).toBe('Clonagem em grupo (2 ativos)');
  });

  it('o groupId é estável entre consultas (a seleção não se perde no poll de 5s)', async () => {
    const first = (await fetchItems()).find((i) => i.action === 'CLONE');
    const second = (await fetchItems()).find((i) => i.action === 'CLONE');

    expect(second!.groupId).toBe(first!.groupId);
  });
});

describe('POST /api/database/revert — servidor é a autoridade do timestamp', () => {
  let token: string;

  beforeAll(async () => {
    token = await getToken();
  });

  it('HISTORY: timestamp derivado do GET é aceito e reverte pelo instante derivado', async () => {
    probe.rows = fixtureRows();
    const derived = new Date(new Date(T1).getTime() - 1).toISOString();

    const state = await POST(token, {
      items: [{ table: 'Active', id: 'A1', timestamp: derived }],
      mode: 'HISTORY',
    });

    expect(state.statusCode).toBe(200);
    const body = state.jsonBody as { results: Array<{ action: string }> };
    expect(body.results[0].action).toBe('UPDATE');
  });

  it('HISTORY: timestamp defasado (lista desatualizada) → 409', async () => {
    probe.rows = fixtureRows();
    const stale = new Date(new Date(T0).getTime() - 1).toISOString();

    const state = await POST(token, {
      items: [{ table: 'Active', id: 'A1', timestamp: stale }],
      mode: 'HISTORY',
    });

    expect(state.statusCode).toBe(409);
    expect((state.jsonBody as { error: string }).error).toContain('histórico mudou');
  });

  it('QUICK: timestamp do move.ts dentro da janela é aceito', async () => {
    const t0 = new Date(Date.now() - 2000).toISOString();
    const t1 = new Date(Date.now() - 1000).toISOString();
    probe.rows = [
      version('Q1', 'Rack Q', t0, t1, 'SP1'),
      version('Q1', 'Rack Q', t1, null, 'SP2'),
    ];

    const state = await POST(token, {
      table: 'Active',
      id: 'Q1',
      timestamp: t1,
      mode: 'QUICK',
    });

    expect(state.statusCode).toBe(200);
    const body = state.jsonBody as { results: Array<{ action: string }> };
    expect(body.results[0].action).toBe('UPDATE');
  });

  it('QUICK: janela de 10 s expirada → 410 (comportamento preservado)', async () => {
    probe.rows = fixtureRows();
    const expired = new Date(Date.now() - 12000).toISOString();

    const state = await POST(token, {
      table: 'Active',
      id: 'A1',
      timestamp: expired,
      mode: 'QUICK',
    });

    expect(state.statusCode).toBe(410);
  });
});

describe('POST/GET /api/database/revert — MariaDB sem system versioning (4124)', () => {
  let token: string;

  beforeAll(async () => {
    probe.rows = fixtureRows();
    token = await getToken();
  });

  afterEach(() => {
    probe.error = null;
  });

  /** Reproduz o `PrismaClientKnownRequestError` que o driver emite de verdade. */
  function notSystemVersioned(table: string) {
    const dbMessage = `Table \`${table}\` is not system-versioned`;

    return Object.assign(
      new Error(`Raw query failed. Code: \`4124\`. Message: \`${dbMessage}\``),
      {
        code: 'P2010',
        name: 'PrismaClientKnownRequestError',
        meta: { code: '4124', message: dbMessage },
      }
    );
  }

  it('GET: tabela sem system versioning → 503 com o nome da tabela e o comando', async () => {
    probe.error = notSystemVersioned('Active');

    const state = await GET(token);

    expect(state.statusCode).toBe(503);

    const { error } = state.jsonBody as { error: string };
    expect(error).toContain('Active');
    expect(error).toContain('scripts/garantir-system-versioning.ts');
  });

  it('POST: mesma falha de infraestrutura também vira 503', async () => {
    probe.error = notSystemVersioned('FatherSpace');

    const state = await POST(token, {
      table: 'Active',
      id: 'A1',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      mode: 'QUICK',
    });

    expect(state.statusCode).toBe(503);

    const { error } = state.jsonBody as { error: string };
    expect(error).toContain('FatherSpace');
    expect(error).toContain('scripts/garantir-system-versioning.ts');
  });

  it('o 503 nomeia a tabela mas não vaza código Prisma, stack ou mensagem crua do driver', async () => {
    probe.error = notSystemVersioned('Category');

    const state = await POST(token, {
      table: 'Active',
      id: 'A1',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      mode: 'QUICK',
    });

    expect(state.statusCode).toBe(503);

    const body = state.jsonBody as { error: string; details?: string };
    expect(body.error).toContain('Category');
    expect(body.error).not.toContain('P2010');
    expect(body.error).not.toContain('4124');
    expect(body.error).not.toContain('at ');
    expect(body.error).not.toContain('.ts:');
    expect(body.details).toBeUndefined();
    expect(Object.keys(body)).toEqual(['error']);
  });

  it('4124 sem nome de tabela → 503 que fala em "uma ou mais tabelas"', async () => {
    probe.error = new Error('Raw query failed. Code: `4124`. Message: `erro genérico`');

    const state = await GET(token);

    expect(state.statusCode).toBe(503);

    const { error } = state.jsonBody as { error: string };
    expect(error).toContain('Uma ou mais tabelas');
    expect(error).toContain('scripts/garantir-system-versioning.ts');
  });

  it('o 503 não passa a engolir os 401/403/409: os sentinels seguem traduzidos', async () => {
    probe.rows = fixtureRows();
    probe.error = null;

    // 409 — lista defasada continua 409 (o sentinel não pode virar 503).
    const stale = new Date(new Date(T0).getTime() - 1).toISOString();
    const conflict = await POST(token, {
      items: [{ table: 'Active', id: 'A1', timestamp: stale }],
      mode: 'HISTORY',
    });
    expect(conflict.statusCode).toBe(409);

    // 403 — VIEWER continua barrado antes de tocar o banco.
    const viewer = await getViewerToken();
    const forbidden = await GET(viewer);
    expect(forbidden.statusCode).toBe(403);

    // 401 — sem cookie continua 401.
    const { res, state } = mockRes();
    await revertHandler(
      { method: 'GET', cookies: {}, headers: {}, query: {}, socket: {} } as unknown as NextApiRequest,
      res
    );
    expect(state.statusCode).toBe(401);
  });
});
