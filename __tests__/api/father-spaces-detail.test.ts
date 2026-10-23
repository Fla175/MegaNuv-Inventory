// __tests__/api/father-spaces-detail.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeReq, makeRes } from "../helpers/http";

/**
 * `GET /api/father-spaces/[id]` — ADR-004.
 *
 * The detail modal needs address, responsible, phone and image, none of which
 * the list type exposes. The endpoint is read-only but authenticated: VIEWER
 * may read it, an anonymous request may not.
 */

let currentRole = "VIEWER";

vi.mock("@/lib/auth", () => ({
  verifyAuthToken: vi.fn(async (token: string) => {
    if (!token) return null;
    return {
      userId: "u1",
      email: "viewer@x.com",
      role: currentRole,
      name: "Teste",
    };
  }),
  AuthTokenPayload: {},
}));

const dbMock = {
  fatherSpace: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  default: dbMock,
  prisma: dbMock,
}));

type Req = ReturnType<typeof makeReq>;
type Res = ReturnType<typeof makeRes>;

const authedReq = (overrides: Record<string, unknown> = {}) =>
  makeReq({
    cookies: { auth_token: "token-valido" },
    query: { id: "A1B2" },
    ...overrides,
  });

async function callHandler(req: Req, res: Res) {
  const { default: handler } = await import("@/pages/api/father-spaces/[id]");
  await handler(req, res);
}

const spaceFixture = {
  id: "A1B2",
  name: "Sede",
  notes: "Prédio principal",
  address: "Rua das Flores, 100",
  imageUrl: "http://minio/inventory/spaces/sede.png",
  phone: "(11) 99999-0000",
  responsible: "Maria Souza",
  createdById: "u1",
  parentId: null,
  createdAt: new Date("2026-10-01T12:00:00.000Z"),
  updatedAt: new Date("2026-10-02T12:00:00.000Z"),
  createdBy: { id: "u1", name: "Teste", role: "VIEWER" },
  parent: null,
};

describe("GET /api/father-spaces/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRole = "VIEWER";
    dbMock.fatherSpace.findUnique.mockResolvedValue(spaceFixture);
  });

  it("devolve os campos de detalhe para qualquer usuário autenticado", async () => {
    const res = makeRes();

    await callHandler(authedReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(spaceFixture);
    expect(dbMock.fatherSpace.findUnique).toHaveBeenCalledWith({
      where: { id: "A1B2" },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        parent: { select: { id: true, name: true } },
      },
    });
  });

  it("VIEWER também lê o detalhe (somente leitura)", async () => {
    currentRole = "VIEWER";
    const res = makeRes();

    await callHandler(authedReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("devolve 404 quando o espaço não existe", async () => {
    dbMock.fatherSpace.findUnique.mockResolvedValue(null);
    const res = makeRes();

    await callHandler(authedReq(), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Espaço não encontrado." });
  });

  it("sem sessão devolve 401 sem tocar o banco", async () => {
    const res = makeRes();

    await callHandler(authedReq({ cookies: {} }), res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(dbMock.fatherSpace.findUnique).not.toHaveBeenCalled();
  });

  it("id ausente devolve 400 sem tocar o banco", async () => {
    const res = makeRes();

    await callHandler(authedReq({ query: {} }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(dbMock.fatherSpace.findUnique).not.toHaveBeenCalled();
  });

  it("método não suportado devolve 405 sem tocar o banco", async () => {
    const res = makeRes();

    await callHandler(authedReq({ method: "POST" }), res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(dbMock.fatherSpace.findUnique).not.toHaveBeenCalled();
  });

  it("falha do banco devolve 500 com a mensagem", async () => {
    dbMock.fatherSpace.findUnique.mockRejectedValue(new Error("conexão caiu"));
    const res = makeRes();

    await callHandler(authedReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "conexão caiu" });
  });
});
