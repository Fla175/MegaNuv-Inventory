import { describe, it, expect, beforeAll } from 'vitest';
import { generateAuthToken, verifyAuthToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';

describe('lib/auth - generateAuthToken & verifyAuthToken', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890';
  });

  it('generates a token with default 8h expiration', async () => {
    const payload = {
      userId: 'user-1',
      email: 'user1@example.com',
      role: UserRole.ADMIN,
      name: 'User One',
    };

    const token = await generateAuthToken(payload);
    expect(token).toBeTypeOf('string');

    const decoded = await verifyAuthToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
    expect(decoded?.exp! - decoded?.iat!).toBe(8 * 3600);
  });

  it('generates a token with custom expiresIn options (e.g. 2h)', async () => {
    const payload = {
      userId: 'user-2',
      email: 'user2@example.com',
      role: UserRole.DIRECTOR,
      name: 'User Two',
    };

    const token = await generateAuthToken(payload, { expiresIn: '2h' });
    const decoded = await verifyAuthToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.exp! - decoded?.iat!).toBe(2 * 3600);
  });

  it('returns null for an invalid token', async () => {
    const decoded = await verifyAuthToken('invalid-token-string');
    expect(decoded).toBeNull();
  });
});
