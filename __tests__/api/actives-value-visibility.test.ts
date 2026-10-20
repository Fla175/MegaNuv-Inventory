import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq, makeRes } from '../helpers/http';
import type { AuthTokenPayload } from '@/lib/auth';

/**
 * Visibilidade e preservação de `fixedValue` — Etapa 1 da ADR-001.
 *
 * Regra de produto (decisão de 18/10/2026): ADMIN, MANAGER e DIRECTOR veem e
 * editam o valor; somente VIEWER não vê. O card de patrimônio total do
 * dashboard é a exceção e permanece restrito (`dashboard/stats.ts`).
 *
 * Regressões cobertas aqui — os três pontos onde o dado sensível escapava ou
 * era destruído:
 *
 * 1.1 `GET /api/actives/list` devolvia todos os escalares para qualquer papel
 *     autenticado: o gate de coluna da UI escondia o valor, mas o JSON
 *     continuava entregando o patrimônio a qualquer cookie de VIEWER.
 * 1.2 `PUT /api/actives/update` parseava `fixedValue` com `|| 0`
 *     incondicionalmente: "campo ausente" era tratado como "zerar" e um
 *     salvamento sem o campo destruía o patrimônio em silêncio — a classe de
 *     perda que a redação do 1.1 criaria se vivesse sozinha.
 * 1.3/1.4 `GET /api/qrcode/public-get` espalhava `...rootActive` sem gate, e a
 *     soma do "Valor Total" rodava no cliente somando `sec.fixedValue`, que a
 *     resposta jamais carregou — o card reportava só o valor da raiz.
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
    update: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  default: dbMock,
  prisma: dbMock,
}));

// `public-get` fala com o MinIO para pré-assinar mídia; os fixtures das
// imagens/anexos são `null`, então o cliente nunca deve ser chamado.
const presignedGetObject = vi.fn(async () => 'https://signed.example/presigned');

vi.mock('@/lib/minio', () => ({
  minioPublicClient: { presignedGetObject },
  BUCKET_NAME: 'inventory-test',
}));

const authedReq = (overrides: Record<string, unknown> = {}) =>
  makeReq({ cookies: { auth_token: 'token-valido' }, ...overrides });

describe('canViewValue (regra pura — lib/apiAuth)', () => {
  it.each(['ADMIN', 'MANAGER', 'DIRECTOR'] as const)('%s pode ver o valor', async (role) => {
    setRole(role);
    const { canViewValue } = await import('@/lib/apiAuth');
    expect(canViewValue({ role })).toBe(true);
  });

  it('VIEWER não pode ver o valor', async () => {
    const { canViewValue } = await import('@/lib/apiAuth');
    expect(canViewValue({ role: 'VIEWER' })).toBe(false);
  });

  it('sessão ausente ou sem papel não vê (falha fechado)', async () => {
    const { canViewValue } = await import('@/lib/apiAuth');
    expect(canViewValue(null)).toBe(false);
    expect(canViewValue(undefined)).toBe(false);
    expect(canViewValue({} as Pick<AuthTokenPayload, 'role'>)).toBe(false);
  });
});

describe('GET /api/actives/list — 1.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.active.findMany.mockResolvedValue([
      { id: 'a1', name: 'Impressora', fixedValue: 800, notes: 'nota', _count: { children: 2 } },
    ]);
  });

  it('VIEWER recebe o payload sem a chave `fixedValue` — e com o restante intacto', async () => {
    setRole('VIEWER');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/actives/list');

    await handler(authedReq(), res);

    const payload = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(200);
    // O campo não vai como `undefined`: precisa estar ausente do objeto inteiro.
    expect('fixedValue' in payload[0]).toBe(false);
    expect(payload[0].name).toBe('Impressora');
    expect(payload[0].notes).toBe('nota');
    expect(payload[0].childrenCount).toBe(2);
  });

  it.each(['ADMIN', 'MANAGER', 'DIRECTOR'])('%s segue recebendo `fixedValue`', async (role) => {
    setRole(role);
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/actives/list');

    await handler(authedReq(), res);

    const payload = res.json.mock.calls[0][0];
    expect(payload[0]).toHaveProperty('fixedValue', 800);
  });
});

describe('PUT /api/actives/update — 1.2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // O valor original existe: é exatamente ele que não pode ser destruído.
    dbMock.active.findUnique.mockResolvedValue({
      id: 'a1',
      name: 'Impressora',
      fixedValue: 1250,
      sku: null,
      manufacturer: null,
      model: null,
      fatherSpaceId: '0000',
      parentId: null,
      isPhysicalSpace: false,
      tag: 'IN-STOCK',
      notes: null,
      imageUrl: null,
      fileUrl: null,
      serialNumber: null,
    });
    dbMock.active.update.mockResolvedValue({ id: 'a1' });
    dbMock.active.updateMany.mockResolvedValue({ count: 0 });
  });

  // Regressão obrigatória da ADR-001 §1: um MANAGER que abre, salva e reabre
  // um ativo com fixedValue = 1250 continua vendo 1250.
  it('MANAGER salva sem `fixedValue` no corpo e o valor original é preservado', async () => {
    setRole('MANAGER');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/actives/update');

    await handler(authedReq({ method: 'PUT', body: { id: 'a1', name: 'Renomeada' } }), res);

    const args = dbMock.active.update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(args.data.fixedValue).toBe(1250);
  });

  it('um `0` explícito no corpo segue zerando (ausente ≠ zerado)', async () => {
    setRole('MANAGER');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/actives/update');

    await handler(authedReq({ method: 'PUT', body: { id: 'a1', name: 'Zerada', fixedValue: 0 } }), res);

    const args = dbMock.active.update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(args.data.fixedValue).toBe(0);
  });

  it('valor novo explícito é aplicado', async () => {
    setRole('MANAGER');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/actives/update');

    await handler(authedReq({ method: 'PUT', body: { id: 'a1', name: 'Reprecificada', fixedValue: 990 } }), res);

    const args = dbMock.active.update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(args.data.fixedValue).toBe(990);
  });

  it('`applyToSimilar` com campo ausente não propaga o valor (ele não mudou)', async () => {
    setRole('MANAGER');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/actives/update');

    await handler(
      authedReq({ method: 'PUT', body: { id: 'a1', name: 'Renomeada', applyToSimilar: true } }),
      res
    );

    const args = dbMock.active.updateMany.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(args.data).not.toHaveProperty('fixedValue');
    expect(args.data).toHaveProperty('name', 'Renomeada');
  });
});

describe('GET /api/qrcode/public-get — 1.3 e 1.4', () => {
  // Árvore com dois níveis, para provar que a soma cobre espaços aninhados:
  //   A (raiz, 100)
  //   ├── B "Prateleira 1" (espaço, 50)
  //   │   └── D "Serra" (ativo, 25)
  //   └── C "Caixa A" (ativo, 200)
  interface QrNode {
    id: string;
    name: string;
    isPhysicalSpace: boolean;
    fixedValue: number;
    imageUrl: null;
    fileUrl: null;
    notes: null;
    createdBy: { name: string };
    category: { name: string };
  }

  const nodes: Record<string, QrNode> = {
    A: { id: 'A', name: 'Depósito', isPhysicalSpace: true, fixedValue: 100, imageUrl: null, fileUrl: null, notes: null, createdBy: { name: 'R' }, category: { name: 'C' } },
    B: { id: 'B', name: 'Prateleira 1', isPhysicalSpace: true, fixedValue: 50, imageUrl: null, fileUrl: null, notes: null, createdBy: { name: 'R' }, category: { name: 'C' } },
    C: { id: 'C', name: 'Caixa A', isPhysicalSpace: false, fixedValue: 200, imageUrl: null, fileUrl: null, notes: null, createdBy: { name: 'R' }, category: { name: 'C' } },
    D: { id: 'D', name: 'Serra', isPhysicalSpace: false, fixedValue: 25, imageUrl: null, fileUrl: null, notes: null, createdBy: { name: 'R' }, category: { name: 'C' } },
  };

  const treeChildren: Record<string, QrNode[]> = {
    A: [nodes.B, nodes.C],
    B: [nodes.D],
    C: [],
    D: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.active.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => {
      const node = nodes[where.id];
      if (!node) return null;
        return { ...node, children: treeChildren[where.id] ?? [] };
      }
    );
  });

  it('responde 401 sem sessão (o handler continua sendo a barreira)', async () => {
    setRole('VIEWER');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/qrcode/public-get');

    await handler(makeReq({ cookies: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('VIEWER: nenhum `fixedValue` na raiz nem nos ativos; `totalValue` = 0', async () => {
    setRole('VIEWER');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/qrcode/public-get');

    await handler(authedReq({ query: { id: 'A' } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];

    expect('fixedValue' in payload.root).toBe(false);
    for (const section of payload.sections) {
      for (const item of section.actives) {
        expect('fixedValue' in item).toBe(false);
      }
    }
    expect(payload.totalValue).toBe(0);
  });

  it('DIRECTOR: raiz e ativos com `fixedValue` e soma correta da subárvore aninhada', async () => {
    setRole('DIRECTOR');
    const res = makeRes();
    const { default: handler } = await import('@/pages/api/qrcode/public-get');

    await handler(authedReq({ query: { id: 'A' } }), res);

    type QrPayload = {
      root: { fixedValue?: number };
      sections: Array<{ actives: Array<{ id: string; fixedValue?: number }> }>;
      totalValue: number;
    };
    const payload = res.json.mock.calls[0][0] as QrPayload;
    // 100 (raiz) + 50 (B) + 200 (C) + 25 (D, dentro do espaço aninhado) = 375.
    expect(payload.root.fixedValue).toBe(100);
    const flat = payload.sections.flatMap((s) => s.actives);
    expect(flat.find((a) => a.id === 'B')?.fixedValue).toBe(50);
    expect(flat.find((a) => a.id === 'C')?.fixedValue).toBe(200);
    expect(flat.find((a) => a.id === 'D')?.fixedValue).toBe(25);
    expect(payload.totalValue).toBe(375);
  });
});
