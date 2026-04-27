# Roadmap — MegaNuv Inventory v2.10

| # | Fase | Meta | Requirements | Sucesso Criteria |
|---|------|------|--------------|------------------|
| 1 | **Tipagem & Correções** | Corrigir issues críticos de TypeScript | [TYP-01 → TYP-05] | 5 critérios verificáveis | ✅ executed |
| 2 | **Qualidade & Performance** | Melhorar patterns de código e performance | [PERF-01 → PERF-04] | 4 critérios verificáveis | ✅ executed |
| 3 | **Polish & UX** | Ajustar Empty States e UI/UX | [UX-01 → UX-03] | 3 critérios verificáveis | ✅ executed |
| 4 | **Correções de Implementação** | Empty-state, versão dinâmica e deleção em cascata | [FIX-01 → FIX-03] | 3 critérios verificáveis | ✅ executed |
| 5 | **Responsividade Settings** | Ajustar UI para telas narrow (half monitor) | [RSP-01 → RSP-04] | 4 critérios verificáveis | ⏳ planned |

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

## Fase 4: Correções de Implementação

### Meta
Empty-state em espaço pai sem ativos, versão dinâmica do projeto, deleção em cascata de espaço pai.

### Requirements

| ID | Requisito | Fonte |
|---|-----------|-------|
| FIX-01 | Empty-state no render do espaço pai quando não há ativos | ListSection.tsx:556 |
| FIX-02 | Versão dinâmica lida de package.json | Layout.tsx + lib/version.ts |
| FIX-03 | Deleção em cascata de espaço pai (OBRIGATÓRIO) | father-spaces/delete.ts |

### Success Criteria

1. Espaço pai mostra "Nenhum ativo neste local" quando vazio
2. `VERSION` é lida de `package.json` em tempo de build
3. `/api/father-spaces/delete` remove todos os ativos antes de remover o espaço

---

## Fase 5: Responsividade Settings

### Meta
Corrigir responsividade da página de configurações em telas narrow (metade do monitor Full HD 23").

### Requirements

| ID | Requisito | Fonte |
|---|-----------|-------|
| RSP-01 | Reduzir botões de tabs para ícones em telas < 1024px | settings.tsx:282-297 |
| RSP-02 | Reduzir padding e fonte em telas narrow | settings.tsx: containers |
| RSP-03 | Simplificar footer (remover versão) em mobile | Layout.tsx:128-155 |
| RSP-04 | Ajustar grid de categorias para não estourar | settings.tsx:435 |

### Success Criteria

1. Tabs mostram apenas ícone abaixo de 1024px
2. Layout adapta-se sem quebra ou scroll horizontal
3. Footer mostra apenas usuário + logout em mobile
4. Grid de categorias com colunas adequadas ao tamanho

---

## Evolução

| Fase | Status | Atualizado |
|------|--------|------------|
| 1 | ✅ executed | 2026-04-24 |
| 2 | ✅ executed | 2026-04-24 |
| 3 | ✅ executed | 2026-04-24 |
| 4 | ✅ executed | 2026-04-27 |
| 5 | ⏳ planned | 2026-04-27 |

---

*Last updated: 2026-04-24 after roadmap creation*