# SPECS.md — Contrato Técnico do Projeto

> Documento canônico e **verificável** do MegaNuv Inventory.
> Toda regra aqui deve ser conferível por comando, arquivo ou linha de código.
> Se o código divergir deste documento, ou o documento divergir do código: **o código é o fato, o documento é a dívida** — corrija um dos dois no mesmo commit.

---

## 1. System Domain & Boundaries — Domínio e Fronteiras do Sistema

### 1.1 Core Purpose

Sistema interno de **gestão de inventário de ativos físicos** da empresa MegaNuv.
Permite cadastrar ativos (equipamentos, espaços físicos, containers), organizá-los em uma
**hierarquia recursiva de espaços** (`FatherSpace` → `Active` filho → `Active` filho), localizá-los
fisicamente, Controlar **movimentações** entre locais, anexar arquivos/imagens em **MinIO (S3)**,
imprimir **etiquetas com QR Code** e **reverter alterações** usando *system-versioning* do MariaDB.

Não é: ERP, sistema financeiro (só armazena `fixedValue` como número), ou CRM.

### 1.2 Domain Boundaries (Bounded Contexts)

| Contexto | Responsabilidade | Código |
|---|---|---|
| **Identidade & Acesso** | Login, JWT, papéis (RBAC de 4 níveis), tema, bootstrap do 1º ADMIN | `pages/api/auth/**`, `lib/auth.ts`, `lib/middlewares/authMiddleware.ts`, `pages/login.tsx`, `pages/initial-setup/` |
| **Inventário** | CRUD de ativos, clonagem em lote, movimentação, "alterar ativos semelhantes" | `pages/api/actives/**`, `components/actives/activeForm.tsx` |
| **Espaços** | CRUD de `FatherSpace` e da hierarquia de locais | `pages/api/father-spaces/**`, `components/AddLocationModal.tsx` |
| **Taxonomia** | Categorias (ex-"Áreas") com paleta de 18 cores persistidas | `pages/api/categories/**`, `lib/constants/colors.ts` |
| **Armazenamento de Mídia** | Upload multipart → MinIO, presigned URL, proxy autenticado, exclusão | `pages/api/storage/**`, `lib/minio.ts`, `lib/mediaUrl.ts` |
| **Auditoria** | Log imutável de CRUD, logins e signups | `lib/logger.ts`, `pages/api/logs/**`, model `Log` |
| **Realtime do Banco** | Reversão temporal de alterações via *system-versioning* | `pages/api/database/revert.ts` |
| **Apresentação** | Dashboard, listagem, busca, modais, impressão, context menu, toasts | `pages/*.tsx`, `components/**`, `lib/context/**` |
| **Plataforma** | Roteamento protegido, config de build, estilo global | `middleware.ts`, `next.config.ts`, `styles/globals.css` |

**Fronteiras invioláveis:**
- Nenhum componente React importa de `pages/api/**` (só via `fetch`).
- Nenhuma página `pages/*.tsx` importa de outro `pages/*.tsx` (exceto `_app`/`_document`).
- `lib/` nunca importa de `pages/` nem de `components/`.
- Camada de dados só é alcançada via o singleton `db` de `lib/prisma.ts`.

---

## 2. Technology Stack & Environment Constraints — Stack e Restrições

### 2.1 Runtime, Languages & Ecosystem

| Item | Versão | Fonte da verdade |
|---|---|---|
| Node.js | `v22.20.0` (alpine no Docker) | `Dockerfile:2,12` |
| TypeScript | `5.9.3`, `strict: true` | `tsconfig.json:7` |
| Target / Lib | `ES2017` / `["dom","dom.iterable","esnext"]` | `tsconfig.json:2,4` |
| Module resolution | `bundler` | `tsconfig.json:11` |
| Path alias | `@/*` → `./*` (raiz, não `src/`) | `tsconfig.json:16-18` |
| Gerenciador | **Yarn 1** (`yarn.lock` rastreado) | `package.json`, `yarn.lock` |
| Gerenciador proibido | `npm` — `package-lock.json` é artefato acidental | `AGENTS.md` §3.3 |
| Módulos | **CommonJS** (sem campo `type` em `package.json`) | `package.json` |

