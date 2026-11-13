# GLOSSARY.md — MegaNuv Inventory

Vocabulário de domínio usado nas ADRs, decisões de arquitetura e revisões de código. Atualize aqui sempre que um termo for nomeado, afinado ou rejeitado.

## Conceitos

**Ativo** (`Active`) — Item do inventário (equipamento, espaço físico, container). Vive em hierarquia recursiva (`FatherSpace` → `Active` → `Active`). Possui `fileUrl` (texto, formato JSON array ou CSV de URLs do MinIO) para anexos legados.

**Anexo** (`Attachment`) — Registro da tabela `Attachment` que associa um `alias` (nome amigável) a um `fileUrl` de um ativo específico. Um ativo pode ter vários anexos. Cada anexo tem seu próprio alias, exibido ao usuário como texto do link do documento.

**Alias** — Nome amigável dado a um anexo para identificação na UI. Substitui ou complementa o nome do arquivo derivado da URL. Só MANAGER, ADMIN e DIRECTOR podem criar/renomear aliases; VIEWER só visualiza.

**Alias de upload** — Alias informado no momento de enviar um novo documento via `FileUpload`. É persistido junto com a URL na tabela `Attachment` através de `POST /api/actives/[activeId]/attachments`.

**Renomear anexo** — Ação de atualizar o `alias` de um `Attachment` existente via `PATCH /api/attachments/[attachmentId]`. Gate de RBAC: MANAGER/ADMIN/DIRECTOR.

**fileUrl legado** — Coluna `Active.fileUrl` (TEXT) que armazena URLs de documentos em formato JSON array ou CSV. Mantido para compatibilidade total; não é alterado pela funcionalidade de aliases. Lido por `parseFileUrls()` em `lib/mediaReferences.ts`.

**parseFileUrls()** — Função pura em `lib/mediaReferences.ts` que lê os dois formatos legados de `fileUrl` (JSON/CSV). Cópia única no códigobase; consumida pelo QR Code e auditoria de órfãos.

**RBAC** — Controle de acesso baseado em papel com quatro níveis: `DIRECTOR`, `ADMIN`, `MANAGER`, `VIEWER`. A matriz canônica está em `ADR/ADR-002.md`. Predicados puros vivem em `lib/apiAuth.ts` (`isViewer`, `isPrivileged`, `canViewValue`).

**authMiddleware** — Wrapper de handler de API em `lib/middlewares/authMiddleware.ts` que verifica sessão (cookie `auth_token` ou header Bearer) e, opcionalmente, papéis exigidos (`requiredRoles`).

**MinIO** — Armazenamento de objetos externo (S3) onde os arquivos físicos dos anexos vivem. A URL do MinIO é reescrita para proxy local autenticado via `lib/mediaUrl.ts` (`toLocalMediaUrl`, `getMinioKeyFromUrl`).

## Notas

- Não existe `GLOSSARY.md` antes desta versão. Crie termos aqui quando um novo módulo profundo for nomeado durante a grilling loop, para que futuras revisões de arquitetura usem os mesmos termos.
