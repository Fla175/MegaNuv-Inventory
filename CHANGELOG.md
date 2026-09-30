# 🪵 Multi-Agent Change Log

> Diário **append-only** de alterações feitas por agentes de IA e pelo desenvolvedor humano.
> Uma seção por sessão, sob `## [Unreleased]`. Ao publicar uma release, mover o conteúdo para
> uma seção datada e abrir novo `## [Unreleased]`.
>
> **Convenção de subseções:** `Added` · `Changed` · `Fixed` · `Removed` · `Refactored` · `Docs` · `Security`.
> Usar apenas as que se aplicarem. **Nunca** reescrever entrada já existente.

---

## [Unreleased]

### 🤖 Antigravity Operations

#### Added
* `pages/api/creator-access.ts` — API dedicada para Acesso do Criador com 3 rotas: `POST` (entrar na conta alvo, emitindo token de impersonação de 2h e gravando stash httpOnly `auth_token_creator` de 8h), `DELETE` (restaurar sessão do criador trocando os cookies de volta) e `PATCH` (transferir título de criador com atualização transacional serializável).
* `prisma/migrations/20260930193000_add_is_creator/migration.sql` — migration append-only adicionando coluna `isCreator TINYINT(1) NOT NULL DEFAULT FALSE` no model `User`.
* `vitest.config.ts`, `__tests__/lib/auth.test.ts` e `__tests__/api/creator-access.test.ts` — infraestrutura de testes unitários e de integração com Vitest cobrindo 25 casos (RBAC, kill switch, guards de input, blindagem de endpoints de usuários, transferência de título, emissão e restauração de cookies, e sinalização de sessão).

#### Changed
* `lib/auth.ts` — expandida a função `generateAuthToken` para aceitar parâmetro opcional `expiresIn` (padrão `'8h'`) e encadear `.setIssuedAt()`.
* `pages/api/auth/logout.ts` — atualizado o logout para limpar simultaneamente os dois cookies: `auth_token` e `auth_token_creator` (prevenindo vazamento de sessão de criador no stash).
* `pages/api/auth/me.ts` — incluído `isCreator` na consulta do usuário e adicionado o objeto `impersonation` (`{ active: true, creatorName }`) na resposta quando o cookie stash `auth_token_creator` estiver presente.
* `lib/context/UserContext.tsx` — adicionados `isCreator` ao tipo `User`, estado `impersonation` e a função `restoreCreatorSession` exposta pelo contexto.
* `components/Layout.tsx` — adicionada a faixa superior de aviso de impersonação ("Sessão de X · você está como Y") com botão "Voltar à minha conta".
* `pages/settings.tsx` — adicionados o botão "Entrar" (para a conta de qualquer usuário sem senha) e o botão "Ceder" (para transferir o título de criador com modal de confirmação por digitação) nos cartões de membros.
* `package.json` — adicionado script `"test": "vitest run"` e dependências de dev `vitest`, `@vitest/coverage-v8` e `vite`.
* `next-stages.md` — marcado o Estágio 1 como concluído.

### 🤖 OpenCode Operations

#### Added
* `opencode.json` — configuração local do OpenCode: `project.id: meganuv-inventory`, `root: ./`, watcher com `ignore: [".vscode"]` e `include: [pages/, components/, lib/, types/]`, e `mcp.local-servers` com `git` (`uvx mcp-server-git`) e `mariadb` (`@modelcontextprotocol/server-postgres` sobre `${DATABASE_URL}`, uso somente leitura).
* `AGENTS.md` — documento de entrada único multi-IA: ordem de leitura obrigatória, identificação do projeto, repositório de documentos, regras transversais de segredos/git/escopo, gates de qualidade, fluxo padrão de trabalho e índice de anti-padrões.
* `OPENCODE.md` — regras locais do OpenCode: papel do sistema, restrições invioláveis, comandos de CLI permitidos e proibidos, fluxo com gates, padrões de saída e registro, e referência de arquivos sensíveis.
* `SPECS.md` — contrato técnico verificável em 5 seções: domínio e bounded contexts, stack e limites estruturais, arquitetura e regras de grafo de dependência, modelos de dados e contratos de API, e DoD (segurança, estratégia de testes, pipeline de validação).
* `CONTEXT.md` — estado atual do projeto: propósito, foco da sessão, débitos conhecidos classificados em P0/P1/P2, estado do working tree e convenção de versionamento.
* `CHANGELOG.md` — este diário.
* Worktree isolado criado: `/tmp/opencode/inventory-p0` na branch `chore/security-p0-debt`, a partir de `inventory-v2.22.6` (commit `531a2f9`), destinado às correções de segurança P0. **Nenhuma correção implementada ainda** — worktree limpo.

