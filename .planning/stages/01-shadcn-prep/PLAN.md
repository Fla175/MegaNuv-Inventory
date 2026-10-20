# PLAN — Etapa A: Preparação e Shadcn UI

Tarefas em ordem de dependência. Cada tarefa tem acceptance criteria e verification.

## T1 — Inicializar o Shadcn UI
**O que muda:** executa `npx shadcn@latest init` na raiz; se não suportar Tailwind v4 / Pages Router, configura `components.json` manualmente apontando para o `tailwind.config.mjs` existente e `pages/` como diretório de componentes.
**Acceptance criteria:**
- `components.json` existe na raiz.
- `components/ui/` existe (ou será populado em T2).
- `npx shadcn@latest init` não falha por falta de suporte ao stack.
**Verification:** `ls components.json` e `ls components/ui/` (vazio ou com arquivos) existem; `cat components.json` contém `tailwind.config` ou `aliases` compatíveis com o projeto.

## T2 — Adicionar componentes base do Shadcn
**O que muda:** instala os componentes que serão usados nas etapas B–D: `select`, `dialog`, `popover` (e `sheet` se necessário para modais largos).
**Acceptance criteria:**
- `components/ui/select.tsx`, `components/ui/dialog.tsx`, `components/ui/popover.tsx` existem.
- Cada arquivo exporta um componente React tipado.
**Verification:** `npx tsc --noEmit` passa (0 erros) após a adição.

## T3 — Rodar gates completos
**O que muda:** nenhuma alteração de código; apenas verificação.
**Acceptance criteria:**
- `yarn lint` → 0 erros, 0 avisos.
- `npx tsc --noEmit` → 0 erros.
- `npx prisma validate` → schema válido.
- `yarn test` → 350 testes passando (5 skipped), sem regressão.
- `yarn build:opt` → build standalone bem-sucedido (≈90M).
**Verification:** saída de cada comando confirma sucesso.

## T4 — Commit da etapa
**O que muda:** commit em branch `refactor/modularize-ui` (criada a partir de `fix/rbac-matrix` = `58da2bf`) com apenas os arquivos do Shadcn.
**Acceptance criteria:**
- Branch criada a partir de `58da2bf`.
- Commit segue Conventional Commits (`feat(ui): adicionar shadcn-ui` ou similar).
- Não há push.
**Verification:** `git log --oneline -1` mostra o commit; `git branch --show-current` mostra `refactor/modularize-ui`.
