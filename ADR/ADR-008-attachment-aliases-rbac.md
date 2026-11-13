# ADR-008: RBAC de anexos (Attachment) com predido puro

| Campo        | Valor                         |
| ------------ | ----------------------------- |
| **Status**   | accepted                      |
| **Data**     | 11/11/2026                    |
| **Deciders** | Fla175 & MegaNuv              |
| **Origem**   | implementação do ADR-007 (Candidato 1) |

## Contexto

ADR-007 (proposed) define que apenas MANAGER, ADMIN e DIRECTOR podem gerenciar (criar, renomear, excluir) anexos, enquanto VIEWER só visualiza. A implementação inicial das rotas de anexo (`POST /api/actives/[activeId]/attachments`, `PATCH/DELETE /api/attachments/[attachmentId]`) tinha dois problemas:

1. O `POST` bloqueava `VIEWER` com uma verificação ad-hoc inline (`session.role === "VIEWER"`), inconsistente com o restante do código.
2. `PATCH` e `DELETE` não tinham **nenhuma** verificação de papel — brecha de segurança: qualquer autenticado podia renomear/excluir qualquer anexo.

## Decisão: predido puro `canManageAttachments` em `lib/apiAuth.ts`

### O que mudou

- **`lib/apiAuth.ts`**: adicionado `canManageAttachments(user)` puro, ao lado de `isViewer`, `isPrivileged`, `canViewValue`. Retorna `true` para `DIRECTOR | ADMIN | MANAGER`, `false` para `VIEWER` e sem usuário.
- **`pages/api/actives/[activeId]/attachments.ts`**: `POST` agora usa `!canManageAttachments(session)` em vez do `if (session.role === "VIEWER")` ad-hoc. Mensagem de erro ajustada para `"Permissões insuficientes para criar anexos."` (mais precisa: bloqueia qualquer não-escritor, não só VIEWER). Removido branch `P2002` morto (schema não declara `@@unique([alias, activeId])`).
- **`pages/api/attachments/[attachmentId].ts`**: `PATCH` e `DELETE` agora verificam `canManageAttachments(session)` antes de prosseguir (retornam `403` quando não autorizado).
- **`__tests__/lib/apiAuth.test.ts`**: 6 testes novos (canManageAttachments: 3 papéis permitidos, VIEWER negado, sem usuário; canViewValue regressão: 3 casos).

### Por que esta abordagem

- ✅ **Um ponto de verdade**: a regra "pode gerenciar anexos" vive em `lib/apiAuth.ts`, não espalhada inline pelos handlers.
- ✅ **Consistente com ADR-002**: mesmo conjunto de papéis (DIRECTOR/ADMIN/MANAGER escrevem; VIEWER não).
- ✅ **Consistente com SPECS §5.1**: handlers resolvem sessão no próprio handler via `getSessionUser`; não confiam apenas no middleware.
- ✅ **Testável**: predido puro, sem HTTP, sem jsdom. Teste parametrizado sobre os 4 papéis + `null`/`undefined`.

### Backward compatibility

Nenhuma mudança no schema Prisma, no formato de `fileUrl`, ou na API de leitura (`GET`). Apenas acrescento guarda de escrita nas rotas de mutação.

### Status

Implementado na branch `feat/attachment-aliases-rbac` (working tree). Verificado: `tsc --noEmit` (0), `eslint` (0), `vitest` (25 testes passando).

Pendente: decisão do usuário sobre commit.
