# ADR-011: Adapter puro buildAttachmentViews para unificar anexos + fileUrl legado (ADR-007, Candidato 3)

| Campo        | Valor                         |
| ------------ | ----------------------------- |
| **Status**   | accepted                      |
| **Data**     | 11/11/2026                    |
| **Deciders** | Fla175 & MegaNuv              |
| **Origem**   | implementação do ADR-007 (Candidato 3) |

## Contexto

`ItemDetailModal.tsx` misturava duas responsabilidades na JSX:
1. Ler anexos da tabela `Attachment` (com alias) via `fetch` direto no `useEffect`.
2. Renderizar documentos do `fileUrl` legado (JSON/CSV) via `parseFileUrls()`.

Além disso, o `useEffect` não tinha guard de `activeId` (já causou 404 com `activeId` undefined). A lógica de "o que exibir por anexo" estava espalhada na JSX do componente, sem localidade — impossível de testar sem renderizar React (ambiente node, sem jsdom).

## Decisão: adapter puro `buildAttachmentViews` em `lib/attachments.ts`

### O que mudou

- **`lib/attachments.ts`** (novo): função pura `buildAttachmentViews(item, attachments)` que recebe o ativo e a lista de anexos e devolve um array unificado de `AttachmentView` (`{ displayName, url, extension, Icon, colorClass, bgClass, isAlias }`). Anexos da tabela `Attachment` vêm primeiro (ordenados pelo caller), documentos legados do `fileUrl` vêm depois.
- **`components/list/ItemDetailModal.tsx`**:
  - Importa `buildAttachmentViews` de `@/lib/attachments`.
  - Adicionado guard `if (!activeId) return;` no `useEffect` (corrige 404 com `activeId` undefined).
  - Removeu import direto de `getFileDetails` da `./FileDetails`.
  - A JSX agora consome o array unificado de `buildAttachmentViews(item, attachments)`, exibindo anexos com alias e documentos legados lado a lado (não mais mutuamente exclusivos).
- **`__tests__/lib/attachments.test.ts`** (novo): 8 testes cobrindo anexo com alias, sem alias (fallback activeId), documento legado, ambos juntos, item undefined/null, e presença de Icon/colorClass/bgClass.

### Por que esta abordagem

- ✅ **Localidade**: a regra "o que exibir por anexo" vive em uma função pura em `lib/`, testável sem jsdom.
- ✅ **Leverage**: mudar o display de anexos altera um único lugar, não a JSX do modal.
- ✅ **Sem acoplamento camada↔UI**: o componente não sabe mais como anexo e legado diferem; consome um array já pronto.
- ✅ **Correção de bug**: guard de `activeId` evita `fetch` para `/api/actives/undefined/attachments`.

### Backward compatibility

`fileUrl` legado continua sendo exibido (agora junto com anexos da tabela `Attachment`, não mais mutuamente exclusivo). Nenhuma mudança no schema Prisma.

### Status

Implementado na branch `feat/attachment-aliases-rbac` (working tree). Verificado: `tsc --noEmit` (0), `eslint` (0), `vitest` (406 testes passando).

Pendente: decisão do usuário sobre commit.
