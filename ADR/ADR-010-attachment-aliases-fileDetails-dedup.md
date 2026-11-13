# ADR-010: Dedup de getFileDetails (uma fonte de verdade para aparência de anexos)

| Campo        | Valor                         |
| ------------ | ----------------------------- |
| **Status**   | accepted                      |
| **Data**     | 11/11/2026                    |
| **Deciders** | Fla175 & MegaNuv              |
| **Origem**   | implementação do ADR-007 (Candidato 2) |

## Contexto

`getFileDetails` (deriva exibição visual de uma URL de anexo: nome, extensão, ícone, cores) existia em **duas cópias quase idênticas**:

- `components/FileUpload.tsx:29-55` (cópia local, não exportada)
- `components/list/FileDetails.ts:12-38` (exportada, consumida por `ItemDetailModal`)

As cópias divergiam silenciosamente: para `.doc/.docx`, `FileUpload` usava `FileIcon` + `dark:bg-zinc-900/20` enquanto `FileDetails.ts` usava `File` + `dark:bg-blue-900/20`. Qualquer mudança de estilo exigia editar dois lugares.

## Decisão: remover a cópia de FileUpload, importar de FileDetails.ts

### O que mudou

- **`components/FileUpload.tsx`**: removida a função `getFileDetails` local e os ícones `FileText`, `FileIcon`, `Image` que só ela usava; agora importa `getFileDetails` de `@/components/list/FileDetails`.
- **`components/list/FileDetails.ts`**: sem alteração — sua versão prevalece (já exportada e consumida por `ItemDetailModal`).
- **`__tests__/lib/fileDetails.test.ts`**: novo teste unitário com 10 casos cobrindo PDF, DOC, DOCX, PNG, JPEG, extensão desconhecida, query string, nome URI-encoded e fallback sem nome de arquivo.

### Por que esta abordagem

- ✅ **Deletion test aplicado**: deletar a cópia de `FileUpload` e importar de `FileDetails` concentra complexidade (interface rasa eliminada).
- ✅ **Localidade**: a regra visual de anexos vive em um único arquivo.
- ✅ **Leverage**: mudar cor/ícone de um tipo de arquivo altera todos os consumidores de uma vez.
- ✅ **Testável**: `getFileDetails` é pura, testável sem jsdom.

### Backward compatibility

Nenhuma mudança de comportamento visível para o usuário, exceto que DOC/DOCX agora usam o ícone `File` (em vez de `FileIcon`) e cor `dark:bg-blue-900/20` (em vez de `dark:bg-zinc-900/20`) — alinhando `FileUpload` com `ItemDetailModal`.

### Status

Implementado na branch `feat/attachment-aliases-rbac` (working tree). Verificado: `tsc --noEmit` (0), `eslint` (0), `vitest` (398 testes passando).

Pendente: decisão do usuário sobre commit.
