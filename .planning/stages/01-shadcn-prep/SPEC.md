# SPEC — Etapa A: Preparação e Shadcn UI

**Goal:** Shadcn UI inicializado e validado no projeto; componentes base disponíveis para as etapas B–D.

**Exit condition (falsifiable):**
1. `components/ui/` existe e contém ao menos os componentes base instalados.
2. `yarn lint` → 0 erros, 0 avisos.
3. `npx tsc --noEmit` → 0 erros.
4. `npx prisma validate` → schema válido.
5. `yarn test` → suíte verde (sem regressão dos 350 testes existentes).
6. `yarn build:opt` → build standalone bem-sucedido (≈90M).
7. Nenhum componente feito à mão foi removido ou alterado nesta etapa (apenas adição do Shadcn).

**Depends on:** —

**Not in scope:** nenhum componente de dashboard/settings/list é tocado nesta etapa.
