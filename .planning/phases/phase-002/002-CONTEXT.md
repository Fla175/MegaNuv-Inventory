# Phase 2: Qualidade & Performance - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Melhorar patterns de código e performance — scope é HOW implementar (código), não WHAT construir.

</domain>

<decisions>
## Implementation Decisions

### Memoização (PERF-01)
- **D-01:** Aplicar React.memo em ListSection, activeForm, Layout
- **D-02:** Usar useMemo para filteredData e cálculos pesados

### Hierarquia Visual (PERF-02)
- **D-03:** Implementar `ml-${level * 6}` progressivo em renderActiveTree
- **D-04:** Usar borderLeft dinâmico para diferenciação visual

### Centralização de Cores (PERF-03)
- **D-05:**keep existing colors.ts in /lib/constants/
- **D-06:** Adicionar más funções de cor se necessário

### Funções Inline (PERF-04)
- **D-07:** Usar useCallback para handleCheckboxChange, handleDelete
- **D-08:** Extrair funções de renderActiveTree para fora do JSX

</decisions>

<canonical_refs>
## Canonical References

### Analysis Files
- `analysis/analysis-002/ANALYSIS.md` — issues #1, #4, #7, #8

### Codebase References
- `components/ListSection.tsx` — memoização, hierarquia visual
- `components/actives/activeForm.tsx` — funções inline
- `components/Layout.tsx` — props typing

</code_context>

---

*Phase: 02-qualidade*
*Context gathered: 2026-04-24*