#### Docs
* Documentada a dívida técnica existente como base factual, sem alterar nenhum arquivo de aplicação:
  * **P0 (12 itens)** — credenciais MinIO hardcoded (`lib/minio.ts:9-10,18-19`, `pages/api/storage/upload-url.ts:14-15`), hosts de produção no código, 3 endpoints públicos sem auth (`/api/storage/upload-url`, `/api/storage/delete-url`, `/api/qrcode/public-get`), `GET /api/users` e `GET /api/users/check-director` sem auth, `PUT /api/actives/update` sem auth no handler, policy MinIO com `s3:*`, validação de upload só no cliente, logout sem revogação de token e segredos no histórico do Git.
  * **P1 (9 itens)** — `Dockerfile:7` executa `yarn build`, que não existe no `package.json` (build Docker quebrado); `package-lock.json` não rastreado e `yarn.lock` modificado; `String()` sem argumento em `upload-url.ts:25`; `echo "$ …"` em `scripts/build-optimized.sh`; `remotePatterns.port: ''` em `next.config.ts:22`; JSON inválido em `.vscode/settings.json:8`; `/qrcode` em `PUBLIC_PATHS` sem página correspondente; shield de setup inicial comentado em `middleware.ts:41-59`; `next lint` depreciado.
  * **P2 (15 itens)** — 0% de cobertura de testes, ausência de CI, verificação de JWT replicada em ~22 arquivos, `components/ListSection.tsx` com 1.927 linhas, 12 dependências órfãs, espaço de IDs de 4 chars hex, variáveis de ambiente mortas/ausentes, `tsconfig.json` permissivo, `content` do Tailwind incompleto, inconsistências de schema e `README.md` desatualizado.
* Adotadas as decisões do usuário em 25/09/2026: `project.id` = `meganuv-inventory`; gerenciador oficial **Yarn 1**; IA **pode commitar em branch própria** (nunca `push`/`tag`/`main`/branch de versão); versionamento por **branch dedicada** `inventory-vX.Y.Z`; DoD **estrita desde já** (testes e CI obrigatórios, apesar da dívida atual); dívida de segurança **documentada + worktree isolado** (não bloqueadora dura de release).

### 👤 Manual Developer Changes

#### Refactored
* Nenhuma alteração manual do desenvolvedor registrada nesta sessão.

---

## - Initial Setup

### System
* **MegaNuv Inventory** — sistema interno de gestão de inventário de ativos da empresa MegaNuv.
* **Nome / slug / versão:** `inventory-meganuv` · `meganuv-inventory` · `2.22.6` (`package.json:3`, exposta via `lib/version.ts`).
* **Repositório:** `Fla175/MegaNuv-Inventory` · **Branch corrente:** `inventory-v2.22.6` · **Último commit:** `531a2f9`.
* **Stack:** Next.js 15.3.3 (Pages Router) · React 19.1.0 · TypeScript 5.9.3 (strict) · Tailwind CSS 4.1.11 · Prisma 6.18.0 + MariaDB · MinIO 8 (S3) · `jose` (JWT HS256) · `bcryptjs` · `formidable` · `lucide-react` · `react-qr-code` · `react-number-format`.
* **Banco:** datasource `provider = "mysql"`, **system-versioning do MariaDB obrigatório** para o recurso de revert. 6 models (`User`, `Movement`, `Category`, `Log`, `FatherSpace`, `Active`) e 2 enums (`UserRole`, `Theme`). 16 migrations aplicadas entre 12/01/2026 e 30/05/2026 — imutáveis.
* **Superfície da aplicação:** 36 endpoints em `pages/api/**`, 7 rotas de página, 12 componentes, 13 arquivos em `lib/`, ~10.300 linhas de código.
* **Funcionalidades:** hierarquia recursiva de espaços e ativos · movimentação com histórico (`Movement`) · 5 papéis de acesso (`DIRECTOR`/`ADMIN`/`MANAGER`/`VIEWER`) · upload de até 5 arquivos por ativo (10 MB) · etiquetas com QR Code · dashboard com agregados · auditoria em log imutável · **revert temporal** (`QUICK` em 10 s e `HISTORY`) · tema light/dark/system persistido por usuário.
* **Infra:** `compose.yml` com serviço `app` (Next, `192.168.20.2:3000`) e `banco` (MariaDB, `192.168.20.3`) na rede interna `192.168.20.0/24`; `Dockerfile` de 2 estágios em `node:22-alpine` com `output: "standalone"`; MinIO externo ao compose.
* **Estado de qualidade no início do setup multi-IA:** `yarn lint` ✅ · `npx tsc --noEmit` ✅ · `yarn build:opt` ✅ · **testes ❌ (0%, sem runner)** · **CI ❌ (ausente)**.
