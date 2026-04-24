# Phase 1: Tipagem & Correções - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Corrigir issues críticos de tipagem TypeScript identificados nas análises 001 e 002 — scope é HOW implementar (código), não WHAT construir.

</domain>

<decisions>
## Implementation Decisions

###Tratamento de Erros (TYP-01)
- **D-01:** Usar `catch (error: unknown)` + type narrowing com `instanceof Error`
- **D-02:** Evitar `any` em catches — seguir strict mode

### eslint-disable (TYP-02)
- **D-03:** Manter o mínimo necessário (8 em APIs + 7 em componentes)
- **D-04:** Documentar cada eslint-disable com comentário justificando por que manteve

### Tipagem de Props (TYP-03)
- **D-05:** ListSection.tsx → criar interface `ListSectionProps`
- **D-06:** activeForm.tsx → criar interface `ActiveFormProps`
- **D-07:** Layout.tsx → refinar props existentes

### Dependências useEffect (TYP-04)
- **D-08:** TODOS useEffects DEVEM ter array de dependências
- **D-09:** `[]` para mounted once, `[deps]` para re-run when deps change

### Select em Queries (TYP-05)
- **D-10:** categories/list → `select: { id: true, name: true, color: true }`
- **D-11:** actives/list → `select: { id: true, name: true, serialNumber: true, categoryId: true }`
- **D-12:** fatherSpaces/list → `select: { id: true, name: true, fatherSpaceId: true }`

### Claude's Discretion
- Pode decidir qual estrutura de interface (named vs inline) conforme padrão do projeto

</decisions>

<canonical_refs>
## Canonical References

### Analysis Files
- `analysis/analysis-001/ANALYSIS.md` — 13 issues (APIs/pages)
- `analysis/analysis-002/ANALYSIS.md` — 8 issues (componentes)

### Codebase References
- `.planning/codebase/CONCERNS.md` — consolidado de todas issues
- `.planning/codebase/CONVENTIONS.md` — padrões do projeto

### External References
- Nenhum spec externo — requisitos são internos ao projeto

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Tipos existentes em `/types/` — verificar antes de criar novos
- Componentes em `/components/` — refinar props interfaces

### Established Patterns
- catch usa `any` — padrão antigo
- Props implícitas em Komponentes pais
- useEffects sem deps — 12+ ocorrências

### Integration Points
- APIs em `/pages/api/` — 34 rotas
- Componentes em `/components/` — ~15komponentes

</code_context>

<specifics>
## Specific Ideas

Sem específicações — seguir recomendações acima.

</specifics>

<deferred>
## Deferred Ideas

Nenhuma — discussão ficou dentro do scope da fase.

</deferred>

---

*Phase: 01-typagem*
*Context gathered: 2026-04-24*