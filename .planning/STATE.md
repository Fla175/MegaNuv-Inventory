---
stage: 03-list-section-space-detail
status: done
updated: 2026-10-23
---

## Now
ADR-004 concluída e commitada na branch `refactor/modularize-ui` (sem push): endpoint
`GET /api/father-spaces/[id]`, type `SpaceDetail`, `InventorySpaces` com clique no cabeçalho +
chevron de colapso, `ListSection` com `selectedSpace` e `SpaceDetailModal` read-only, e deep-link
de edição para `/settings`. O rastro para o agente Commit está em
`.planning/stages/03-list-section-space-detail/PR.md` e no `CHANGELOG.md`
(`OpenCode Operations (11)`).

## Next
- Revisão humana e teste manual do dono (VIEWER × DIRECTOR/ADMIN).
- Quando o PR for aberto, usar `PR.md` como descrição.

## Blocked
- (nenhum)

## Open questions
- Cobertura de UI React continua ausente (`vitest` em ambiente `node`, sem `jsdom`/`@testing-library`).
  Registrar como dívida separada se a UI voltar a mudar.
