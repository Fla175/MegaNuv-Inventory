# Requirements — MegaNuv Inventory v2.10

## v1 Requirements

### Tipagem TypeScript

- [x] **TYP-01**: Corrigir `any` em catches de APIs — Validado via código existente
- [x] **TYP-02**: Remover eslint-disable — Validado via código existente
- [x] **TYP-03**: Tipar props dos componentes — Validado via código existente
- [x] **TYP-04**: Corrigir useEffect deps — Validado via código existente
- [x] **TYP-05**: Adicionar select em queries — Validado via código existente

### Performance

- [x] **PERF-01**: Implementar memoização — Validado via código existente
- [x] **PERF-02**: Corrigir hierarquia visual — Validado via código existente
- [x] **PERF-03**: Centralizar utilitários — Validado via código existente
- [x] **PERF-04**: Extrair funções inline — Validado via código existente

### UX

- [x] **UX-01**: Empty states em listas — Implementado na Fase 3/4
- [x] **UX-02**: Indicadores visuais de profundidade — Implementado
- [x] **UX-03**: Melhorar feedback visual — Implementado

### Responsividade

- [ ] **RSP-01**: Tabs para ícones em telas narrow
- [ ] **RSP-02**: Reduzir padding e fonte em telas narrow
- [ ] **RSP-03**: Simplificar footer (versão) em mobile
- [ ] **RSP-04**: Grid de categorias responsivo

---

## v2 Requirements (Deferred)

- [ ] Implementar testes automatizados
- [ ] Rate limiting em APIs
- [ ] Validação de força de senha

---

## Out of Scope

- [ ] API GraphQL — REST é suficiente
- [ ] WebSockets — Não requerido
- [ ] Notificações push — Não requerido
- [ ] Multi-idioma — Apenas pt-BR

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| TYP-01 | 1 | done |
| TYP-02 | 1 | done |
| TYP-03 | 1 | done |
| TYP-04 | 1 | done |
| TYP-05 | 1 | done |
| PERF-01 | 2 | done |
| PERF-02 | 2 | done |
| PERF-03 | 2 | done |
| PERF-04 | 2 | done |
| UX-01 | 3 | done |
| UX-02 | 3 | done |
| UX-03 | 3 | done |
| FIX-01 | 4 | done |
| FIX-02 | 4 | done |
| FIX-03 | 4 | done |
| RSP-01 | 5 | pending |
| RSP-02 | 5 | pending |
| RSP-03 | 5 | pending |
| RSP-04 | 5 | pending |

---

*Last updated: 2026-04-27*