### 2.2 Frameworks & Hard Dependencies

**Usadas (obrigatórias):**

| Pacote | Versão | Papel |
|---|---|---|
| `next` | `15.3.3` (fixo) | Framework, **Pages Router** |
| `react` / `react-dom` | `^19.0.0` (instalado 19.1.0) | UI |
| `@prisma/client` | `6.18.0` (fixo) | ORM |
| `prisma` (dev) | `^6.18.0` | CLI de migrations |
| `tailwindcss` + `@tailwindcss/postcss` | `^4` (instalado 4.1.11) | Estilos, config CSS-first |
| `@tailwindcss/container-queries` | `^0.1.1` | Plugin de container queries |
| `jose` | `^6.1.0` | JWT HS256 (`sign`/`verify`) — **única lib de auth real** |
| `bcryptjs` | `^3.0.3` | Hash de senha (10 rounds) |
| `minio` | `^8.0.6` | Cliente S3 para MinIO |
| `formidable` | `^3.5.4` | Parse multipart do upload |
| `lucide-react` | `^0.525.0` | Ícones |
| `react-qr-code` | `^2.0.18` | Render de QR Code |
| `react-number-format` | `^5.4.5` | Máscara numérica em `/settings` |
| `cookie` | `^1.0.2` | `serialize()` do cookie de sessão |
| `eslint` + `eslint-config-next` | `^9` / `15.3.3` | Flat config via `FlatCompat` |

**Declaradas e NUNCA importadas (12) — remover sob escopo próprio:**

`recharts` · `framer-motion` · `react-rnd` · `@headlessui/react` · `axios` · `jsonwebtoken` ·
`js-cookie` · `jwt-decode` · `eruda` · `uuid` · `qrcode.react` · (`@types/js-cookie`, `@types/jsonwebtoken`, `@types/react-rnd`)

**Ausentes e necessárias para a DoD §5.2:** `vitest`, `@vitest/coverage-v8`, `@testing-library/react`,
`@testing-library/user-event`, `playwright`/`@playwright/test`, `prettier`.

**Infra:** MariaDB (dialect `mysql` do Prisma) com **system-versioning** obrigatório ·
MinIO externo ao compose · `output: "standalone"` no Next.

### 2.3 Structural Limits

| Limite | Valor | Onde |
|---|---|---|
| Tamanho de upload | **10 MB** por arquivo (validado **só no cliente**) | `components/FileUpload.tsx:134` |
| Arquivos por ativo | até **5** | `components/FileUpload.tsx:54` |
| Validade do JWT | **8 h**, sem refresh token | `lib/auth.ts:43-58` |
| Validade da presigned URL | **1 h** | `pages/api/qrcode/public-get.ts` |
| Logs listados | `take: 200` | `pages/api/logs/list` |
| Itens do dashboard | 20 recentes / 20 movimentos | `pages/api/dashboard/stats` |
| Janela do Revert `QUICK` | **10 s** (validada server-side) | `pages/api/database/revert.ts:468-477` |
| `SYSTEM_TIME_MAX` | `2038-01-19 03:14:07.999999` (limite do `ROW_END` do MariaDB) | `pages/api/database/revert.ts:9` |
| Tabelas reversíveis | `Active`, `FatherSpace`, `Category` (whitelist) | `pages/api/database/revert.ts:11-27` |
| Escala do inventário | `Active.id` = 4 chars hex (65.536 combinações) — colisão provável em inventário grande | `lib/prisma.ts:8-24` |
| Tamanho máximo de arquivo de componente | **1.927 linhas** em `components/ListSection.tsx` | — |
| Threads de conexão Prisma | 1 (singleton com hot-reload guard) | `lib/prisma.ts:46-54` |

---

## 3. Architecture & Code Layout — Arquitetura e Layout

### 3.1 Design Patterns & Architectural Style

