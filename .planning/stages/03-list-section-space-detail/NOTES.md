# NOTES — 03-list-section-space-detail (ADR-004)

## Objetivo

Permitir interagir com o espaço-pai na página index: clique no nome/corpo abre um modal
somente-leitura com foto, endereço, responsável e telefone; o ícone de chevron ao lado do nome
expande/colapsa os ativos daquele espaço.

## Decisões (fechadas na rodada de grilling e registradas na ADR-004)

- Dados vêm de `GET /api/father-spaces/[id]`; o type `FatherSpace` **não** foi ampliado.
- `SpaceDetailModal` é dedicado e read-only; `SpaceModal` de settings não foi reutilizado.
- Clique no corpo/nome = modal; chevron = expandir/colapsar.
- VIEWER vê o modal sem o botão de edição; DIRECTOR/ADMIN veem o botão.

## Notas de implementação

- `expandedNodes` já era usado pela árvore de ativos com semântica "ausente = colapsado". Para o
  espaço-pai a semântica é o oposto ("ausente = expandido", preservando o comportamento anterior).
  Por isso a lógica foi isolada em `isSpaceExpanded`/`toggleSpaceExpansion`
  (`lib/inventory/filter.ts`): o primeiro clique precisa gravar `false`; `!expandedNodes[id]`
  gravaria `true` e nada mudaria na tela.
- O cabeçalho do card é a área clicável; o corpo com ativos **não** recebe `onClick`, porque os
  cliques das linhas de ativo borbulham e abririam dois modais. O estado vazio ("Nenhum ativo neste
  local") também abre o modal.
- O `onContextMenu` do espaço também foi ligado ao cabeçalho: com o corpo recolhido, o menu de
  contexto (editar/mover/clonar/excluir do espaço) continuaria inacessível se ficasse só no corpo.
  Em modo de seleção o cabeçalho vira `aria-disabled`/`tabIndex=-1` e não abre o detalhe, para não
  cobrir a árvore no meio da seleção.
- O modal não fecha sozinho ao clicar em "Editar espaço" (decisão da ADR). A página decide o
  destino; em `pages/index.tsx` o destino é
  `/settings?tab=spaces&spaceId=<id>`.
- `pages/settings.tsx` consome o `spaceId` quando a lista de espaços carrega, chama
  `openEditSpace` uma vez e limpa o parâmetro com `router.replace(..., { shallow: true })` para o
  modal não reabrir depois de um refresh. A ação é ignorada se o usuário não tem `canManageAll`.
- O endpoint segue o envelope `{ error }` dos vizinhos de `father-spaces/**` e usa
  `getSessionUser`, não `authMiddleware`.

## Restrições / becos sem saída

- `vitest` roda em `environment: 'node'`, sem `jsdom`/`@testing-library`. A UI foi verificada por
  revisão estática e teste manual; a parte pura (expansão) e o endpoint têm testes reais.
- Não foi criado teste de componente para o modal: adicionar `jsdom` mudaria a infraestrutura de
  testes do projeto e está fora do escopo desta correção.
- Não foi possível usar o `SpaceModal` de settings como visualização: ele é um formulário de
  edição e misturaria responsabilidades.

## Verificação

- `yarn lint` → 0 erros / 0 avisos
- `npx tsc --noEmit` → 0 erros
- `yarn test` → **382 passed + 5 skipped** (11 testes novos)
- `yarn build:opt` → resultado no `PR.md` / seção de gates do `CHANGELOG.md`
- Teste manual pendente do dono: abrir o card, recolher/expandir, conferir VIEWER × DIRECTOR/ADMIN.

## Atenção para o commit

O working tree pode conter `components/dashboard/RecentList.tsx` alterado **fora desta tarefa**
(edição concorrente). Não stage esse arquivo; ele não faz parte da ADR-004.
