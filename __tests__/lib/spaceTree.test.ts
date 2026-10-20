import { describe, it, expect } from 'vitest';
import { collectSpaceSubtreeIds, type SpaceNode } from '@/lib/spaceTree';

/**
 * Subárvore de `FatherSpace` — Etapa 2 da ADR-001 (2.5).
 *
 * A exclusão de espaço é cascata (`SPECS.md` §4.1). O endpoint anterior
 * apagava só os ativos com `fatherSpaceId = id` e confiava no cascade do banco
 * para os espaços filhos — cujos ativos não entravam na contagem. A mesma
 * função agora alimenta a prévia (`GET`) e a exclusão (`DELETE`): o aviso não
 * pode divergir do que será apagado.
 */

const node = (id: string, parentId?: string | null): SpaceNode => ({
  id,
  parentId,
});

describe('collectSpaceSubtreeIds', () => {
  it('inclui a raiz e todos os descendentes, sem os irmãos', () => {
    const spaces = [
      node('root'),
      node('child-a', 'root'),
      node('grandchild', 'child-a'),
      node('child-b', 'root'),
      node('unrelated'),
      node('unrelated-child', 'unrelated'),
    ];

    expect(collectSpaceSubtreeIds(spaces, 'root').sort()).toEqual([
      'child-a',
      'child-b',
      'grandchild',
      'root',
    ]);
  });

  it('devolve apenas a raiz quando não há filhos', () => {
    expect(collectSpaceSubtreeIds([node('root')], 'root')).toEqual(['root']);
  });

  it('não repete IDs e não trava com hierarquia cíclica', () => {
    const cyclic = [node('a', 'b'), node('b', 'a')];
    const subtree = collectSpaceSubtreeIds(cyclic, 'a');

    expect(subtree.sort()).toEqual(['a', 'b']);
    expect(new Set(subtree).size).toBe(subtree.length);
  });

  it('a raiz vem primeiro (contrato da prévia e da exclusão)', () => {
    const spaces = [node('root'), node('child', 'root')];
    expect(collectSpaceSubtreeIds(spaces, 'root')[0]).toBe('root');
  });
});
