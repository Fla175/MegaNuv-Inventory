# PR — ADR-004: detalhe do espaço-pai e colapso no ListSection

## Título sugerido

`feat(inventory): add father-space detail modal and collapse control`

## Resumo

Os espaços-pai da página index passam a ser interativos: clicar no nome/corpo abre um modal
somente-leitura com foto, endereço, responsável e telefone; o ícone de chevron ao lado do nome
expande/colapsa os ativos do espaço. VIEWER continua sem poder editar — o botão "Editar espaço"
só aparece para DIRECTOR/ADMIN e leva ao modal de edição existente em `/settings`.

## Arquivos alterados

### Back-end

| Arquivo | Mudança |
|---|---|
| `pages/api/father-spaces/[id].ts` | **novo** — `GET` autenticado que devolve o espaço completo (`address`, `responsible`, `phone`, `imageUrl`, `createdBy`, `parent`); `401` sem sessão, `400` sem id, `404` inexistente, `405` fora de GET |
| `types/inventory.ts` | **novo type** `SpaceDetail` (payload do endpoint, separado de `FatherSpace`) |
| `SPECS.md` | contrato do endpoint e regra de acesso na tabela de APIs |

### Front-end

| Arquivo | Mudança |
|---|---|
| `components/list/SpaceDetailModal.tsx` | **novo** — modal read-only espelhando `ItemDetailModal`; foto com fallback, endereço/responsável/telefone/notas; botão de edição condicionado a `canEdit` |
| `components/list/InventorySpaces.tsx` | cabeçalho clicável abre o modal (ignorado em modo de seleção); chevron expande/colapsa o corpo; estado vazio também abre o modal; `onContextMenu` permanece no cabeçalho com o corpo recolhido |
| `components/ListSection.tsx` | estado `selectedSpace`, `handleSpaceClick` (fetch do detalhe), `handleSpaceToggleExpand`, `useEscapeKey` e render do `SpaceDetailModal` |
| `lib/types.ts` | `ListSectionProps` recebe `canEditSpace` e `onEditSpace` |
| `pages/index.tsx` | calcula `canEditSpace` por papel e navega para `/settings?tab=spaces&spaceId=<id>` |
| `pages/settings.tsx` | deep-link abre o modal de edição do espaço correspondente e limpa o parâmetro |
| `lib/inventory/filter.ts` | helpers puros `isSpaceExpanded` / `toggleSpaceExpansion` (espaço-pai expandido por padrão) |

### Testes

| Arquivo | Cobertura |
|---|---|
| `__tests__/api/father-spaces-detail.test.ts` | **novo** — 7 casos: 200 para VIEWER, 404, 401, 400, 405, 500 e shape do `findUnique` |
| `__tests__/lib/inventory-filter.test.ts` | +4 casos: default expandido, colapso explícito, primeiro clique colapsa, imutabilidade |

### Documentação / planejamento

| Arquivo | Mudança |
|---|---|
| `ADR/ADR-004.md` | **novo** — ADR da decisão (opções, trade-off, consequências) |
| `.planning/stages/03-list-section-space-detail/SPEC.md` | **novo** — requisitos falsificáveis R1–R7 |
| `.planning/stages/03-list-section-space-detail/PLAN.md` | **novo** — T1–T7 |
| `.planning/stages/03-list-section-space-detail/NOTES.md` | **novo** — decisões, restrições e verificação |
| `.planning/stages/03-list-section-space-detail/PR.md` | **novo** — este documento |
| `.planning/STATE.md` | etapa `03-list-section-space-detail` |
| `CHANGELOG.md` | `OpenCode Operations (11)` |

## Como testar

1. `yarn lint` → 0 erros / 0 avisos.
2. `npx tsc --noEmit` → 0 erros.
3. `yarn test` → **382 passed + 5 skipped**.
4. `yarn build:opt` → build standalone bem-sucedido.
5. Manual:
   - clicar no nome/corpo de um espaço-pai e conferir foto, endereço, responsável e telefone;
   - fechar com `X` e com `Esc`;
   - clicar no chevron e confirmar que só os ativos daquele espaço somem/aparecem;
   - com o espaço colapsado, clicar com o botão direito no cabeçalho e confirmar que o menu de
     contexto do espaço continua abrindo;
   - entrar em modo de seleção e confirmar que clicar no cabeçalho não abre o modal por cima da
     árvore;
   - entrar como VIEWER: modal abre sem "Editar espaço";
   - entrar como DIRECTOR/ADMIN: "Editar espaço" abre o modal de edição já preenchido em `/settings`.

## Observações para o commit

- Branch de trabalho: `refactor/modularize-ui` (sem push).
- **Não** stage `components/dashboard/RecentList.tsx`: ele aparece modificado no working tree por
  edição concorrente e não faz parte da ADR-004.
- Sugestão de staging explícito:

```bash
git add \
  ADR/ADR-004.md \
  SPECS.md \
  CHANGELOG.md \
  .planning/STATE.md \
  .planning/stages/03-list-section-space-detail \
  pages/api/father-spaces/\[id\].ts \
  types/inventory.ts \
  components/list/SpaceDetailModal.tsx \
  components/list/InventorySpaces.tsx \
  components/ListSection.tsx \
  lib/types.ts \
  lib/inventory/filter.ts \
  pages/index.tsx \
  pages/settings.tsx \
  __tests__/api/father-spaces-detail.test.ts \
  __tests__/lib/inventory-filter.test.ts
```