Estilo: **monólito modular em camadas**, sem `src/`, sem barrel files, sem DI container.
Serverless-first (Pages Router → cada `pages/api/**` é uma função independente).

| Pattern | Aplicação |
|---|---|
| Singleton | `lib/prisma.ts` — guarda em `global.prismaGlobal` para hot-reload |
| Repository implícito | Acessos Prisma ficam no handler; não há camada de repositório |
| Middleware chain | `middleware.ts` (rota) → auth dentro do handler |
| HOC | `lib/middlewares/authMiddleware.ts` — `authMiddleware(handler, requiredRoles?)` |
| Context Provider | `UserContext` (usuário+tema), `ToastContext` (notificações) |
| Hook | `useEscapeKey`, `useMediaQuery` |
| Extension hook | `$extends` com query hook gerando IDs hex em `active.create` e `fatherSpace.create` |
| Anti-corrupção | `lib/mediaUrl.ts` reescreve URL do MinIO → proxy local autenticado |

**Convenção de branch (referenciado em `AGENTS.md` §3.2):**
- Branch de trabalho da IA: `<tipo>/<slug-curto>`, com `<tipo> ∈ {feat, fix, perf, refactor, chore, docs, test}`.
- Branch de release: `inventory-vX.Y.Z` — **proibida para a IA** (ver `CONTEXT.md` §4).

### 3.2 Directory Structure Map

```
/var/code/inventory/
├── opencode.json            # config local do OpenCode (project/watcher/mcp)
├── AGENTS.md                # regras transversais multi-IA
├── OPENCODE.md              # regras locais do OpenCode
├── SPECS.md  CONTEXT.md  CHANGELOG.md
├── middleware.ts            # guarda de rotas (99 L)
├── next.config.ts           # standalone, strict mode, webpack fallback, remotePatterns
├── inventory-policy.json    # policy IAM do usuário MinIO (formato AWS S3 v1)
├── compose.yml              # serviço `app` + `banco` (MariaDB)
├── Dockerfile               # 2 estágios (node:22-alpine)
├── eslint.config.mjs        # flat config: next/core-web-vitals + next/typescript
├── tailwind.config.mjs  postcss.config.mjs  tsconfig.json
├── pages/                   # ← PAGES ROUTER
│   ├── _app.tsx  _document.tsx
│   ├── index.tsx            # Gestão de Ativos
│   ├── dashboard.tsx        # 374 L
│   ├── settings.tsx         # 911 L — abas users|spaces|categories|logs|theme
│   ├── login.tsx  initial-setup/register.tsx  qrcode/view.tsx (504 L)
│   └── api/                 # 36 endpoints .ts
│       ├── actives/  auth/  categories/  dashboard/
│       ├── database/revert.ts (544 L)  father-spaces/
│       ├── internal/  logs/  public/  qrcode/
│       ├── storage/  users/
│       ├── hello.ts  protected.ts
├── components/              # 12 .tsx
│   ├── ListSection.tsx      # 1.927 L ← gargalo
│   ├── Layout.tsx  HeaderSection.tsx  SearchSection.tsx
│   ├── FileUpload.tsx (298 L)  imageUpload.tsx  customSelect.tsx
│   ├── AddLocationModal.tsx
│   ├── actives/activeForm.tsx (659 L)
│   └── ui/  ConfirmDialog.tsx  Toast.tsx  ToastContainer.tsx
├── lib/                     # 13 arquivos — nunca importa de pages/ ou components/
│   ├── prisma.ts  auth.ts  minio.ts  logger.ts
│   ├── mediaUrl.ts  version.ts  types.ts
│   ├── constants/colors.ts  context/  hooks/  middlewares/
├── types/inventory.ts       # tipos de dominio
├── prisma/
│   ├── schema.prisma        # 6 models, 2 enums, 124 L
│   └── migrations/          # 16 migrations, 2026-01-12 → 2026-05-30 (imutáveis)
├── styles/globals.css       # 123 L — @media print p/ etiquetas
├── scripts/build-optimized.sh
└── public/                  # 7 SVG (6 são boilerplate do Next, sem uso)
```

