---
stage: A-shadcn-prep
status: in_progress
updated: 2026-10-20
---

## Now
Etapa A em andamento: inicializando Shadcn UI (T1–T4).

## Next
T1: `npx shadcn@latest init` (ou `components.json` manual para Tailwind v4 + Pages Router).
T2: adicionar `select`, `dialog`, `popover` em `components/ui/`.
T3: rodar gates (`lint`, `tsc`, `prisma validate`, `test`, `build:opt`).
T4: commit em `refactor/modularize-ui`.

## Blocked
- (nenhum)

## Open questions
- Se o Shadcn não suportar Tailwind v4 automaticamente, configurar `components.json` manualmente (decisão já tomada no grilling Q4).
