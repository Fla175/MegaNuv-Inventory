# .planning/stages/03-list-section-space-detail/PLAN.md

Tarefas em ordem de dependência. Cada tarefa tem o que muda, critério de aceitação e a verificação concreta.

## T1 — Endpoint de detalhes do espaço-pai

**O que muda:** criar `pages/api/father-spaces/[id].ts` (GET) que busca um `FatherSpace` pelo id no banco e retorna seus campos completos (`id`, `name`, `notes`, `address`, `responsible`, `phone`, `imageUrl`, `createdBy`, `parent`, `children`, `createdAt`, `updatedAt`).

**Critério de aceitação:**
- Responde `200` com JSON do espaço quando o id existe.
- Responde `404` quando o id não existe.
- Requer autenticação (sessão); retorna `401` sem sessão.

**Verificação:** teste de API em `__tests__/api/father-spaces-detail.test.ts` (reutilizar `__tests__/helpers/http.ts`), cobrindo espaço existente, espaço inexistente e ausência de sessão.

## T2 — Type de retorno do detalhe

**O que muda:** adicionar type `SpaceDetail` em `types/inventory.ts` (não é extensão de `FatherSpace`, é um tipo separado para o payload do endpoint `[id]`), ou tipar a chamada do frontend com os campos necessários.

**Critério de aceitação:** TypeScript aceita o uso dos campos `address`, `responsible`, `phone`, `imageUrl` no frontend sem `any`.

**Verificação:** `npx tsc --noEmit` passa.

## T3 — InventorySpaces: clique no corpo e ícone de expansão

**O que muda:** `InventorySpaces` recebe dois novos props: `onSpaceClick(space: FatherSpace)` e `onSpaceToggleExpand(id: string)`. Cada card renderiza:
- clique no nome/corpo do espaço → `onSpaceClick(space)`;
- ícone de chevron/seta ao lado do nome → `onSpaceToggleExpand(space.id)` (toggle de `expandedNodes`).

**Critério de aceitação:** clicar no corpo do card chama `onSpaceClick` com o espaço correto; clicar no ícone chama `onSpaceToggleExpand` com o id correto e não chama `onSpaceClick`.

**Verificação:** `yarn lint` + `npx tsc --noEmit` passam; revisão estática do JSX.

## T4 — ListSection: estado `selectedSpace` e handlers

**O que muda:** em `ListSection.tsx`:
- adicionar estado `selectedSpace` (esp aço-pai selecionado para o modal), espelhando `selectedViewItem`;
- adicionar `handleSpaceClick(space)` que busca os detalhes via `fetch('/api/father-spaces/${id}')` e seta `selectedSpace`;
- adicionar `handleSpaceToggleExpand(id)` que toggle `expandedNodes[id]` via `setExpandedNodes`;
- adicionar `useEscapeKey(() => setSelectedSpace(null), !!selectedSpace)`;
- passar `onSpaceClick`, `onSpaceToggleExpand` e `selectedSpace` para `InventorySpaces`;
- renderizar `<SpaceDetailModal>` quando `selectedSpace` estiver preenchido.

**Critério de aceitação:** clicar no espaço-pai chama a API e preenche `selectedSpace`; `Esc` fecha; o ícone expande/colapsa os ativos daquele espaço.

**Verificação:** `yarn lint` + `npx tsc --noEmit` passam; revisão estática do fluxo.

## T5 — Componente `SpaceDetailModal` (somente leitura)

**O que muda:** criar `components/list/SpaceDetailModal.tsx` com props `{ isOpen, onClose, space, onEdit }`. Renderiza:
- foto do espaço (ou placeholder se não houver `imageUrl`);
- nome, endereço, responsável, telefone;
- botão de edição visível apenas quando `user.role` é `DIRECTOR` ou `ADMIN` (recebido via prop `user` ou deduzido do contexto), que chama `onEdit(space)`.

**Critério de aceitação:** modal somente leitura; botão de edição aparece/condiz com o papel; campos vazios não quebram o layout.

**Verificação:** `yarn lint` + `npx tsc --noEmit` passam; sem `jsdom`, a verificação é estática + teste manual na tela.

## T6 — Wiring na página index

**O que mudar:** em `pages/index.tsx` (ou onde `ListSection` é instanciada), passar `onEditSpace` para `ListSection` que navega para `/settings` (ou abre o modal de edição de espaço existente) quando acionado.

**Critério de aceitação:** clicar em "Editar" dentro do `SpaceDetailModal` (DIRECTOR/ADMIN) leva ao fluxo de edição de espaço sem erro.

**Verificação:** `yarn build:opt` passa; teste manual.

## T7 — Testes e gates finais

**O que muda:** adicionar o teste do endpoint (T1) e garantir que nenhum teste existente quebre.

**Critério de aceitação:**
- `yarn test` verde (incluindo o novo teste de API).
- `yarn lint` → 0/0.
- `npx tsc --noEmit` → 0 erros.
- `yarn build:opt` → build standalone bem-sucedido.

**Verificação:** executar os cinco gates.