### 3.3 Dependency Graph Rules (What can import what)

```
pages/*.tsx        → components/**  lib/**  types/**  @prisma/client (só tipos)
components/**      → lib/**  types/**  @prisma/client (só tipos)
lib/context/**     → lib/**
lib/**             → @prisma/client  jose  minio  bcryptjs  cookie  formidable
pages/api/**       → lib/**  @prisma/client  jose  bcryptjs  minio  formidable
middleware.ts      → jose  (NÃO importa lib/, exceto se via require dinâmico)
prisma/schema.prisma → (nenhum)
```

**Proibido:**
- `lib/**` → `pages/**` ou `components/**` (inverte a dependência).
- `pages/api/**` → outro `pages/api/**`.
- Import de valor (não só tipo) de `@prisma/client` em componente de UI.
- Import direto de `node:fs`/`node:path` em código que roda no cliente.
- Import de qualquer coisa em `prisma/`.

---

## 4. Data Models & Interface Contracts — Modelos e Contratos

### 4.1 Storage Schema & Entity Relationships

Datasource: `provider = "mysql"` + `url = env("DATABASE_URL")` (MariaDB).

```
User 1──N Active        ("UserToActive",   createdById)
User 1──N FatherSpace   ("UserToSpace",    createdById)
User 1──N Log           ("UserLogs",       userId, opcional)
Category 1──N Active    (categoryId, obrigatório)
FatherSpace 1──N Active (fatherSpaceId, obrigatório)
FatherSpace 1──N FatherSpace  ("SpaceHierarchy", onDelete: Cascade)   ← recursiva
Active 1──N Active           ("ActiveHierarchy", onDelete: Cascade)  ← recursiva
Active 1──N Movement         (onDelete: Cascade)
```

| Model | PK | Campos-chave | Índices |
|---|---|---|---|
| `User` | `id` uuid | `email` @unique, `password`, `name?`, `role`, `theme`, `lastLogin?`, **`isSystem`**, **`isCreator`** | `email` @unique |
| `Movement` | `id` uuid | `activeId` FK, `fromSpaceId?`, `toSpaceId?` (Strings **sem FK** — desnormalizadas para preservar histórico) | — |
| `Category` | `id` uuid | `name` @unique, **`color` @unique nullable**, 18 cores na paleta | `name`, `color` @unique |
| `Log` | `id` uuid | `action`, `details` @db.Text, `ip?`, `userAgent?` @db.Text, `userId?` | `@@index([userId])`, `@@index([action])` |
| `FatherSpace` | `id` String (**sem default**) | `name` @unique, `notes?`, `address?`, `imageUrl?`, `phone?`, `responsible?`, `parentId?`, `createdById?` | `@@index([parentId])`, `@@index([createdById])` |
| `Active` | `id` String (**sem default**) | `name`, **`categoryId` obrigatório**, `sku?`, `manufacturer?`, `model?`, **`serialNumber?` @unique**, `fixedValue` Float, **`fatherSpaceId` obrigatório**, `parentId?`, `isPhysicalSpace`, `tag` @default("IN-STOCK"), `notes?` @db.Text, `imageUrl?`, **`fileUrl?` @db.Text** | `@@index([fatherSpaceId])`, `@@index([parentId])`, `@@index([createdById])`, `@@index([categoryId])` |

**Enums:** `UserRole { DIRECTOR, ADMIN, MANAGER, VIEWER }` · `Theme { DARK, LIGHT, SYSTEM }`

**Invariantes:**
- Exclusão de `FatherSpace` ou `Active` pai faz **cascade** em toda a subárvore. Endpoint de delete **deve** avisar sobre o tamanho da subárvore.
- `fileUrl` é `TEXT` e aceita **dois formatos legados**: JSON array **ou** CSV separado por vírgula. Ler ambos — ver `pages/api/qrcode/public-get.ts:41-52`.
- O frontend envia `serialNumbers[]`, mas **só o primeiro** é persistido (`pages/api/actives/update.ts:44-46,74`). Não assumir array.
- `isSystem: true` marca o **primeiro** ADMIN criado e não pode ser revogado.
- `isCreator: true` marca o único Admin Criador (out-of-band / cessão).
- `Category.color` é @unique e nullable — `null` é permitido em múltiplas categorias (MySQL permite múltiplos NULL em índice único).

