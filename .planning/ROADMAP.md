# Roadmap — MegaNuv Inventory v2.10

| # | Fase | Meta | Requirements | Sucesso Criteria |
|---|------|------|--------------|------------------|
| 1 | **Tipagem & Correções** | Corrigir issues críticos de TypeScript | [TYP-01 → TYP-05] | 5 critérios verificáveis | ✅ executed |
| 2 | **Qualidade & Performance** | Melhorar patterns de código e performance | [PERF-01 → PERF-04] | 4 critérios verificáveis | ✅ executed |
| 3 | **Polish & UX** | Ajustar Empty States e UI/UX | [UX-01 → UX-03] | 3 critérios verificáveis | ✅ executed |

---

## Fase 1: Tipagem & Correções Críticas

### Meta
Corrigir issues críticos de tipagem TypeScript identificados nas análises 001 e 002.

### Requirements

| ID | Requisito | Fonte |
|---|-----------|-------|
| TYP-01 | Corrigir `any` implícitos em catches de API | analysis-001 #1 |
| TYP-02 | Remover eslint-disable desnecessários | analysis-001 #4, analysis-002 #3 |
| TYP-03 | Tipar props dos componentes principais | analysis-002 #5 |
| TYP-04 | Adicionar dependências corretas em useEffects | analysis-001 #5, analysis-002 #6 |
| TYP-05 | Aplicar select em queries Prisma | analysis-001 #6 |

### Success Criteria

1. `yarn typecheck` passa sem erros
2. `yarn lint` passa sem erros de any
3. Componentes têm interfaces de props definidas
4. Todos os useEffects têm array de dependências
5. Queries usam select com campos específicos

---

## Fase 2: Qualidade & Performance

### Meta
Melhorar patterns de código e performance identificados nas análises.

### Requirements

| ID | Requisito | Fonte |
|---|-----------|-------|
| PERF-01 | Implementar memoização em componentes | analysis-002 #4 |
| PERF-02 | Corrigir espaçamento hierárquico | analysis-002 #1 |
| PERF-03 | Centralizar lógica de cores | analysis-002 #7 |
| PERF-04 | Extrair funções inline de JSX | analysis-002 #8 |

### Success Criteria

1. Componentes usam React.memo onde necessário
2. Hierarquia visual com ml progressivo
3. Utilitários centralizados em /lib/utils/
4. Funções usam useCallback em listas

---

## Fase 3: Polish & UX

### Meta
Ajustar empty states e UI/UX para melhor experiência.

### Requirements

| ID | Requisito | Fonte |
|---|-----------|-------|
| UX-01 | Adicionar empty states em listes vazias | análise manual |
| UX-02 | Adicionar indicadores visuais de profundidade | análise manual |
| UX-03 | Melhorar feedback visual de ações | análise manual |

### Success Criteria

1. Listas mostram estado vazio quando necessário
2. Itens pais têm indicador visual
3. Ações têm feedback visual claro

---

## Evolução

| Fase | Status | Atualizado |
|------|--------|-----------|
| 1 | ✅ executed | 2026-04-24 |
| 2 | ✅ executed | 2026-04-24 |
| 3 | ✅ executed | 2026-04-24 |

---

*Last updated: 2026-04-24 after roadmap creation*