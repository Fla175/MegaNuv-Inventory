# Contexto durável — ADR-003 (modularização + Shadcn UI)

Decisões tomadas no grilling (não relitigar a cada stage):

**Estrutura de pastas:** componentes por feature em `components/dashboard/`, `components/settings/`, `components/list/`; `components/ui/` exclusivo dos elementos Shadcn UI.

**Nomeação de hooks:** `use<Domínio><Coisa>` (ex: `useDashboardStats()`, `useSettingsPermissions()`, `useInventorySelection()`).

**Barrel exports:** não criar, exceto se `components/ui/` do Shadcn exigir.

**Shadcn UI:** `npx shadcn@latest init`; configurar `components.json` manualmente se não suportar Tailwind v4 / Pages Router; adicionar componentes sob demanda.

**Migração de componentes existentes:** criar novos com Shadcn; reescrever antigos apenas se houver duplicação funcional (ex: `CustomSelect` → `Select` do Shadcn).

**Estado:** Zustand + custom hooks locais; `@types/inventory.ts` como contrato único para reduzir prop drilling.

**Ordem de execução:** dashboard → ListSection → settings.

**Exit condition por stage:** o componente principal não excede o limite de linhas (dashboard <100, ListSection <200, settings <200) e todos os gates passam.

**Branch:** `refactor/modularize-ui` (criar a partir de `fix/rbac-matrix` = `58da2bf`); nunca push; commit por etapa.
