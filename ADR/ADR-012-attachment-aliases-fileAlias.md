# ADR-012: Simplificação do alias de anexo — campo `fileAlias` direto na tabela `Active`

| Campo        | Valor                         |
| ------------ | ----------------------------- |
| **Status**   | accepted                      |
| **Data**     | 13/11/2026                    |
| **Deciders** | Fla175 & MegaNuv              |
| **Origem**   | falha de persistência da tabela `Attachment` separada (ADR-006/007) |

## Contexto

ADR-006 criou o modelo Prisma `Attachment` (tabela separada para aliases de documentos) para preservar compatibilidade total com o formato legado de `Active.fileUrl`. ADR-007 acrescentou gerenciamento de alias no front-end com RBAC. A implementação encontrou problemas recorrentes:

1. O `id` do anexo criado via `POST /api/actives/[activeId]/attachments` não é retornado de forma confiável pela resposta da API, deixando o estado local sem `id` e impossibilitando renomear depois de salvar.
2. O `onChange` do `FileUpload` substitui todo o estado de anexos, perdendo `id`s preenchidos após o `POST`.
3. O botão de edição do alias mostra `"Não é possível renomear: anexo ainda não foi salvo."` porque o `id` do banco não chega ao estado local.
4. O fluxo exige múltiplas chamadas sequenciais (salvar ativo → criar anexo → atualizar id local → renomear), cada uma ponto de falha.

A tabela separada `Attachment` introduz complexidade desnecessária para um caso de uso simples: **um ativo tem um ou mais documentos, cada um com um alias opcional**. Não há necessidade de uma tabela própria com ciclo de vida independente.

## Decisão: campo `fileAlias` array paralelo ao `fileUrl` na tabela `Active`

### Decisões do grilling (Q1–Q5)

- **Q1**: Um `fileAlias` por `fileUrl` — array paralelo por índice, mesma estrutura do `fileUrl` (CSV/JSON). Se há 3 URLs, há 3 aliases (cada um pode estar vazio).
- **Q2**: Não existem dados na tabela `Attachment` (não entrou em produção).
- **Q3**: O alias vem interconectado ao `fileUrl`, enviados juntos. O modal de rename já existente é usado para nomear o alias, e então `fileUrl` + `fileAlias` são adicionados à lista de envio.
- **Q4**: Mostra `fileAlias` como nome do arquivo (mantém a extensão original). Se não houver `fileAlias` para aquele `fileUrl` específico, mostra o nome derivado da URL como fallback.
- **Q5**: Deletar endpoints e CRUDs de `pages/api/attachments/` — não há necessidade de compatibilidade com dados antigos, pois a versão não entrou em produção.

### O que muda

#### A. Prisma Schema (`prisma/schema.prisma`)

Removido o modelo `Attachment` completamente. Adicionado campo `fileAlias` opcional ao modelo `Active`, ao lado de `fileUrl`:

```prisma
model Active {
  id              String      @id
  name            String
  categoryId      String
  sku             String?
  manufacturer    String?
  model           String?
  serialNumber    String?     @unique
  fixedValue      Float       @default(0)
  fatherSpaceId   String
  parentId        String?
  isPhysicalSpace Boolean
  tag             String      @default("IN-STOCK")
  notes           String?     @db.Text
  createdById     String?
  imageUrl        String?
  fileUrl         String?     @db.Text
  fileAlias       String?     @db.Text  // Alias amigável opcional, paralelo ao fileUrl (CSV/JSON)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  ...
  Movement        Movement[]
}
```

#### B. Tipo TypeScript (`types/inventory.ts`)

Removida a interface `Attachment`. Adicionado `fileAlias?: string | null` à interface `Active` e `InventoryItem`:

```typescript
export interface Active {
  ...
  fileUrl?: string | null;
  fileAlias?: string | null;  // Novo: paralelo a fileUrl
  ...
}
```

#### C. API Routes

Deletados `pages/api/attachments/[attachmentId].ts` e todo o diretório `pages/api/attachments/`. As rotas `POST/PATCH/DELETE /api/attachments/*` não existem mais.

`PUT /api/actives/update` e `POST /api/actives/create` aceitam `fileAlias` no payload (já incluído via spread de `formData`), gravando diretamente na coluna `Active.fileAlias`.

#### D. UI

