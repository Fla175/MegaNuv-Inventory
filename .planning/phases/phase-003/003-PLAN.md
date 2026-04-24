# Phase 3 Plan: Polish & UX — PLAN.md

**Phase:** 3  
**Status:** Executed  
**Executed:** 2026-04-24

---

## Requirements

| ID | Requisito | Status |
|---|-----------|--------|
| UX-01 | Adicionar empty states em listas vazias | ✅ Done |
| UX-02 | Adicionar indicadores visuais de profundidade | ✅ Done |
| UX-03 | Melhorar feedback visual de ações | ✅ Done |

---

## UI-SPEC Reference

UI-SPEC.md já existe em `.planning/phases/phase-003/003-UI-SPEC.md`

---

## Análise de Estado Atual

### UX-01: Empty States — **JÁ IMPLEMENTADO**
- ✅ `ListSection.tsx:533-547` — Empty state implementado
- ✅ Sem dados: "Nenhum Espaço Cadastrado"
- ✅ Com filtro: "Nenhum resultado encontrado"
- 📋 Verificar dashboard e outras páginas

### UX-02: Indicadores de Profundidade — **PARCIAL**
- ⚠️ `ListSection.tsx:324` — usa borderLeft fixo
- 📍 Implementar DepthIndicator conforme UI-SPEC
- 📍 Mostrar nível com ml progressivo

### UX-03: Feedback Visual — **JÁ IMPLEMENTADO**
- ✅ Toast notifications em uso
- ✅ useToast hook disponível
- 📋 Verificar se todos os actions têm feedback

---

## Tasks

### UX-01: Empty States

```
[TASK-001] Verificar empty state em index.tsx
  Arquivo: pages/index.tsx
  Se fatherSpaces.length === 0 → mostrar EmptyState
  
[TASK-002] Verificar empty state em dashboard.tsx
  Arquivo: pages/dashboard.tsx  
  Se stats vazio → mostrar EmptyState
```

### UX-02: Indicadores de Profundidade

```
[TASK-003] Criar DepthIndicator component
  Arquivo: components/ui/DepthIndicator.tsx
  Props: depth: number
  Estilo: w-2 h-2 rounded-full blue-500
  
[TASK-004] Integrar DepthIndicator em ListSection
  Cada item pai mostra indicador
  Animação pulse em itens ativos
```

### UX-03: Feedback Visual

```
[TASK-005] Auditar todas as ações
  Verificar: create, update, delete, move
  Cada ação deve ter toast.showSuccess/Error
  
[TASK-006] Adicionar toast em ações faltantes
  Cron jobs,Imports, etc.
```

---

## Execução

### wave-1: empty states (UX-01)
- Verificação de empty states em todas as páginas

### wave-2: depth indicators (UX-02)
- Criar componente DepthIndicator
- Integrar em ListSection

### wave-3: feedback audit (UX-03)
- Auditar ações e seus toasts

---

## Verification

1. Listas mostram estado vazio quando necessário
2. Itens pais têm indicador visual
3. Ações têm feedback visual claro

---

*Planned: 2026-04-24*