import { describe, it, expect } from 'vitest';
import {
  BATCH_WINDOW_MS,
  batchActivities,
  toSubItems,
  type PlannedItem,
} from '@/lib/revert/batch';

const T = (offsetSeconds: number) =>
  new Date(Date.UTC(2026, 9, 1, 12, 0, 0) + offsetSeconds * 1000).toISOString();

function planned(
  id: string,
  action: PlannedItem['action'],
  timestamp: string,
  name = `Item ${id}`
): PlannedItem {
  return { table: 'Active', id, name, action, timestamp };
}

describe('lib/revert/batch - janela deslizante', () => {
  it('mantém um lote de criações espaçadas em um único grupo (janela ancora no mais antigo)', () => {
    // Antes: a âncora era o item mais recente, então {5.0, 3.1} formavam grupo
    // e {1.2} caía sozinho, mesmo com passos de 1.9 s entre vizinhos.
    const items = [planned('A', 'CREATE', T(5.0)), planned('B', 'CREATE', T(3.1)), planned('C', 'CREATE', T(1.2))];

    const activities = batchActivities(items);

    expect(activities).toHaveLength(1);
    expect(activities[0].items.map((i) => i.id)).toEqual(['A', 'B', 'C']);
  });

  it('abre um novo grupo quando a distância ao mais antigo do lote excede a janela', () => {
    const activities = batchActivities([
      planned('A', 'CREATE', T(5.0)),
      planned('B', 'CREATE', T(3.1)),
      planned('C', 'CREATE', T(1.0)),
    ]);

    expect(activities).toHaveLength(2);
    expect(activities[0].items.map((i) => i.id)).toEqual(['A', 'B']);
    expect(activities[1].items.map((i) => i.id)).toEqual(['C']);
  });

  it('aceita exatamente na janela e recusa logo acima', () => {
    const inclusive = batchActivities([planned('A', 'MOVE', T(4)), planned('B', 'MOVE', T(2))]);
    expect(inclusive).toHaveLength(1);

    const exclusive = batchActivities([planned('A', 'MOVE', T(4)), planned('B', 'MOVE', T(1.999))]);
    expect(exclusive).toHaveLength(2);

    expect(BATCH_WINDOW_MS).toBe(2000);
  });

  it('nunca mistura ações diferentes, mesmo no mesmo instante', () => {
    const activities = batchActivities([
      planned('A', 'MOVE', T(0)),
      planned('B', 'DELETE', T(0)),
      planned('C', 'MOVE', T(0)),
    ]);

    expect(activities).toHaveLength(2);
    expect(activities.find((a) => a.action === 'MOVE')!.items.map((i) => i.id)).toEqual(['A', 'C']);
    expect(activities.find((a) => a.action === 'DELETE')!.items.map((i) => i.id)).toEqual(['B']);
  });

  it('uma ação vizinha não se infiltra em lote de outra ação', () => {
    const activities = batchActivities([
      planned('A', 'CREATE', T(5)),
      planned('B', 'MOVE', T(4.9)),
      planned('C', 'CREATE', T(4.8)),
    ]);

    expect(activities).toHaveLength(2);
    const clone = activities.find((a) => a.action === 'CLONE')!;
    expect(clone.items.map((i) => i.id)).toEqual(['A', 'C']);
    expect(activities.find((a) => a.action === 'MOVE')!.items.map((i) => i.id)).toEqual(['B']);
  });

  it('ordena a saída do mais recente ao mais antigo, com o timestamp do item mais novo', () => {
    const activities = batchActivities([
      planned('C', 'UPDATE', T(7.5)),
      planned('A', 'UPDATE', T(9)),
      planned('B', 'UPDATE', T(8.5)),
    ]);

    expect(activities).toHaveLength(1);
    expect(activities[0].timestamp).toBe(T(9));
    expect(activities[0].items.map((i) => i.id)).toEqual(['A', 'B', 'C']);
  });

  it('é determinístico: mesma entrada, mesmo groupId (a seleção não perde a cada poll)', () => {
    const items = [planned('A', 'MOVE', T(5)), planned('B', 'MOVE', T(4))];

    const first = batchActivities(items);
    const second = batchActivities([...items].reverse());

    expect(second[0].groupId).toBe(first[0].groupId);
    expect(first[0].groupId).toMatch(/^batch-move-\d+$/);
    expect(first[0].groupId).not.toContain('random');
  });
});

describe('lib/revert/batch - inferência de CLONE e rótulos', () => {
  it('mais de uma criação simultânea vira CLONE (o banco não marca a origem)', () => {
    const activities = batchActivities([
      planned('A', 'CREATE', T(5)),
      planned('B', 'CREATE', T(4.5)),
      planned('C', 'CREATE', T(4.2)),
    ]);

    expect(activities).toHaveLength(1);
    expect(activities[0].action).toBe('CLONE');
    expect(activities[0].name).toBe('Clonagem em grupo (3 ativos)');
  });

  it('uma criação isolada continua sendo CREATE, com o nome do registro', () => {
    const activities = batchActivities([planned('A', 'CREATE', T(5), 'Sensor 1')]);

    expect(activities[0].action).toBe('CREATE');
    expect(activities[0].name).toBe('Sensor 1');
  });

  it('uma movimentação isolada usa o nome do registro (não um rótulo de lote)', () => {
    const activities = batchActivities([planned('A', 'MOVE', T(5), 'Rack A')]);

    expect(activities[0].action).toBe('MOVE');
    expect(activities[0].name).toBe('Rack A');
  });

  it('um lote de movimentações usa o rótulo de lote com a contagem', () => {
    const activities = batchActivities([
      planned('A', 'MOVE', T(5)),
      planned('B', 'MOVE', T(4.5)),
      planned('C', 'MOVE', T(4.4)),
      planned('D', 'MOVE', T(4.3)),
    ]);

    expect(activities[0].action).toBe('MOVE');
    expect(activities[0].name).toBe('Movimentação em grupo (4 ativos)');
  });

  it('um lote de deleções usa o rótulo de lote', () => {
    const activities = batchActivities([
      planned('A', 'DELETE', T(5)),
      planned('B', 'DELETE', T(4.9)),
    ]);

    expect(activities[0].name).toBe('Deleção em grupo (2 ativos)');
  });

  it('não converte um lote de edições em clonagem', () => {
    const activities = batchActivities([
      planned('A', 'UPDATE', T(5)),
      planned('B', 'UPDATE', T(4.9)),
    ]);

    expect(activities[0].action).toBe('UPDATE');
    expect(activities[0].name).toBe('Edição em grupo (2 ativos)');
  });
});

describe('lib/revert/batch - toSubItems', () => {
  it('reduz um lote ao formato que o POST consome', () => {
    const [activity] = batchActivities([
      planned('A', 'MOVE', T(5)),
      planned('B', 'MOVE', T(4.9)),
    ]);

    expect(toSubItems(activity)).toEqual([
      { table: 'Active', id: 'A', timestamp: T(5) },
      { table: 'Active', id: 'B', timestamp: T(4.9) },
    ]);
  });
});
