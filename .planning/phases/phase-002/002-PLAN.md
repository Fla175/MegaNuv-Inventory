# Phase 2 Plan: Qualidade & Performance — PLAN.md

**Phase:** 2  
**Status:** Executed  
**Executed:** 2026-04-24

---

## Requirements

| ID | Requisito | Status |
|---|-----------|--------|
| PERF-01 | Implementar memoização em componentes | ✅ Done |
| PERF-02 | Corrigir espaçamento hierárquico | ✅ Done |
| PERF-03 | Centralizar lógica de cores | ✅ Done |
| PERF-04 | Extrair funções inline de JSX | ✅ Done |

---

## Análise de Estado Atual

### PERF-01: memoização — **PARCIAL**
- ❌ ListSection.tsx — useMemo presente mas não aplicado em renderizações
- ❌ activeForm.tsx — useMemo presente mas não otimizado
- 📍 Aplicar React.memo em componentes pais
- 📍 Aplicar useMemo em filteredData, renderActiveTree

### PERF-02: hierarquia visual — **PARCIAL**
- ⚠️ `ListSection.tsx:308,324` — usa `ml-${level * 4}` fixo
- 📍 Mudar para cálculo dinâmico: `level * 6` (progressivo)
- 📍 Adicionar borderLeft para diferenciação visual

### PERF-03: cores centralizadas — **JÁ IMPLEMENTADO**
- ✅ colors.ts em /lib/constants/
- 📋 Verificar se todas as cores usam o utilitário

### PERF-04: funções inline — **PENDENTE**
- 📍 Extrair para useCallback:
  - handleCheckboxChange (linha 372)
  - handleDelete (linha 246)
  - getAllChildIds (linha 360)
  - handleLongPressStart/End

---

## Tasks

### PERF-01: Memoização

```
[TASK-001] Aplicar React.memo em ListSection
  Componente: export default React.memo(ListSection)
  Verificar: props stable

[TASK-002] Aplicar useMemo em filteredData
  Linha: 148-199
  Dependency: [filters, actives, fatherSpaces]

[TASK-003] Aplicar React.memo em activeForm
```

### PERF-02: Hierarquia Visual

```
[TASK-004] Implementar ml progressivo
  Arquivo: components/ListSection.tsx
  Mudar: ml-${level * 4} → ml-${level * 6}
  Linha: 308 (empty state), 324 (tree render)
  
[TASK-005] Adicionar borderLeft dinâmico
  Pattern: border-l-2 dark:border-white/5
```

### PERF-03: Cores Centralizadas

```
[TASK-006] Auditoria de uso de cores
  Verificar: todas as cores usam getItemColors, getCategoryColor
  Local: /lib/constants/colors.ts
```

### PERF-04: Funções Inline

```
[TASK-007] Extrair handleCheckboxChange para useCallback
  Arquivo: components/ListSection.tsx
  Linha: 372
  
[TASK-008] Extrair handleDelete para useCallback
  Linha: 246
  
[TASK-009] Extrair getAllChildIds para useCallback
  Linha: 360
  
[TASK-010] Extrair handleLongPressStart/End
```

---

## Execução

### wave-1: memoização (PERF-01)
- ListSection.tsx → React.memo + useMemo
- activeForm.tsx → React.memo

### wave-2: hierarquia visual (PERF-02)
- ListSection.tsx → ml progressivo
- borderLeft dinâmico

### wave-3: cores (PERF-03)
- Auditoria de uso

### wave-4: funções inline (PERF-04)
- useCallback extraction

---

## Verification

1. Componentes usam React.memo onde necessário
2. Hierarquia visual com ml progressivo
3. Utilitários centralizados em /lib/utils/
4. Funções usam useCallback em listas

---

*Planned: 2026-04-24*