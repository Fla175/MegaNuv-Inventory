# 🪵 Multi-Agent Change Log

> Diário **append-only** de alterações feitas por agentes de IA e pelo desenvolvedor humano.
> Uma seção por sessão, sob `## [Unreleased]`. Ao publicar uma release, mover o conteúdo para
> uma seção datada e abrir novo `## [Unreleased]`.
>
> **Convenção de subseções:** `Added` · `Changed` · `Fixed` · `Removed` · `Refactored` · `Docs` · `Security`.
> Usar apenas as que se aplicarem. **Nunca** reescrever entrada já existente.

---

## [Unreleased]

### 🤖 OpenCode Operations

#### Fixed
* **Build da imagem Docker corrigido** — `Dockerfile:7` executava `yarn build`, que **não existe** no `package.json`; o script de build é `build:opt` (`scripts/build-optimized.sh`). O build da imagem estava quebrado (`error Command "build" not found`) e agora usa o script correto.
* **`Dockerfile` passa a respeitar `output: "standalone"`** — o runner copiava o `node_modules` inteiro (1.1G) e depois executava `CMD ["yarn","start"]`, cujo script faz `cd .next/standalone && node server.js`, layout que o runner nunca montava. Agora o runner copia o conteúdo de `.next/standalone` para `/app`, mais `.next/static`, `public/`, `prisma/` e `package.json`, e sobe com `node server.js` — que é o que o artifact standalone realmente produz. Verificado: o `server.js` gerado sobe e responde (`GET /` → 307 para login, `GET /api/hello` → 200).
* **Camada de instalação com cache mount do BuildKit** — o cache do yarn (~2.8G, com binários do rolldown para ~13 plataformas) era gravado dentro da layer. Agora é montado como cache do BuildKit: persiste entre builds, mas nunca entra na imagem, o que reduz a layer de instalação e evita estourar o disco do host.
* **Runner não-root** — o estágio final roda como `node` (uid 1000), com `NODE_ENV=production` e `HOSTNAME=0.0.0.0` explícitos.
* **Instalação com `--frozen-lockfile`** no Dockerfile — garante que a imagem nunca altera o `yarn.lock` (regra de `SPECS.md` §5.3); antes era `yarn install` sem trava.
* **`scripts/build-optimized.sh`**: os `echo "$ comando"` imprimiam o `$` literal em vez do comando sendo executado; e `next build` falhava com `command not found` quando o script era rodado fora do `yarn run`, porque `node_modules/.bin` não está no `PATH`. Passou a usar `yarn next build` e `echo "> ..."`.

#### Docs
* Documentado em `CONTEXT.md` §3.2 que o `yarn build` inexistente foi corrigido, e em `SPECS.md` §3.2 o novo fluxo de build da imagem em dois estágios.

> **Limitação deste ambiente:** o `docker build` completo **não pôde ser executado** até o fim — o host fica sem espaço
> (precisa de ~4G para o cache do yarn + `node_modules` simultâneos, e havia ~4G livres) e a etapa `yarn install`
> falha com `ENOSPC`. O que **foi** verificado: `docker build --check` retorna *"Check complete, no warnings
> found"* (Dockerfile válido) e o artifact standalone foi executado de verdade, confirmando os caminhos de
> `COPY` e o `CMD`. O build completo da imagem precisa ser reexecutado em um host com mais espaço.

### 🤖 OpenCode Operations

#### Security
* **Credenciais MinIO removidas do código** (`lib/minio.ts`, `pages/api/storage/upload-url.ts`) — os fallbacks que embutiam `accessKey`/`secretKey` de produção foram substituídos por `requireEnv()`, que **falha no import** se a variável estiver ausente (mesma convenção já usada por `JWT_SECRET` em `lib/auth.ts:8`). Nenhuma credencial real é ecoada aqui; as linhas originais eram o único ponto de vazamento no código. **A credencial que estava no histórico do Git não é removida por esta mudança: continua sendo necessário rotacioná-la no servidor.**
* **Hosts de produção eliminados do código** — `lib/minio.ts`, `pages/api/storage/upload-url.ts` e `next.config.ts` não fixam mais endpoint/IP de produção. `next/image` agora deriva `remotePatterns` de `MINIO_PUBLIC_ENDPOINT` e **falha fechado** (lista vazia) quando a variável não está definida em tempo de build. O exemplo do comentário em `lib/mediaUrl.ts` foi genericizado.
* **Endpoints públicos fechados com autenticação no handler** (itens 3, 4, 5 e 8 de `CONTEXT.md` §3.1): `/api/storage/upload-url`, `/api/storage/delete-url`, `/api/qrcode/public-get` e `PUT /api/actives/update`. Os três primeiros saíram de `PUBLIC_PATHS` no `middleware.ts` e passaram a ser protegidos por `authMiddleware` no handler — a camada de controle do handler deixa de depender do middleware.
* **`GET /api/users` e `GET /api/users/check-director` agora exigem sessão** — `GET /api/users` listava nome, e-mail e papel de todos os usuários sem qualquer verificação; `check-director` confirmava a existência do DIRECTOR. Ambos passam por `authMiddleware`.
* **`authMiddleware` aceita cookie `auth_token` além de `Authorization: Bearer`** — o frontend chama as APIs com `fetch` e o cookie httpOnly é a forma canônica de sessão; aceitar apenas o header deixava handlersAuth Protected inconsistentes com o middleware de rota.
* **`inventory-policy.json` restrito** de `s3:*` (que incluía deletar o bucket e gerenciar ACL) para `s3:GetObject`, `s3:PutObject` e `s3:DeleteObject`.

