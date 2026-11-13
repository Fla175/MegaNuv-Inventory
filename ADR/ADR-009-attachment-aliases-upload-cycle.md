# ADR-009: Ciclo completo do alias de anexo no upload (ADR-007, passo C/D)

| Campo        | Valor                         |
| ------------ | ----------------------------- |
| **Status**   | accepted                      |
| **Data**     | 11/11/2026                    |
| **Deciders** | Fla175 & MegaNuv              |
| **Origem**   | implementação do ADR-007 (Candidato 4) |

## Contexto

ADR-007 §C/D prevê que o `FileUpload` exiba um input de alias ao enviar novos documentos e que o alias seja persistido na tabela `Attachment` via `POST /api/actives/[activeId]/attachments`. A implementação inicial (ADR-006) adicionou a prop `showAliasInput` ao `FileUpload`, mas ela nunca era ativada nos chamadores e o alias digitado era descartado — o `onChange` propagava apenas `fileUrl` (`string[]`), não o alias.

## Decisão: contrato `onChange` com itens `{ url, alias }` e persistência no `activeForm`

### O que mudou

- **`components/FileUpload.tsx`**:
  - `onChange` passa de `(urls: string[]) => void` para `(items: { url: string; alias?: string }[]) => void`.
  - `handleAddLink` inclui `{ url, alias }` quando `showAliasInput` está ativo.
  - `handleRemoveFile` converte `string[]` → `{ url }[]` antes de chamar `onChange`.
  - `handleFileSelect` envia `{ url: publicUrl, alias }` para `onChange` após upload bem-sucedido.
  - `getFileExtension` mantido no escopo local (sem duplicação com `FileDetails.ts` — ver ADR-010 planejado).

- **`components/actives/activeForm.tsx`**:
  - `showAliasInput` ativado no `FileUpload` do formulário de ativo.
  - Novo estado `attachmentsWithAlias: { url: string; alias: string }[]` rastreia itens com alias preenchido.
  - `onChange` do `FileUpload` atualiza tanto `formData.fileUrl` (URLs, compatibilidade) quanto `attachmentsWithAlias` (itens com alias).
  - `handleSubmit`: após salvar o ativo (`POST /api/actives/create` ou `PUT /api/actives/update`), cria cada `Attachment` com alias via `POST /api/actives/[activeId]/attachments` com `{ alias, fileUrl }`.
  - No modo `create`, a criação de `Attachment` ocorre apenas após o `active` existir (o `id` vem da resposta da API).
  - Mensagens de sucesso ajustadas para incluir anexos quando houver alias.

### Por que esta abordagem

- ✅ **Ciclo fechado**: o alias digitado no upload chega ao banco como `Attachment`, não é mais descartado.
- ✅ **Compatibilidade**: `fileUrl` continua sendo preenchido como antes (string[]), então ativos antigos e uso sem alias não quebram.
- ✅ **Modo create respeitado**: `Attachment` só é criado após o `active` existir (não é possível criar anexo para ativo inexistente).
- ✅ **RBAC respeitado**: a rota `POST /api/actives/[activeId]/attachments` já está protegida por `canManageAttachments` (ADR-008).

### Backward compatibility

- `formData.fileUrl` continua sendo `string[]` — consumido pelo restante do sistema sem alteração.
- Ativos sem alias continuam funcionando exatamente como antes.
- Nenhuma mudança no schema Prisma.

### Status

Implementado na branch `feat/attachment-aliases-rbac` (working tree, junto com ADR-008). Verificado: `tsc --noEmit` (0), `eslint` (0), `vitest` (388 testes passando).

Pendente: decisão do usuário sobre commit.
