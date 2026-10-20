// lib/searchableSelect.ts
//
// Módulo PURO da semântica do seletor de locais. Sem React, sem I/O: funções
// determinísticas sobre a lista de opções, testáveis sem DOM (`SPECS.md` §5.1).
//
// Existe porque a mesma árvore de locais era resolvida em DUAS cópias — em
// `components/ListSection.tsx` e em `components/actives/activeForm.tsx` — e as
// cópias divergiram. A divergência não era cosmética: `"default"` é um
// **sentinela** (a opção "Manter no espaço original de cada um", do diálogo de
// clonagem), não um local. A versão do `ListSection` o tratava como espaço na
// cor e no hover, mas escondia o selo de tipo; a do formulário nem conhecia o
// valor (zero ocorrências de `"default"`). Duas telas com o mesmo componente
// aparente e regras diferentes. A regra agora tem um dono só neste módulo, e o
// componente (`components/ui/SearchableSelect.tsx`) apenas a desenha.

/** Natureza de uma opção de local. `default` é um sentinela, não um local. */
export type SelectOptionType = 'space' | 'active' | 'default';

export interface SearchableSelectOption {
  id: string;
  name: string;
  type?: SelectOptionType;
  parentId?: string | null;
}

/**
 * Categoria visual/semântica da opção.
 *
 * - `space`    — Espaço Pai (FatherSpace).
 * - `active`   — Espaço Físico (Active com `isPhysicalSpace`).
 * - `sentinel` — opção de controle (ex.: "Manter no espaço original"), que não
 *               representa local nenhum: nunca exibe selo de tipo nem o rótulo
 *               "Espaço Pai"/"Espaço Físico", porque ambos seriam mentira.
 */
export type OptionKind = 'space' | 'active' | 'sentinel';

/**
 * Resolve a categoria da opção. Tipo ausente ou desconhecido cai em `space`,
 * que é a apresentação neutra herdada do seletor original — a UI nunca recebe
 * uma quarta cor.
 */
export function getOptionKind(
  option: Pick<SearchableSelectOption, 'type'>
): OptionKind {
  if (option.type === 'default') return 'sentinel';
  if (option.type === 'active') return 'active';
  return 'space';
}

/** Opções de topo (sem pai) — a raiz da árvore exibida. */
export function getRootOptions(
  options: readonly SearchableSelectOption[]
): SearchableSelectOption[] {
  return options.filter((option) => !option.parentId);
}

/** Filhos diretos de um nó. */
export function getDirectChildren(
  options: readonly SearchableSelectOption[],
  parentId: string
): SearchableSelectOption[] {
  return options.filter((option) => option.parentId === parentId);
}

/**
 * IDs de todos os descendentes de um nó, em pré-ordem.
 *
 * Usa um mapa `pai → filhos` montado uma vez — a versão anterior refiltrava a
 * lista inteira a cada nível, o que é O(n²) por nó aberto. O `visited` impede
 * laço infinito num grafo corrompido (dado legado com ciclo): um seletor que
 * trava a tela é pior que um seletor que omite um nó.
 */
export function getAllDescendantIds(
  options: readonly SearchableSelectOption[],
  parentId: string
): string[] {
  const childrenByParent = new Map<string, string[]>();

  for (const option of options) {
    if (!option.parentId) continue;
    const siblings = childrenByParent.get(option.parentId);
    if (siblings) {
      siblings.push(option.id);
    } else {
      childrenByParent.set(option.parentId, [option.id]);
    }
  }

  const descendants: string[] = [];
  const visited = new Set<string>();
  const stack = [...(childrenByParent.get(parentId) ?? [])];

  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (visited.has(id)) continue;
    visited.add(id);
    descendants.push(id);
    const children = childrenByParent.get(id);
    if (children) stack.push(...children);
  }

  return descendants;
}

/** Quantidade de descendentes — o selo numérico exibido ao lado do nó. */
export function countDescendants(
  options: readonly SearchableSelectOption[],
  parentId: string
): number {
  return getAllDescendantIds(options, parentId).length;
}

/**
 * Filtro da busca: substring case-insensitive sobre `name`.
 *
 * `trim()` evita que um espaço digitado por engano mostre "nenhum local
 * encontrado" com a lista inteira escondida atrás de um termo em branco.
 */
export function filterOptions(
  options: readonly SearchableSelectOption[],
  term: string
): SearchableSelectOption[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  return options.filter((option) => option.name.toLowerCase().includes(needle));
}