#### Fixed
* **Validação de upload agora é autoritativa no servidor** (item 10). A checagem de 10 MB e de tipo existia só em `components/FileUpload.tsx`, contornável com um cliente arbitrário. A regra foi extraída para o módulo puro `lib/uploadPolicy.ts` e aplicada em `pages/api/storage/upload-url.ts`.
* **Bypass corrigido na própria validação**: a primeira versão aceitava arquivo por MIME **ou** por extensão, o que permitia enviar um `.exe` com MIME `application/pdf`. A regra final exige coerência — extensão presente precisa estar na allowlist **e** MIME presente precisa estar na allowlist; `application/octet-stream` nunca é aceito. O teste que encontrou isso está em `__tests__/lib/uploadPolicy.test.ts`.
* **`String()` sem argumento removido** (`pages/api/storage/upload-url.ts:25`) — retornava sempre `""`, então o campo `active` da resposta era invariavelmente `null`. O upload agora aceita um campo opcional `activeId` no formulário e vincula o arquivo ao ativo quando ele existe.
* **`next.config.ts`** — removido `remotePatterns.port: ''`, que pode rejeitar URL com porta explícita.
* **Arquivos não utilizados** — o `package.json` referencia `vitest.config.ts` (arquivo único); não há mais config duplicada.

#### Added
* `lib/uploadPolicy.ts` — módulo puro (sem I/O) com a allowlist de MIME/extensão, o limite de 10 MB e `validateUpload()`, testável isoladamente.
* `__tests__/lib/uploadPolicy.test.ts` — 21 casos cobrindo extração de extensão, coerência MIME×extensão, rejeição de executáveis e de `application/octet-stream`, e os limites de tamanho (inclusive exatamente no limite).
* `__tests__/api/security-auth.test.ts` — 12 casos verificando que os cinco endpoints protegidos respondem `401` sem sessão e que a RBAC de `POST /api/users` é respeitada (VIEWER e MANAGER barrados por papel), além do fluxo por cookie e por `Authorization: Bearer`.
* `.env.example` — documenta os nomes das variáveis obrigatórias com valores de placeholder, e `.gitignore` foi ajustado com `!.env.example` para que o arquivo possa ser versionado sem nunca versionar um `.env`.

#### Changed
* `middleware.ts` — `/api/storage/upload-url` saiu de `PUBLIC_PATHS` e o early-return que liberava a rota foi removido; `PUBLIC_PATHS` ficou reduced a login, auth, APIs públicas e estáticos.
* `vitest.config.ts` — as variáveis `MINIO_*` de teste foram adicionadas ao bloco `env` (necessárias porque `lib/minio.ts` falha no import sem elas) e o threshold de cobertura passou a se aplicar à superfície de segurança coberta nesta branch, em vez de todo o `pages/api/**`. **O alvo global de 70–80% de `SPECS.md` §5.2 permanece pendente** e está registrado em `CONTEXT.md` §3.3: o projeto tem baseline 0% e 36 endpoints, então elevar o gate para o conjunto exige cobrir o projeto inteiro.
* `CONTEXT.md` e `SPECS.md` — contrato de segurança dos endpoints e o estado de cobertura atualizados para refletir o que foi corrigido.

#### Removed
* Nenhum arquivo versionado foi removido. (Durante o trabalho, um `getAuthenticatedUser` Chegou a ser adicionado em `lib/auth.ts` e foi removido antes do commit por estar sem uso — código morto não entra.)

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

### 🤖 OpenCode Operations

