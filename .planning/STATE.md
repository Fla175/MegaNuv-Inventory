---
stage: E-validation
status: done
updated: 2026-10-21
---

## Now
ADR-003 concluída: `pages/dashboard.tsx` (124 L), `components/ListSection.tsx` (355 L) e
`pages/settings.tsx` (169 L), com hooks por domínio e `components/settings/*`.
A revisão final corrigiu impressão/indentação da Etapa C, papel de MANAGER criador e regressões
visuais dos diálogos da Etapa D.

## Next
- (nenhum para a ADR-003)

## Blocked
- (nenhum)

## Open questions
- Cobertura de UI React continua ausente (`vitest` em ambiente `node`, sem `jsdom`/`@testing-library`).
  Registrar como dívida separada se a UI voltar a mudar.