### 4.2 API Contracts & Payload Schemas

**Envelope de erro (consistente em todo `pages/api/**`):**

```ts
type ApiError = { error: string };
// status: 400 validação · 401 sem sessão/expirada · 403 RBAC · 404 não encontrado
//         405 método inválido · 409 conflito (serial duplicado) · 500 inesperado
```

**Autenticação:** cookie `auth_token` (httpOnly, `sameSite: lax`, 8 h) **ou** header `Authorization: Bearer <token>`.
Claims: `{ userId, email, role }`. `verifyAuthToken()` em `lib/auth.ts:20-41` é a fonte de verdade.

**RBAC (matriz de referência):**

| Papel | Leitura | CRUD de ativos/espaços/categorias | Gerencia usuários | Vê `fixedValue` | Logs | Revert |
|---|---|---|---|---|---|---|
| `DIRECTOR` | total | sim | todos | sim | sim (inclusive edita/deleta) | sim |
| `ADMIN` | total | sim | exceto DIRECTOR | **não** (só total agregado) | sim | sim |
| `MANAGER` | total | sim | só `VIEWER` | **não** | sim | sim |
| `VIEWER` | total | **não** | não | **não** | não | não |

`DIRECTOR` é o único papel que pode ser criado por `signup` (`pages/api/auth/signup.ts:54-60`).

**Endpoints sensíveis (contrato de segurança — ver §5.1 e `CONTEXT.md` §3):**

| Endpoint | Método | Hoje | Deve ser |
|---|---|---|---|
| `/api/auth/login` | POST | público | público (credenciais) |
| `/api/auth/logout` | POST | público | público (limpa auth_token e auth_token_creator) |
| `/api/auth/me` | GET | privado | privado (retorna user e impersonation) |
| `/api/auth/seed` | GET, POST | público | público (bloqueado se `user.count() > 0`) |
| `/api/auth/signup` | POST | público | público (só cria DIRECTOR) |
| `/api/creator-access` | POST, DELETE, PATCH | privado (criador) | privado (exclusivo do criador) |
| `/api/public/initial-check` | GET | público | público (`requiresSetup: userCount === 0`) |
| `/api/qrcode/public-get` | GET | **PÚBLICO** | público **assinado** ou privado |
| `/api/storage/upload-url` | POST | **PÚBLICO** | **privado** |
| `/api/storage/delete-url` | DELETE | **PÚBLICO** | **privado** |
| `/api/storage/file` | GET | privado | privado (proxy autenticado) |
| `/api/users` | GET | **SEM AUTH no handler** | **privado** |
| `/api/users/check-director` | GET | **SEM AUTH no handler** | privado (ou resposta booleana genérica) |
| `/api/database/revert` | GET, POST | privado, bloqueia VIEWER | privado, bloqueia VIEWER |
| `/api/actives/update` | PUT | **sem auth no handler** | privado (confia só no middleware — frágil) |

**Paginação:** não existe. `list` devolve o conjunto inteiro; `/api/logs/list` limita a 200.
Ao adicionar listagem, **não** quebrar o formato de resposta atual sem versionar.

### 4.3 State Management & Idempotency Rules

**Estado cliente:** React Context API. Sem Redux/Zustand.
- `UserContext` (`lib/context/UserContext.tsx`) — usuário + tema. Aplica `.dark` e `colorScheme` no `<html>`; listener de `prefers-color-scheme`. `useUser()` **lança** se usado fora do provider.
- `ToastContext` (`lib/context/ToastContext.tsx`) — 4 tipos: `success | error | warning | info`.
- `BUILD_DATE` em `lib/version.ts` é calculado **só no cliente** para evitar hydration mismatch.

**Regras de idempotência e concorrência:**

