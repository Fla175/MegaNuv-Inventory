import { describe, it, expect } from 'vitest';
import {
  TIMESTAMP_MAX,
  isCurrentVersion,
  isAllowedTable,
  sortVersionsDesc,
  planRevert,
  REVERTABLE_TABLES,
  type VersionRow,
} from '@/lib/revert/history';

/** Valor de `ROW_END` que o MariaDB grava para a versão corrente. */
const OPEN = '2038-01-19 03:14:07.999999';

interface VersionInput {
  start: string;
  /** Omitido = versão corrente (`ROW_END` aberto). */
  end?: string;
  name?: string;
  fatherSpaceId?: string;
  parentId?: string;
}

function version(input: VersionInput): VersionRow {
  return {
    ROW_START: input.start,
    ROW_END: input.end ?? OPEN,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.fatherSpaceId !== undefined ? { fatherSpaceId: input.fatherSpaceId } : {}),
    ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
  };
}

const T0 = '2026-10-01T10:00:00.000Z';
const T1 = '2026-10-01T10:00:02.000Z';
const T2 = '2026-10-01T10:00:05.000Z';
const T3 = '2026-10-01T10:00:09.000Z';

describe('lib/revert/history - primitivas', () => {
  it('TIMESTAMP_MAX preserva o valor byte-idêntico usado pelo handler', () => {
    expect(new Date(OPEN).getTime()).toBe(TIMESTAMP_MAX.getTime());
  });

  it('isCurrentVersion reconhece a versão aberta e rejeita a encerrada', () => {
    expect(isCurrentVersion(version({ start: T0 }))).toBe(true);
    expect(isCurrentVersion(version({ start: T0, end: T1 }))).toBe(false);
  });

  it('isAllowedTable aceita só as três tabelas reversíveis', () => {
    expect(isAllowedTable('Active')).toBe(true);
    expect(isAllowedTable('FatherSpace')).toBe(true);
    expect(isAllowedTable('Category')).toBe(true);
    expect(isAllowedTable('active')).toBe(false);
    expect(isAllowedTable('User')).toBe(false);
  });

  it('sortVersionsDesc ordena do mais recente ao mais antigo sem mutar a entrada', () => {
    const a = version({ start: T0, end: T1 });
    const b = version({ start: T1, end: T2 });
    const input = [a, b];
    const sorted = sortVersionsDesc(input);

    expect(sorted).toEqual([b, a]);
    expect(input[0]).toBe(a);
  });
});

