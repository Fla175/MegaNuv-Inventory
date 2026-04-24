# Phase 1 Plan: Tipagem & Correções — PLAN.md

**Phase:** 1  
**Status:** Planned  
**Created:** 2026-04-24

---

## Requirements

| ID | Requisito | Status |
|---|-----------|--------|
| TYP-01 | Corrigir `any` implícitos em catches de API | 🔲 Pending |
| TYP-02 | Remover eslint-disable desnecessários | 🔲 Pending |
| TYP-03 | Tipar props dos componentes principais | 🔲 Pending |
| TYP-04 | Adicionar dependências corretas em useEffects | 🔲 Pending |
| TYP-05 | Aplicar select em queries Prisma | 🔲 Pending |

---

## Análise de Estado Atual

### TYP-01: catch(error) — **PARCIAL**
- ✅ `father-spaces/update.ts:51` — já usa `catch (error: unknown)` com narrowing
- ✅ `father-spaces/create.ts`, `delete.ts` — já tipado
- ❌ `categories/list.ts:34` — `catch (error)` sem tipo
- ❌ `actives/list.ts`, `logs/list.ts` — precisam correção
- 📍 **8 arquivos** precisam correção

### TYP-02: eslint-disable — **JÁ DOCUMENTADO**
- Decisão D-03: Manter mínimo necessário (8 em APIs + 7 em componentes)
- Decisão D-04: Documentar cada eslint-disable com comentário justificando
- 📋 Requer auditoria: manter apenas os justificáveis

### TYP-03: props typing — **PARCIAL**
- ✅ `ListSectionProps` existe mas usa `any` (linha 16-24)
- 📍 Criar interfaces específicas:
  - `ListSectionProps` → tipar filters, onEdit, onClone, actives, fatherSpaces
  - `ActiveFormProps` → tipar campos do formulário
  - `LayoutProps` → refinar existentes

### TYP-04: useEffect deps — **JÁ CORRIGIDO**
- ✅ `ListSection.tsx:89` — `useEffect(() => {...}, [])`
- ✅ `ListSection.tsx:107` — `useEffect(() => {...}, [contextMenu])`
- 📋 Verificar outros componentes

### TYP-05: select em queries — **PENDENTE**
- ❌ `categories/list.ts` — retorna `_count` mas sem select específico
- ❌ `actives/list.ts` — retorna objeto completo
- ❌ `fatherSpaces/list.ts` — precisa verificação
- ✅ Implementar: `select: { id: true, name: true, ... }`

---

## Tasks

### TYP-01: Corrigir catches de API

```
[TASK-001] Padronizar catch(error) em APIs
  Files: pages/api/categories/list.ts, pages/api/actives/list.ts, 
         pages/api/logs/list.ts, pages/api/father-spaces/*.ts
  Pattern:
    catch (error: unknown) {
      console.error("API_NAME_ERROR:", error);
      const message = error instanceof Error ? error.message : "Erro interno";
      return res.status(500).json({ error: message });
    }
```

### TYP-02: Documentar eslint-disable

```
[TASK-002] Auditoria de eslint-disable
  Apurar: pages/api/*, components/*
  Ação: Manter apenas os documentados em D-03/D-04
  Formato comentário:
    /* eslint-disable @typescript-eslint/no-explicit-any -- Reason: ... */
```

### TYP-03: Tipar propriedades

```
[TASK-003] ListSection.tsx → interfaces
  filters: { query?: string; category?: string; manufacturer?: string; model?: string; }
  onEdit: (item: Active, mode: 'view' | 'edit') => void
  onClone: (item: Active) => void
  onRefresh: () => void
  actives: Active[]
  fatherSpaces: FatherSpace[]

[TASK-004] activeForm.tsx → interfaces
  Definir campos do formulário

[TASK-005] Layout.tsx → refinar interfaces existentes
```

### TYP-04: Verificar useEffects

```
[TASK-006] Auditoria de useEffect
  Componentes: pages/*.tsx, components/*.tsx
  Verificar: todos têm array de dependências
  Corrigir: os que estão sem []
```

### TYP-05: Adicionar select

```
[TASK-007] categories/list.ts
  select: { id: true, name: true, color: true, _count: { select: { actives: true } } }

[TASK-008] actives/list.ts
  select: { id: true, name: true, serialNumber: true, categoryId: true, ... }

[TASK-009] fatherSpaces/list.ts
  select: { id: true, name: true, fatherSpaceId: true }
```

---

## Execução

### wave-1: catch error (TYP-01)
- pages/api/categories/list.ts
- pages/api/actives/list.ts
- pages/api/logs/list.ts
- pages/api/father-spaces/*.ts

### wave-2: select queries (TYP-05)
- pages/api/categories/list.ts
- pages/api/actives/list.ts
- pages/api/father-spaces/list.ts

### wave-3: props typing (TYP-03)
- components/ListSection.tsx
- components/actives/activeForm.tsx
- components/Layout.tsx

### wave-4: useEffect + eslint (TYP-04, TYP-02)
- Verificação e documentação

---

## Verification

1. `yarn typecheck` passa sem erros
2. `yarn lint` passa sem erros de any
3. Componentes têm interfaces de props definidas
4. Todos os useEffects têm array de dependências
5. Queries usam select com campos específicos

---

*Planned: 2026-04-24*