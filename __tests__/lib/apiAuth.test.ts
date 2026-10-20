import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeReq } from '../helpers/http';

const verifyAuthToken = vi.fn(async (token: string) =>
  token === 'token-valido' ? { userId: 'u1', email: 'a@x.com', role: 'ADMIN' } : null
);

vi.mock('@/lib/auth', () => ({
  verifyAuthToken: (token: string) => verifyAuthToken(token),
  AuthTokenPayload: {},
}));

const { getSessionToken, getSessionUser, isViewer, isPrivileged } = await import('@/lib/apiAuth');

describe('getSessionToken', () => {
  it('lê o cookie auth_token', () => {
    expect(getSessionToken(makeReq({ cookies: { auth_token: 'abc' } }))).toBe('abc');
  });

  it('lê o header Authorization: Bearer', () => {
    expect(getSessionToken(makeReq({ headers: { authorization: 'Bearer abc' } }))).toBe('abc');
  });

  it('aceita o esquema Bearer sem diferenciar maiúsculas', () => {
    expect(getSessionToken(makeReq({ headers: { authorization: 'bearer abc' } }))).toBe('abc');
    expect(getSessionToken(makeReq({ headers: { authorization: 'BEARER abc' } }))).toBe('abc');
  });

  it('tolera espaços extras após o esquema', () => {
    expect(getSessionToken(makeReq({ headers: { authorization: 'Bearer    abc  ' } }))).toBe('abc');
  });

  it('ignora header sem o esquema Bearer (o replace() antigo não validava)', () => {
    expect(getSessionToken(makeReq({ headers: { authorization: 'Basic abc' } }))).toBeNull();
    expect(getSessionToken(makeReq({ headers: { authorization: 'abc' } }))).toBeNull();
  });

  it('ignora header Bearer sem token', () => {
    expect(getSessionToken(makeReq({ headers: { authorization: 'Bearer ' } }))).toBeNull();
  });

  it('prefere o header sobre o cookie', () => {
    const req = makeReq({ headers: { authorization: 'Bearer do-header' }, cookies: { auth_token: 'do-cookie' } });
    expect(getSessionToken(req)).toBe('do-header');
  });

  it('cai no cookie quando não há header', () => {
    const req = makeReq({ headers: {}, cookies: { auth_token: 'do-cookie' } });
    expect(getSessionToken(req)).toBe('do-cookie');
  });

  it('devolve null sem cookie e sem header', () => {
    expect(getSessionToken(makeReq())).toBeNull();
  });

  it('ignora cookie vazio', () => {
    expect(getSessionToken(makeReq({ cookies: { auth_token: '' } }))).toBeNull();
  });

  it('não quebra quando req.cookies é indefinido', () => {
    expect(getSessionToken(makeReq({ cookies: undefined }))).toBeNull();
  });
});

describe('getSessionUser', () => {
  beforeEach(() => verifyAuthToken.mockClear());

  it('devolve o payload quando o token é válido', async () => {
    const user = await getSessionUser(makeReq({ cookies: { auth_token: 'token-valido' } }));
    expect(user).toMatchObject({ userId: 'u1', role: 'ADMIN' });
  });

  it('devolve null para token inválido, sem lançar', async () => {
    await expect(getSessionUser(makeReq({ cookies: { auth_token: 'invalido' } }))).resolves.toBeNull();
  });

  it('devolve null quando não há token, sem chamar o verificador', async () => {
    await expect(getSessionUser(makeReq())).resolves.toBeNull();
    expect(verifyAuthToken).not.toHaveBeenCalled();
  });
});

describe('isViewer / isPrivileged', () => {
  it('isViewer identifica apenas VIEWER', () => {
    expect(isViewer({ role: 'VIEWER' })).toBe(true);
    expect(isViewer({ role: 'ADMIN' })).toBe(false);
    expect(isViewer(null)).toBe(false);
    expect(isViewer(undefined)).toBe(false);
  });

  it('isPrivileged cobre DIRECTOR e ADMIN', () => {
    expect(isPrivileged({ role: 'DIRECTOR' })).toBe(true);
    expect(isPrivileged({ role: 'ADMIN' })).toBe(true);
    expect(isPrivileged({ role: 'MANAGER' })).toBe(false);
    expect(isPrivileged({ role: 'VIEWER' })).toBe(false);
  });
});
describe('regressão: token presente porém inválido não autentica (SPECS.md §5.1)', () => {
  // Antes da consolidação, `pages/api/{actives,categories,father-spaces}/list.ts`
  // só checavam se o token existia (`if (!token)`) e nunca o verificavam: um
  // header `Authorization: Bearer qualquercoisa` devolvia o inventário inteiro.
  // O handler não pode assumir que o middleware rodou, então a verificação tem
  // de acontecer aqui também.
  it('getSessionUser devolve null para token lixo, mesmo com header preenchido', async () => {
    const req = makeReq({ headers: { authorization: 'Bearer qualquercoisa' } });
    await expect(getSessionUser(req)).resolves.toBeNull();
  });

  it('getSessionUser devolve null para cookie lixo', async () => {
    const req = makeReq({ cookies: { auth_token: 'lixo' } });
    await expect(getSessionUser(req)).resolves.toBeNull();
  });

  it('a verificação realmente acontece (o mock foi chamado com o token)', async () => {
    verifyAuthToken.mockClear();
    await getSessionUser(makeReq({ cookies: { auth_token: 'lixo' } }));
    expect(verifyAuthToken).toHaveBeenCalledWith('lixo');
  });
});
