// __tests__/helpers/http.ts
//
// Shared request/response doubles for API handler tests.
//
// Before this helper, every test file declared its own `makeReq`/`makeRes` with
// `any` in the signatures and `as any` at the call site — 149 lint errors that
// `next lint` never saw because it only scans `pages|components|lib|src`. The
// cast now lives here, once, and the tests consume typed `NextApiRequest` /
// `NextApiResponse` shapes (ADR-001, stage 3.5).

import type { NextApiRequest, NextApiResponse } from "next";
import { vi, type Mock } from "vitest";

/** Mocks returned by {@link makeRes}; kept as `Mock` so tests can assert calls. */
export interface MockResponse {
  status: Mock;
  json: Mock;
  end: Mock;
  setHeader: Mock;
}

/**
 * Casts a typed function (e.g. `prisma.user.findUnique`) to an untyped mock.
 * The tests feed partial fixtures on purpose — casting here keeps the `any`
 * out of the test bodies and the fixture shape visible at the call site.
 */
export function asMock(fn: unknown): Mock {
  return fn as unknown as Mock;
}

/**
 * Builds the subset of `NextApiRequest` the handlers read: `method`, `cookies`,
 * `headers`, `body`, `query` and `socket.remoteAddress` (used by `createLog`).
 * Anything the test needs beyond that goes through `overrides`.
 */
export function makeReq(overrides: Record<string, unknown> = {}): NextApiRequest {
  return {
    method: "GET",
    cookies: {},
    headers: {},
    body: {},
    query: {},
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides,
  } as unknown as NextApiRequest;
}

/**
 * Response double whose `status()` returns an object exposing `json()`, which
 * covers `res.status(code).json(body)` and plain `res.json(body)`.
 */
export function makeRes(): MockResponse & NextApiResponse {
  const json = vi.fn();
  const status = vi.fn();
  status.mockReturnValue({ json });

  return {
    status,
    json,
    end: vi.fn(),
    setHeader: vi.fn(),
  } as unknown as MockResponse & NextApiResponse;
}