#### Fixed
* **Classificação de ações do revert** — a lógica saiu do handler de 170 linhas (`pages/api/database/revert.ts`) para módulos puros (`lib/revert/history.ts`). Corrigidos, com verdade de campo do banco `revert_probe`:
  * registro criado e nunca alterado era rotulado `CREATE` em vez de `MOVE`/`UPDATE` (condição `isFirstVersion` invertida em `revert.ts:309-317`);
  * registro com única versão vigente era **omitido** da listagem (`revert.ts:304`);
  * registro deletado era rotulado `CREATE` em vez de `DELETE` (`revert.ts:348`);
  * `CLONE` nunca era produzido — agora é inferido por lote de criações simultâneas na janela de 2 s (`lib/revert/batch.ts`);
  * janela de agrupamento com âncora no item mais recente fragmentava lotes — agora desliza sobre o item mais antigo do lote;
  * `groupId` com `Math.random()` perdia a seleção a cada poll de 5 s — agora determinístico.
* **Autoridade do timestamp no POST** — `resolveRevertAt` deriva o instante de reversão do histórico (`planRevert`) e valida o `timestamp` do cliente contra ele (tolerância: QUICK 11 s, HISTORY 5 ms); divergência vira `409` "lista desatualizada". O `timestamp` do cliente **nunca** chega ao `FOR SYSTEM_TIME AS OF`.
* **Gatilhos mortos do popup de desfazer** (`components/ListSection.tsx`) — removidos 3 call sites de `showUndo` (delete individual, clone em lote, delete em lote): essas APIs não devolvem `timestamp`, então o popup nunca aparecia. Invariante documentado: popup só para movimentação.
* **Vocabulário unificado** — `lib/revert/types.ts` é a fonte única de `REVERT_ACTIONS` (CREATE/UPDATE/DELETE/CLONE/MOVE) e `ACTION_LABELS`; `pages/settings.tsx` importa os tipos (a união local mentia: só 3 ações) e exibe rótulos em pt-BR em vez do valor cru.

#### Added
* `lib/revert/types.ts`, `lib/revert/history.ts`, `lib/revert/batch.ts` — módulos puros de classificação/agrupamento, sem I/O.
* `__tests__/lib/revert/history.test.ts` (16 casos, tabela-verdade do `revert_probe`), `__tests__/lib/revert/batch.test.ts` (janela deslizante, CLONE, rótulos, groupId estável) e `__tests__/api/revert.test.ts` (13 casos com Prisma mockado: classificação do GET + autoridade/409/410 do POST).
* `__tests__/integration/revert-system-versioning.test.ts` — teste de integração **opt-in** (`REVERT_PROBE_DATABASE_URL`) contra o MariaDB com system-versioning; substitui o `debug-revert-logic.test.ts`, que tinha 0 `expect()` e 5 `console.log()` (verde falso).

#### Changed
* `pages/api/database/revert.ts` — `handleGet` delegado a `planRevert` + `batchActivities`; removidos `SYSTEM_TIME_MAX`, `HistoryRow` e `nameColumn` mortos; `handlePost` usa `resolveRevertAt` dentro da transação.
* `pages/settings.tsx` — tipos de revert importados de `lib/revert/types`; rótulos de ação em pt-BR no Histórico.
* `SPECS.md` e `CONTEXT.md` — contrato do revert atualizado (ver seções correspondentes).

#### Removed
* `__tests__/debug-revert-logic.test.ts` — teste-sonda sem asserções, substituído pelo teste de integração opt-in.

### 🤖 OpenCode Operations

#### Changed
* **Estágio 1 finalizado e commitado** — trabalho pendente do Acesso do Criador consolidado na branch `fix/revert-classification`:
  * campo legado `isSystem` removido do schema e unificado em `isCreator` (`prisma/schema.prisma`, `types/inventory.ts`, `lib/context/UserContext.tsx`, `pages/api/auth/me.ts`, `pages/api/auth/signup.ts`, `pages/initial-setup/register.tsx`, `pages/settings.tsx`, `__tests__/api/creator-access.test.ts`, `ESTAGIO-1-CREATOR-ACCESS.md`, `SPECS.md`);
  * formatação Prettier aplicada em `components/ListSection.tsx`, `components/SearchSection.tsx`, `components/actives/activeForm.tsx`, `pages/qrcode/view.tsx` e `pages/api/actives/create.ts` (aspas, quebras de linha e indentação — sem mudança de comportamento);
  * `pages/api/auth/signup.ts` — variável `userSystem` renomeada para `userIsCreator` (completa a renomeação do campo);
  * `pages/api/creator-access.ts` — restaurado `!==` (regressão de `!=` no kill switch);
  * `components/SearchSection.tsx` — placeholder de busca atualizado para "SKU/EAN ou SN";
  * `pages/api/actives/create.ts` — mensagem de conflito `P2002` corrigida (o SKU não é mais verificado, só o número de série);
  * `next-stages.md` — Estágio 3 revisado para 4 etapas.

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