| Regra | Implementação / Status |
|---|---|
| Login→refresh de contexto | Flag `localStorage.setItem("justLoggedIn")` (`lib/context/UserContext.tsx:69-77`) |
| Bootstrap idempotente | `GET /api/internal/ensure-location-item` garante categoria `ESTRUTURA` + `FatherSpace` id `0000` + `Active` id `ffff` |
| Criação do 1º ADMIN | `user.count() > 0` → 403 (`pages/api/auth/seed.ts:28-31`) |
| ID único de `Active`/`FatherSpace` | Loop `randomBytes(2)` + `findUnique` até não colidir (`lib/prisma.ts:8-24`) — **não é transacional** |
| Serial duplicado | 409 + tratamento de `P2002` (`pages/api/actives/create.ts`, `actives/update.ts`) |
| Log de auditoria | `lib/logger.ts` **nunca lança** — falha de log não pode derrubar a operação |
| Revert `QUICK` | Valida `elapsed ≤ 10 s` antes de executar (`pages/api/database/revert.ts:468-477`) |
| Revert em transação | `db.$transaction` (`pages/api/database/revert.ts:481`) |
| Logout | Só limpa o cookie — **o JWT continua válido até 8 h** (sem revogação) |
| Upload | Sem idempotência: cada POST gera `Date.now()-filename` como objectName |

---

## 5. Engineering Quality & Definition of Done (DoD)

> **DoD estrita desde já.** A dívida de testes e CI que existe hoje é registrada em `CONTEXT.md` §3.2
> e **não** é desculpa para não escrever testes novos.

### 5.1 Security, Encryption & Compliance Standards

**Autenticação e sessão**
- JWT HS256 via `jose`. Expiração 8 h. Payload mínimo: `{ userId, email, role }`.
- Senhas com `bcryptjs`, **10 rounds** (`lib/auth.ts` consumidor + `pages/api/auth/login.ts`).
- `JWT_SECRET` é **obrigatório** — `lib/auth.ts:8` lança se ausente. Nunca usar valor padrão.
- Toda verificação de token passa por `verifyAuthToken()`. **Proibido** `jwtDecode` sem verificação de assinatura.

**Segredos**
- `.env` **nunca** é rastreado (`.gitignore:34` usa `.env*`).
- **Nenhuma** credencial, IP ou host de produção pode ser escrito em código. `process.env.X` **sem fallback**.
- **Dívida ativa:** `lib/minio.ts:9-10,18-19` e `pages/api/storage/upload-url.ts:14-15` contêm credenciais
  MinIO hardcoded como fallback; `lib/minio.ts:6,15` e `upload-url.ts:11,40` fixam infraestrutura de produção.
  **Não reproduzir. Não ecoar. Não "simplificar"**. Corrigir em `chore/security-p0-debt` (worktree `/tmp/opencode/inventory-p0`).
- Criar `.env.example` e ajustar `.gitignore` para `!.env.example` (pendência, `CONTEXT.md` §3).

**Controle de acesso**
- Duas camadas: `middleware.ts` (rota) **e** verificação no handler. O handler **não** pode assumir que o
  middleware rodou — qualquer endpoint listado em `PUBLIC_PATHS` é alcançável sem sessão.
- `PUBLIC_PATHS` é lista de allow: **cada entrada exige justificativa**. Endpoint novo → privado por padrão.
- `authMiddleware` (`lib/middlewares/authMiddleware.ts`) aceita **apenas** `Authorization: Bearer`, não cookie.
  Ampliar para cookie oupadronizar em um helper único — ver `CONTEXT.md` §3.3.

**Upload e mídia**
- Limite de 10 MB e tipos aceitos **precisam** de validação **no servidor** (hoje é só cliente, `components/FileUpload.tsx:134`).
- `next.config.ts:17-26` — `remotePatterns` só permite `minio.meganuv.com:80`. **Não ampliar** sem revisão.
- `inventory-policy.json` concede `s3:*` (inclui deletar bucket e gerenciar ACL) no bucket `inventory`.
  Restringir a `GetObject`/`PutObject`/`DeleteObject` em credenciais separadas.

