// lib/spaceTree.ts
//
// Módulo PURO da hierarquia de `FatherSpace`. Sem Prisma, sem Next: recebe as
// linhas `{ id, parentId }` e devolve conjuntos determinísticos, para poder ser
// testado sem banco (`SPECS.md` §5.1).
//
// Existe porque a exclusão de espaço é uma **cascata** (`SPECS.md` §4.1:
// "Exclusão de FatherSpace ou Active pai faz cascade em toda a subárvore.
// Endpoint de delete deve avisar sobre o tamanho da subárvore."). O endpoint
// anterior apagava apenas os ativos com `fatherSpaceId = id` e confiava no
// cascade do banco para os espaços filhos — cujos ativos ficavam órfãos da
// contagem e, por Restrict em `Active.fatherSpace`, podiam abortar o DELETE com
// um 500 genérico. Premiar o tamanho da subárvore sem calcular a mesma
// subárvore que o delete percorre seria aviso decorativo; por isso a coleta
// mora aqui, e tanto o aviso (`GET`) quanto a exclusão (`DELETE`) usam esta
// função.

export interface SpaceNode {
  id: string;
  parentId?: string | null;
}

/**
 * IDs do espaço raiz e de todos os seus descendentes, em largura (raiz
 * primeiro). Nunca repete um ID e nunca entra em laço — um `parentId` cíclico
 * vindo de dado legado não pode travar a rota de exclusão.
 */
export function collectSpaceSubtreeIds(
  spaces: readonly SpaceNode[],
  rootId: string
): string[] {
  const childrenByParent = new Map<string, string[]>();

  for (const space of spaces) {
    if (!space.parentId) continue;
    const siblings = childrenByParent.get(space.parentId);
    if (siblings) {
      siblings.push(space.id);
    } else {
      childrenByParent.set(space.parentId, [space.id]);
    }
  }

  const subtree: string[] = [];
  const visited = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (visited.has(id)) continue;
    visited.add(id);
    subtree.push(id);
    const children = childrenByParent.get(id);
    if (children) queue.push(...children);
  }

  return subtree;
}
