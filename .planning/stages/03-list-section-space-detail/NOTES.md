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

## Revisão interna (gate `commit-hygiene` + `review-evidence` + `mesh-check`)

### Code smells (fowler-smells.md / fowler_code_smells_manifest.md) — revisão estática

- `ListSection.tsx` (355 L) → **long_method** (linha do componente com múltiplos handlers, estados,
  modais, contexto de menu e efeito de expansão — excede 20-30 linhas lógicas). Não corrigido: está
  fora do escopo mínimo da ADR-004 (`refactor-safely` aplicaria se fosse uma refatoração de UI).
- `components/list/InventorySpaces.tsx` (148 L → +60 L após a alteração) → **large_class** (card
  com cabeçalho, modal, árvore, contexto, clique, teclado, expansão — múltiplas responsabilidades).
- `components/settings/SpaceModal.tsx` (119 L) + `components/settings/SpaceDetailModal.tsx` (175 L) →
  **duplicate_code** parcial (formato de `InfoItem`, estrutura do modal, `toLocalMediaUrl`) — não
  unificado porque os propósitos são diferentes (edição × visualização), mas há duplicação de layout.
- `pages/api/father-spaces/` (`list`, `update`, `create`, `delete`, `[id]`) → **data_clumps** (os
  mesmos campos `name`, `notes`, `address`, `imageUrl`, `responsible`, `phone` aparecem nos payloads
  sem encapsulamento; `SpaceDetail` é uma tentativa de encapsular, mas ainda é um container).
- Nenhum **dead_code**, **lazy_class**, **feature_envy**, **message_chains** ou **switch_statements**
  introduzido nesta alteração.

### Segurança / privacidade de rotas (middleware.ts + endpoints)

- `middleware.ts:89-96`: o matcher protege `/api/*` com token JWT; `authMiddleware` (não usado no
  endpoint novo) existe mas não é obrigatório no `[id].ts`. O endpoint usa `getSessionUser` (helper
  único) — conforme `SPECS.md` §4.2. Nenhuma rota pública nova exposta; `GET /api/father-spaces/[id]`
  está sob `middleware` (token obrigatório) e retorna 401 sem cookie.
- Nenhum segredo no diff (`git diff --cached --check` limpo; `grep -iE` sem hits).

### Arquivo externo — `components/dashboard/RecentList.tsx`

- A alteração no arquivo (não-staged) quebrou o layout (`flex-col` + `ml-auto` no span de tag);
  o arquivo **não** faz parte desta tarefa e não deve ser commitado junto. Confirmado pelo usuário
  (resposta: "revisar"). Registrei no `CHANGELOG.md` e `NOTES.md`; o commit `dbb87e9` não o inclui.

## Design corrigido (grilling + arquitetura) — registrado após revisão do usuário

- **Toggle:** o `map-pin` (já existente) é o único trigger de expandir/colapsar. Nenhum `ChevronDown`
  adicional (removido do arquivo final).
- **Hitbox:** o card inteiro abre o `SpaceDetailModal` (`onClick` no container do card); apenas o
  `map-pin` faz toggle.
- **ContextMenu:** bloqueado para father-space (`onContextMenu` no cabeçalho faz apenas
  `preventDefault`). A trava original da arquitetura é preservada: contexto só para ativos
  (`ActiveTree`). O modal substitui ações de espaço para o pai.
- **Selection mode:** o clique no card é desativado (`isSelectionMode` guarda `tabIndex=-1` e não
  chama `openDetails`).
- `RecentList.tsx`: o arquivo concorrente (não-staged) foi confirmado pelo usuário como correção
  própria (`flex-col` + `bottom-span` intencional). Não incluído no commit desta ADR.

## Status da release

- `npm version` ainda não executado — `package-lock.json` não existe; a versão atual é `2.25.2`
  (`package.json`, `lib/version.ts`, branch `inventory-v2.25.2`). O bump para `minor`/`patch` exige
  ordem explícita do usuário.
- `gh auth` não autenticado; `push`, `tag -a`, `gh release create`, merge `main` e PR das
  mini-branches (`inventory-v2.0.0`, `fix/actives-*`, `chore/security-p0-debt`, etc.) estão
  **pendentes de autorização Tier 3**.
- A ordem pedida pelo usuário (`npm version` → PR mini-branches → merge `main` → release) está
  registrada no `CHANGELOG.md` e `NOTES.md`, mas **não executada**.

## Atenção para o commit

O working tree contém `components/dashboard/RecentList.tsx` alterado **fora desta tarefa**
(edição concorrente). Não stage esse arquivo; ele não faz parte da ADR-004. Se precisar corrigir
antes do PR, faça em um commit separado (`fix(dashboard): restore RecentList layout`) ou em
branch própria.