describe('lib/revert/history - planRevert (verdade de campo do revert_probe)', () => {
  it('registro criado e nunca alterado → CREATE (caso Z1, antes omitido)', () => {
    const plan = planRevert('Active', [version({ start: T0, name: 'Sensor 1', fatherSpaceId: 'SP1' })]);

    expect(plan).not.toBeNull();
    expect(plan!.action).toBe('CREATE');
    expect(plan!.name).toBe('Sensor 1');
    expect(plan!.revertAt.getTime()).toBe(new Date(T0).getTime() - 1);
  });

  it('duas versões com localização diferente → MOVE (caso A1, antes rotulado CREATE)', () => {
    const plan = planRevert('Active', [
      version({ start: T1, name: 'Rack A', fatherSpaceId: 'SP2' }),
      version({ start: T0, end: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
    ]);

    expect(plan!.action).toBe('MOVE');
    expect(plan!.revertAt.getTime()).toBe(new Date(T1).getTime() - 1);
  });

  it('duas versões com a mesma localização → UPDATE (caso Z2, antes rotulado CREATE)', () => {
    const plan = planRevert('Active', [
      version({ start: T1, name: 'Rack A v2', fatherSpaceId: 'SP1' }),
      version({ start: T0, end: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
    ]);

    expect(plan!.action).toBe('UPDATE');
    expect(plan!.revertAt.getTime()).toBe(new Date(T1).getTime() - 1);
  });

  it('criado, editado e movido → MOVE, ancorado na versão imediatamente anterior (caso A2)', () => {
    const plan = planRevert('Active', [
      version({ start: T2, name: 'Rack A v3', fatherSpaceId: 'SP2' }),
      version({ start: T1, end: T2, name: 'Rack A v2', fatherSpaceId: 'SP1' }),
      version({ start: T0, end: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
    ]);

    expect(plan!.action).toBe('MOVE');
    expect(plan!.revertAt.getTime()).toBe(new Date(T2).getTime() - 1);
  });

  it('criado, movido e depois editado no destino → UPDATE (a última ação não foi o movimento)', () => {
    const plan = planRevert('Active', [
      version({ start: T2, name: 'Rack A v3', fatherSpaceId: 'SP2' }),
      version({ start: T1, end: T2, name: 'Rack A v2', fatherSpaceId: 'SP2' }),
      version({ start: T0, end: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
    ]);

    expect(plan!.action).toBe('UPDATE');
    expect(plan!.revertAt.getTime()).toBe(new Date(T2).getTime() - 1);
  });

  it('criado e depois deletado → DELETE (caso A3, antes rotulado CREATE)', () => {
    const plan = planRevert('Active', [
      version({ start: T0, end: T1, name: 'Sensor 9', fatherSpaceId: 'SP1' }),
    ]);

    expect(plan!.action).toBe('DELETE');
    expect(plan!.revertAt.getTime()).toBe(new Date(T1).getTime() - 1);
  });

  it('registro deletado depois de várias versões → DELETE na última versão encerrada', () => {
    const plan = planRevert('Active', [
      version({ start: T2, end: T3, name: 'Rack A v3', fatherSpaceId: 'SP2' }),
      version({ start: T1, end: T2, name: 'Rack A v2', fatherSpaceId: 'SP1' }),
      version({ start: T0, end: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
    ]);

    expect(plan!.action).toBe('DELETE');
    expect(plan!.revertAt.getTime()).toBe(new Date(T3).getTime() - 1);
  });

  it('histórico vazio → null (nada a reverter)', () => {
    expect(planRevert('Active', [])).toBeNull();
  });

  it('a ordem de entrada das versões não altera o plano', () => {
    const versions = [
      version({ start: T2, name: 'Rack A v3', fatherSpaceId: 'SP2' }),
      version({ start: T0, end: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
      version({ start: T1, end: T2, name: 'Rack A v2', fatherSpaceId: 'SP1' }),
    ];

    const ordered = planRevert('Active', versions);
    const shuffled = planRevert('Active', [versions[2], versions[0], versions[1]]);

    expect(shuffled).toEqual(ordered);
    expect(ordered!.action).toBe('MOVE');
  });

  it('Category não tem localização: com anterior → sempre UPDATE', () => {
    const plan = planRevert('Category', [
      version({ start: T1, name: 'Elétrica' }),
      version({ start: T0, end: T1, name: 'Eletrica' }),
    ]);

    expect(plan!.action).toBe('UPDATE');
    expect(plan!.name).toBe('Elétrica');
  });

  it('FatherSpace usa parentId como localização', () => {
    const plan = planRevert('FatherSpace', [
      version({ start: T1, name: 'Sala 2', parentId: 'ROOT' }),
      version({ start: T0, end: T1, name: 'Sala 2', parentId: 'SALA1' }),
    ]);

    expect(plan!.action).toBe('MOVE');
    expect(REVERTABLE_TABLES.FatherSpace.locatorColumn).toBe('parentId');
  });

  it('usa a coluna de localização declarada — nunca parentId em Active', () => {
    // `parentId` muda, mas `fatherSpaceId` não: para Active isso é edição, não movimento.
    const plan = planRevert('Active', [
      version({ start: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
      version({ start: T0, end: T1, name: 'Rack A', fatherSpaceId: 'SP1' }),
    ]);

    expect(plan!.action).toBe('UPDATE');
    expect(REVERTABLE_TABLES.Active.locatorColumn).toBe('fatherSpaceId');
  });

  it('cai para o id quando a coluna de nome está ausente', () => {
    const plan = planRevert('Active', [{ ROW_START: T0, ROW_END: OPEN, id: 'A1' } as VersionRow]);

    expect(plan!.name).toBe('A1');
  });
});
