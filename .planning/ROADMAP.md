# Roadmap — ADR-003 (modularização + Shadcn UI)

Ordem de execução: dashboard → ListSection → settings.

## A — Preparação e Shadcn UI
**Goal:** Shadcn UI inicializado e validado no projeto; componentes base disponíveis.
**Done when:** `npx shadcn@latest init` (ou `components.json` manual) roda sem erro; `components/ui/` existe; `yarn lint`, `tsc`, `prisma validate`, `test`, `build:opt` passam.
**Depends on:** —

## B — Dashboard (`pages/dashboard.tsx`, 375 L)
**Goal:** `DashboardPage` vira orquestrador fino (<100 linhas); lógica em hooks e componentes por feature.
**Done when:** todos os extras abaixo existem e o componente principal não excede 100 linhas:
- `useDashboardStats()`, `usePagination()`
- `components/dashboard/KPICards.tsx`, `CategoriesGrid.tsx`, `RecentCreations.tsx`, `RecentMovements.tsx`, `StructureSummary.tsx`, `CategoryAssetsModal.tsx`
**Depends on:** A

## C — ListSection (`components/ListSection.tsx`, 2.151 L)
**Goal:** `ListSection` vira orquestrador fino (<200 linhas); árvores, filtros, seleção, modais extraídos.
**Done when:** todos os extras abaixo existem e o componente principal não excede 200 linhas:
- `useInventorySelection()`, `useInventoryFilter()`, `useMoveAction()`, `useUndo()`, `useCloneBatch()`
- `components/list/ActiveTree.tsx`, `MoveTree.tsx`, `ItemDetailModal.tsx`, `PrintLabelModal.tsx`, `MoveModal.tsx`, `CloneBatchModal.tsx`, `ContextMenu.tsx`, `SelectionToolbar.tsx`, `UndoToast.tsx`
**Depends on:** A

## D — Settings (`pages/settings.tsx`, 1.254 L)
**Goal:** `SettingsPage` vira orquestrador fino (<200 linhas); 5 abas e 7 modais extraídos; Zustand para estado global.
**Done when:** todos os extras abaixo existem e o componente principal não excede 200 linhas:
- `useSettingsPermissions()`, `useSettingsData()`, `useRevertHistory()`, `useCreatorAccess()`, `useUserCrud()`
- `components/settings/UsersTab.tsx`, `SpacesTab.tsx`, `CategoriesTab.tsx`, `LogsTab.tsx`, `ThemeTab.tsx`
- `components/settings/UserModal.tsx`, `CategoryModal.tsx`, `SpaceModal.tsx`, `EnterAccountModal.tsx`, `TransferCreatorModal.tsx`
- `ConfirmDialog` substituído por `Dialog`/`AlertDialog` do Shadcn
**Depends on:** A, C (Zustand padrão definido em C)

## E — Validação e documentação
**Goal:** gates verdes, documentos atualizados, commit em branch própria.
**Done when:** `yarn lint`, `tsc`, `prisma validate`, `test`, `build:opt` passam; `SPECS.md` e `CONTEXT.md` refletem a nova estrutura; `CHANGELOG.md` tem a sessão da refatoração; commit em `refactor/modularize-ui` (sem push).
**Depends on:** B, C, D
