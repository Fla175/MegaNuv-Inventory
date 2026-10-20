import { describe, it, expect } from 'vitest';
import {
  countDescendants,
  filterOptions,
  getAllDescendantIds,
  getDirectChildren,
  getOptionKind,
  getRootOptions,
  type SearchableSelectOption,
} from '@/lib/searchableSelect';

/**
 * Semântica compartilhada do `SearchableSelect` — Etapa 2 da ADR-001 (2.2).
 *
 * Antes da extração, a árvore de locais existia em duas cópias
 * (`components/ListSection.tsx` e `components/actives/activeForm.tsx`) e as
 * cópias divergiram: o `ListSection` tratava `type === "default"` como espaço
 * na cor e no hover (mas escondia o selo de tipo); o formulário nem conhecia o
 * valor — `grep '"default"' activeForm.tsx` retornava 0. `"default"` é o
 * **sentinela** "Manter no espaço original de cada um" do diálogo de clonagem:
 * não é um local, e agora é classificado como tal em um único lugar.
 */

const option = (
  id: string,
  name: string,
  type?: SearchableSelectOption['type'],
  parentId?: string | null
): SearchableSelectOption => ({ id, name, type, parentId });

describe('getOptionKind — reconciliação do "default"', () => {
  it('classifica espaço pai e espaço físico', () => {
    expect(getOptionKind({ type: 'space' })).toBe('space');
    expect(getOptionKind({ type: 'active' })).toBe('active');
  });

  it('classifica `default` como sentinela, não como espaço', () => {
    // O comportamento antigo do ListSection o tratava como espaço (cor azul).
    expect(getOptionKind({ type: 'default' })).toBe('sentinel');
    expect(getOptionKind({ type: 'default' })).not.toBe('space');
  });

  it('tipo ausente cai na apresentação neutra de espaço (nunca uma quarta cor)', () => {
    expect(getOptionKind({})).toBe('space');
  });
});

describe('árvore de opções', () => {
  const options: SearchableSelectOption[] = [
    option('root', 'Sede', 'space', null),
    option('child', 'Almoxarifado', 'space', 'root'),
    option('grandchild', 'Prateleira 1', 'active', 'child'),
    option('sibling', 'Filial', 'space', null),
    option('sentinel', 'Manter no espaço original', 'default', null),
  ];

  it('getRootOptions devolve só os nós sem pai', () => {
    expect(getRootOptions(options).map((o) => o.id)).toEqual([
      'root',
      'sibling',
      'sentinel',
    ]);
  });

  it('getDirectChildren devolve só os filhos diretos', () => {
    expect(getDirectChildren(options, 'root').map((o) => o.id)).toEqual([
      'child',
    ]);
    expect(getDirectChildren(options, 'child').map((o) => o.id)).toEqual([
      'grandchild',
    ]);
    expect(getDirectChildren(options, 'grandchild')).toEqual([]);
  });

  it('getAllDescendantIds cobre a subárvore inteira, inclusive netos', () => {
    const descendants = getAllDescendantIds(options, 'root').sort();
    expect(descendants).toEqual(['child', 'grandchild']);
  });

  it('countDescendants conta netos (o selo numérico antigo só contava filhos diretos)', () => {
    expect(countDescendants(options, 'root')).toBe(2);
    expect(countDescendants(options, 'child')).toBe(1);
    expect(countDescendants(options, 'sibling')).toBe(0);
  });

  it('não entra em laço com hierarquia cíclica (dado legado corrompido)', () => {
    const cyclic: SearchableSelectOption[] = [
      option('a', 'A', 'space', 'b'),
      option('b', 'B', 'space', 'a'),
    ];
    expect(getAllDescendantIds(cyclic, 'a').sort()).toEqual(['a', 'b']);
  });

  it('não conta o próprio nó', () => {
    expect(getAllDescendantIds(options, 'root')).not.toContain('root');
  });
});

describe('filterOptions', () => {
  const options = [
    option('1', 'Almoxarifado Central', 'space'),
    option('2', 'Prateleira', 'active'),
    option('3', 'almoxarifado Norte', 'space'),
  ];

  it('busca por substring sem diferenciar maiúsculas', () => {
    expect(filterOptions(options, 'ALMOX').map((o) => o.id)).toEqual(['1', '3']);
  });

  it('termo vazio ou só espaços não filtra a lista inteira', () => {
    expect(filterOptions(options, '')).toEqual([]);
    expect(filterOptions(options, '   ')).toEqual([]);
  });

  it('termo sem correspondência devolve lista vazia', () => {
    expect(filterOptions(options, 'inexistente')).toEqual([]);
  });
});