**Validação de entrada**
- Sem biblioteca de validação (Zod etc.) no projeto. Handlers validam manualmente.
- **Dívida:** `pages/api/storage/upload-url.ts:24-26` usa `String()` sem argumento (sempre `""`), tornando
  o `active` retornado sempre `null`. Ao tocar nesse arquivo, corrigir.

**Histórico do Git**
- O histórico **contém segredos**. **Nunca** reescrever com `rebase`/`filter-branch`/`filter-repo`.
  Remediação correta: rotacionar a credencial no servidor, não reescrever a história.

**Compliance:** dado interno da MegaNuv (inventário, números de série, valores, endereço de locais, telefone).
Tratar como dado sensível: não logar em chat de IA, não enviar a serviço externo sem aprovação.

### 5.2 Testing Strategy & Coverage Thresholds

**Estado atual: 0% de cobertura. Nenhum runner instalado. Nenhum arquivo `*.test.*`.**

**Alvo (obrigatório a partir deste setup):**

| Camada | Ferramenta | Cobertura mínima |
|---|---|---|
| Unitário — `lib/**` | `vitest` | **80%** de linhas / **80%** de branches em `lib/` |
| Integração — `pages/api/**` | `vitest` + mock de `lib/prisma` | **70%** de linhas por domínio |
| E2E — fluxos críticos | `@playwright/test` | 5 fluxos: login · CRUD de ativo · movimentação · upload · revert |

**Fluxos E2E obrigatórios:**
1. `initial-setup` → criar 1º ADMIN → login.
2. Login com papel `VIEWER` → tentativa de criar ativo → 403.
3. CRUD completo de `Active` com hierarquia de 3 níveis.
4. Upload de arquivo → visualização via `/api/storage/file` (proxy autenticado).
5. Revert `QUICK` de uma alteração recém-feita.

**Regras:**
- **Todo** caminho novo de lógica de negócio **precisa** de teste. Não há exceção "é pequeno".
- Bug corrigido → teste de regressão obrigatório.
- Regra de RBAC nova → tabela de testes parametrizada sobre os 4 papéis.
- Teste não pode acessar MinIO, MariaDB de produção nem rede real. Usar mock/stub.
- Segredos **nunca** em fixture. Usar `.env.test` local e não rastreado.

### 5.3 Automated Validation Pipeline (CI/CD Gates)

**Gates locais — todos obrigatórios, todos precisam passar:**

```bash
yarn lint            # 0 erros, 0 avisos
npx tsc --noEmit     # 0 erros
npx prisma validate  # schema válido
yarn build:opt       # build standalone bem-sucedido
yarn test            # testes + coverage acima do threshold
```

**Estado atual: os 4 primeiros passam; `yarn test` não existe.**

**Pipeline CI (a criar — `.github/workflows/ci.yml`):**

```yaml
# Gatilho: push em main, inventory-vX.Y.Z, e pull_request
# Matrix: node 22.x · yarn --frozen-lockfile
# Ordem: install → prisma validate → lint → tsc --noEmit → test+coverage → build:opt
# Bloqueia merge se qualquer etapa falhar ou coverage < threshold
# Segredo: DATABASE_URL apontando para MariaDB efêmero com system-versioning
```

**Regras de pipeline:**
- `--frozen-lockfile` obrigatório — CI **nunca** altera `yarn.lock`.
- `npx prisma migrate diff` contra o schema deve reportar **zero** drift.
- Nenhum segredo em log de build. `.dockerignore` já exclui `.env` — manter.
- Build de imagem usa `yarn build:opt` (**não** `yarn build`, que não existe — ver `CONTEXT.md` §3.4).

**Versionamento e release** (convenção em `AGENTS.md` §3.2, detalhado em `CONTEXT.md` §4):
- Versão é a **fonte da verdade** em `package.json:3`, exposta via `lib/version.ts`.
- Release cria branch `inventory-vX.Y.Z` e faz merge para `main`. Branch de versão é **proibida para a IA**.
- A IA **nunca** executa `push`, `tag` ou merge em `main`.