- `FileUpload`: o `alias` digitado é enviado junto com a `url` via `onChange(items: { url: string; alias?: string }[])`. Prop opcional `onRename` dispara o modal de edição.
- `activeForm`: separa os itens em `formData.fileUrl` (string[]) e `formData.fileAlias` (string[], paralelo por índice). Passes `onRename` ao `FileUpload` que abre o `RenameAttachmentDialog`. Estados `renameModalOpen` e `renameAttachment` controlam o modal. `handleRenameSave` atualiza o `fileAlias` no índice correto.
- `ItemDetailModal`: exibe `fileAlias` como texto do link (mantém extensão). Se não houver alias para aquele índice, mostra o nome derivado da URL via `getFileDetails`.
- `RenameAttachmentDialog`: componente dedicado com input pré-preenchido, botões Salvar/Cancelar, estado de loading.
- Botão de edição de alias (SquarePen): disponível no `FileUpload` quando `onRename` é fornecido; abre o `RenameAttachmentDialog` existente.

#### E. Utilitário `parseFileAliases` (`lib/mediaReferences.ts`)

Nova função pura que lê `fileAlias` nos mesmos dois formatos legados (JSON array ou CSV) e devolve a lista de aliases, paralela às URLs. Segue o mesmo padrão de `parseFileUrls`.

### Por que esta abordagem

- ✅ **Simplicidade drástica**: elimina tabela separada, relacionamento Prisma, 3 rotas de API dedicadas, estado de `id` de anexo, sincronização local/banco.
- ✅ **Zero dependência de `id` retornado**: o alias grava na mesma linha do ativo, no mesmo `PUT`/`POST` que já salva o ativo. Não há chamada sequencial extra.
- ✅ **Compatibilidade total**: `fileUrl` permanece inalterado; `fileAlias` é opcional; registros existentes continuam funcionando.
- ✅ **Localidade**: o alias vive na mesma linha do `fileUrl` no banco; a UI lê e grava no mesmo lugar.
- ✅ **Leverage**: uma mudança no esquema (adicionar coluna) resolve o problema em toda a cadeia (API → UI → banco).

### Contras / trade-offs

- ⚠️ **Contradiz ADR-006**: ADR-006 decidiu criar tabela separada para evitar alterar `Active`. Esta ADR reverte essa decisão, adicionando uma coluna a `Active` e removendo o modelo `Attachment`. Justificada pela falha de persistência observada na prática e pelo fato de a versão não ter entrado em produção.
- ⚠️ **Alias por índice**: `fileAlias` é um array paralelo a `fileUrl` por índice. Se o usuário tiver 3 URLs e der alias só para a primeira, os outros dois índices ficam vazios. Isso é aceitável para o caso de uso atual.

### Backward compatibility

- `Active.fileUrl` continua inalterado (formato JSON array ou CSV).
- `fileAlias` é nullable; registros existentes têm `null`.
- A tabela `Attachment` foi removida do schema (não havia dados em produção).

### Status

Aceito e implementado. Arquivos modificados:

1. `prisma/schema.prisma` — removido modelo `Attachment`, adicionado `fileAlias` ao `Active`
2. `prisma/migrations/20261113000000_add_file_alias_to_active/migration.sql` — migration para adicionar coluna `fileAlias` à tabela `Active` (precisa ser executada no banco)
3. `types/inventory.ts` — removida interface `Attachment`, adicionado `fileAlias` a `Active` e `InventoryItem`
4. `pages/api/attachments/[attachmentId].ts` — deletado
5. `pages/api/actives/[activeId]/attachments.ts` — deletado
6. `pages/api/actives/create.ts` — atualizado para gravar `fileAlias` na criação
7. `pages/api/actives/update.ts` — atualizado para gravar `fileAlias` na atualização
8. `lib/mediaReferences.ts` — adicionada função `parseFileAliases`
9. `components/FileUpload.tsx` — `onChange` envia `{ url, alias }[]`; prop `onRename` opcional
10. `components/actives/activeForm.tsx` — `fileAlias` no estado e payload; `onRename` no FileUpload; `handleRenameSave`; renderização do `RenameAttachmentDialog`
11. `components/list/ItemDetailModal.tsx` — exibe `fileAlias` paralelo a `fileUrl`; removido `useEffect` de busca de attachments
12. `components/list/RenameAttachmentDialog.tsx` — modal dedicado para editar alias
13. `__tests__/lib/attachments.test.ts` — deletado

Verificado: `tsc --noEmit` (0), `eslint` (0), `vitest` (398 testes passando).

**Ação necessária:** Executar a migration no banco de produção antes de deploy:
```bash
npx prisma migrate deploy
```
Ou aplicar manualmente:
```sql
ALTER TABLE \`Active\` ADD COLUMN \`fileAlias\` TEXT NULL;
```
