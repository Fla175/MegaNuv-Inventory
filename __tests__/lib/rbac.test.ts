import { describe, it, expect } from 'vitest';
import {
  assignableRoles,
  canActOnUser,
  canAssignRole,
  canClearLogs,
  canManageSpaces,
  canReadLogs,
  isUserRole,
} from '@/lib/rbac';

/**
 * Política RBAC da ADR-002 — matriz de `SPECS.md` §4.2.
 *
 * A regra vive em um módulo puro justamente para poder ser testada sem handler:
 * cada endpoint abaixo dele (espaços, usuários, logs) delega a decisão para cá.
 */

describe('isUserRole', () => {
  it.each(['VIEWER', 'MANAGER', 'ADMIN', 'DIRECTOR'] as const)('aceita %s', (role) => {
    expect(isUserRole(role)).toBe(true);
  });

  it.each([undefined, null, '', 'SUPERADMIN', 1, {}])('rejeita %s', (value) => {
    expect(isUserRole(value)).toBe(false);
  });
});

describe('canManageSpaces — DIRECTOR e ADMIN', () => {
  it.each(['DIRECTOR', 'ADMIN'] as const)('%s gerencia espaços', (role) => {
    expect(canManageSpaces({ role })).toBe(true);
  });

  it.each(['MANAGER', 'VIEWER'] as const)('%s não gerencia espaços', (role) => {
    expect(canManageSpaces({ role })).toBe(false);
  });

  it('sem sessão não gerencia espaços', () => {
    expect(canManageSpaces(null)).toBe(false);
    expect(canManageSpaces(undefined)).toBe(false);
  });
});

describe('canReadLogs / canClearLogs', () => {
  it.each(['DIRECTOR', 'ADMIN', 'MANAGER'] as const)('%s lê logs', (role) => {
    expect(canReadLogs({ role })).toBe(true);
  });

  it('VIEWER não lê logs', () => {
    expect(canReadLogs({ role: 'VIEWER' })).toBe(false);
    expect(canReadLogs(null)).toBe(false);
  });

  it.each(['DIRECTOR', 'ADMIN'] as const)('%s apaga logs', (role) => {
    expect(canClearLogs({ role })).toBe(true);
  });

  it.each(['MANAGER', 'VIEWER'] as const)('%s não apaga logs', (role) => {
    expect(canClearLogs({ role })).toBe(false);
  });
});

describe('canActOnUser — o papel ATUAL do alvo decide', () => {
  it.each(['VIEWER', 'MANAGER', 'ADMIN', 'DIRECTOR'] as const)(
    'DIRECTOR age sobre %s',
    (targetRole) => {
      expect(canActOnUser({ role: 'DIRECTOR' }, targetRole)).toBe(true);
    }
  );

  it.each(['VIEWER', 'MANAGER', 'ADMIN'] as const)('ADMIN age sobre %s', (targetRole) => {
    expect(canActOnUser({ role: 'ADMIN' }, targetRole)).toBe(true);
  });

  it('ADMIN não age sobre DIRECTOR', () => {
    expect(canActOnUser({ role: 'ADMIN' }, 'DIRECTOR')).toBe(false);
  });

  it('MANAGER age somente sobre VIEWER', () => {
    expect(canActOnUser({ role: 'MANAGER' }, 'VIEWER')).toBe(true);
    expect(canActOnUser({ role: 'MANAGER' }, 'MANAGER')).toBe(false);
    expect(canActOnUser({ role: 'MANAGER' }, 'ADMIN')).toBe(false);
    expect(canActOnUser({ role: 'MANAGER' }, 'DIRECTOR')).toBe(false);
  });

  it('VIEWER não age sobre ninguém', () => {
    expect(canActOnUser({ role: 'VIEWER' }, 'VIEWER')).toBe(false);
  });
});

describe('assignableRoles', () => {
  it('DIRECTOR e ADMIN atribuem VIEWER, MANAGER e ADMIN — nunca DIRECTOR', () => {
    expect(assignableRoles({ role: 'DIRECTOR' })).toEqual(['VIEWER', 'MANAGER', 'ADMIN']);
    expect(assignableRoles({ role: 'ADMIN' })).toEqual(['VIEWER', 'MANAGER', 'ADMIN']);
  });

  it('MANAGER atribui somente VIEWER', () => {
    expect(assignableRoles({ role: 'MANAGER' })).toEqual(['VIEWER']);
  });

  it('VIEWER e ausência de sessão não atribuem nada', () => {
    expect(assignableRoles({ role: 'VIEWER' })).toEqual([]);
    expect(assignableRoles(null)).toEqual([]);
  });
});

describe('canAssignRole — criação e troca de papel', () => {
  it('criador ADMIN semeia o primeiro DIRECTOR', () => {
    expect(
      canAssignRole({ role: 'ADMIN', isCreator: true }, 'DIRECTOR', { directorExists: false })
    ).toBe(true);
  });

  it('criador não cria um segundo DIRECTOR', () => {
    expect(
      canAssignRole({ role: 'ADMIN', isCreator: true }, 'DIRECTOR', { directorExists: true })
    ).toBe(false);
  });

  it('ADMIN comum não cria DIRECTOR', () => {
    expect(
      canAssignRole({ role: 'ADMIN', isCreator: false }, 'DIRECTOR', { directorExists: false })
    ).toBe(false);
  });

  it('DIRECTOR não cria outro DIRECTOR — é singleton', () => {
    expect(
      canAssignRole({ role: 'DIRECTOR' }, 'DIRECTOR', { directorExists: false })
    ).toBe(false);
  });

  it('ADMIN promove alguém a ADMIN', () => {
    expect(
      canAssignRole({ role: 'ADMIN' }, 'ADMIN', { directorExists: false })
    ).toBe(true);
  });

  it('MANAGER só atribui VIEWER', () => {
    expect(
      canAssignRole({ role: 'MANAGER' }, 'VIEWER', { directorExists: false })
    ).toBe(true);
    expect(
      canAssignRole({ role: 'MANAGER' }, 'MANAGER', { directorExists: false })
    ).toBe(false);
  });

  it('VIEWER não atribui papel', () => {
    expect(
      canAssignRole({ role: 'VIEWER' }, 'VIEWER', { directorExists: false })
    ).toBe(false);
  });
});
