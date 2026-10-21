---
stage: D-settings
status: not_started
updated: 2026-10-20
---

## Now
Etapa D pendente: modularizar `pages/settings.tsx` (1.254 L) — 5 abas + 7 modais extraídos.

## Next
- Extrair `useSettingsPermissions()`, `useSettingsData()`, `useRevertHistory()`, `useCreatorAccess()`, `useUserCrud()`
- Extrair componentes: `UsersTab`, `SpacesTab`, `CategoriesTab`, `LogsTab`, `ThemeTab` + modais
- Substituir `ConfirmDialog` por `Dialog`/`AlertDialog` do Shadcn
- Reescrever `SettingsPage` como orquestrador fino (<200 linhas)

## Blocked
- (nenhum)

## Open questions
- (nenhum)
