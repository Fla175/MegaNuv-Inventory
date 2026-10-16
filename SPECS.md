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
imprimir **etiquetas com QR Code** e **reverter alterações** usando _system-versioning_ do MariaDB.

Não é: ERP, sistema financeiro (só armazena `fixedValue` como número), ou CRM.

### 1.2 Domain Boundaries (Bounded Contexts)

| Contexto                   | Responsabilidade                                                             | Código                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Identidade & Acesso**    | Login, JWT, papéis (RBAC de 4 níveis), tema, bootstrap do 1º ADMIN           | `pages/api/auth/**`, `lib/auth.ts`, `lib/middlewares/authMiddleware.ts`, `pages/login.tsx`, `pages/initial-setup/` |
| **Inventário**             | CRUD de ativos, clonagem em lote, movimentação, "alterar ativos semelhantes" | `pages/api/actives/**`, `components/actives/activeForm.tsx`                                                        |
| **Espaços**                | CRUD de `FatherSpace` e da hierarquia de locais                              | `pages/api/father-spaces/**`, `components/AddLocationModal.tsx`                                                    |
| **Taxonomia**              | Categorias (ex-"Áreas") com paleta de 18 cores persistidas                   | `pages/api/categories/**`, `lib/constants/colors.ts`                                                               |
| **Armazenamento de Mídia** | Upload multipart → MinIO, presigned URL, proxy autenticado, exclusão         | `pages/api/storage/**`, `lib/minio.ts`, `lib/mediaUrl.ts`, `lib/mediaReferences.ts`                                |
| **Auditoria**              | Log imutável de CRUD, logins e signups                                       | `lib/logger.ts`, `pages/api/logs/**`, model `Log`                                                                  |
| **Realtime do Banco**      | Reversão temporal de alterações via _system-versioning_                      | `pages/api/database/revert.ts`                                                                                     |
| **Apresentação**           | Dashboard, listagem, busca, modais, impressão, context menu, toasts          | `pages/*.tsx`, `components/**`, `lib/context/**`                                                                   |
| **Plataforma**             | Roteamento protegido, config de build, estilo global                         | `middleware.ts`, `next.config.ts`, `styles/globals.css`                                                            |

**Fronteiras invioláveis:**

- Nenhum componente React importa de `pages/api/**` (só via `fetch`).
- Nenhuma página `pages/*.tsx` importa de outro `pages/*.tsx` (exceto `_app`/`_document`).
- `lib/` nunca importa de `pages/` nem de `components/`.
- Camada de dados só é alcançada via o singleton `db` de `lib/prisma.ts`.

---

## 2. Technology Stack & Environment Constraints — Stack e Restrições

### 2.1 Runtime, Languages & Ecosystem

| Item                 | Versão                                            | Fonte da verdade            |
| -------------------- | ------------------------------------------------- | --------------------------- |
| Node.js              | `v22.20.0` (alpine no Docker)                     | `Dockerfile:2,12`           |
| TypeScript           | `5.9.3`, `strict: true`                           | `tsconfig.json:7`           |
| Target / Lib         | `ES2017` / `["dom","dom.iterable","esnext"]`      | `tsconfig.json:2,4`         |
| Module resolution    | `bundler`                                         | `tsconfig.json:11`          |
| Path alias           | `@/*` → `./*` (raiz, não `src/`)                  | `tsconfig.json:16-18`       |
| Gerenciador          | **Yarn 1** (`yarn.lock` rastreado)                | `package.json`, `yarn.lock` |
| Gerenciador proibido | `npm` — `package-lock.json` é artefato acidental  | `AGENTS.md` §3.3            |
| Módulos              | **CommonJS** (sem campo `type` em `package.json`) | `package.json`              |

### 2.2 Frameworks & Hard Dependencies

**Usadas (obrigatórias):**

| Pacote                                 | Versão                       | Papel                                                    |
| -------------------------------------- | ---------------------------- | -------------------------------------------------------- |
| `next`                                 | `15.3.3` (fixo)              | Framework, **Pages Router**                              |
| `react` / `react-dom`                  | `^19.0.0` (instalado 19.1.0) | UI                                                       |
| `@prisma/client`                       | `6.18.0` (fixo)              | ORM                                                      |
| `prisma` (dev)                         | `^6.18.0`                    | CLI de migrations                                        |
| `tailwindcss` + `@tailwindcss/postcss` | `^4` (instalado 4.1.11)      | Estilos, config CSS-first                                |
| `@tailwindcss/container-queries`       | `^0.1.1`                     | Plugin de container queries                              |
| `jose`                                 | `^6.1.0`                     | JWT HS256 (`sign`/`verify`) — **única lib de auth real** |
| `bcryptjs`                             | `^3.0.3`                     | Hash de senha (10 rounds)                                |
| `minio`                                | `^8.0.6`                     | Cliente S3 para MinIO                                    |
| `formidable`                           | `^3.5.4`                     | Parse multipart do upload                                |
| `lucide-react`                         | `^0.525.0`                   | Ícones                                                   |
| `react-qr-code`                        | `^2.0.18`                    | Render de QR Code                                        |
| `react-number-format`                  | `^5.4.5`                     | Máscara numérica em `/settings`                          |
| `cookie`                               | `^1.0.2`                     | `serialize()` do cookie de sessão                        |
| `eslint` + `eslint-config-next`        | `^9` / `15.3.3`              | Flat config via `FlatCompat`                             |

**Declaradas e NUNCA importadas (12) — remover sob escopo próprio:**

`recharts` · `framer-motion` · `react-rnd` · `@headlessui/react` · `axios` · `jsonwebtoken` ·
`js-cookie` · `jwt-decode` · `eruda` · `uuid` · `qrcode.react` · (`@types/js-cookie`, `@types/jsonwebtoken`, `@types/react-rnd`)

**Ausentes e necessárias para a DoD §5.2:** `vitest`, `@vitest/coverage-v8`, `@testing-library/react`,
`@testing-library/user-event`, `playwright`/`@playwright/test`, `prettier`.

**Infra:** MariaDB (dialect `mysql` do Prisma) com **system-versioning** obrigatório ·
MinIO externo ao compose · `output: "standalone"` no Next.

### 2.3 Structural Limits

| Limite                                  | Valor                                                                                                | Onde                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Tamanho de upload                       | **10 MB** por arquivo (validado **só no cliente**)                                                   | `components/FileUpload.tsx:134`                    |
| Arquivos por ativo                      | até **5**                                                                                            | `components/FileUpload.tsx:54`                     |
| Validade do JWT                         | **8 h**, sem refresh token                                                                           | `lib/auth.ts:43-58`                                |
| Validade da presigned URL               | **1 h**                                                                                              | `pages/api/qrcode/public-get.ts`                   |
| Logs listados                           | `take: 200`                                                                                          | `pages/api/logs/list`                              |
| Itens do dashboard                      | 20 recentes / 20 movimentos                                                                          | `pages/api/dashboard/stats`                        |
| Janela do Revert `QUICK`                | **10 s** (validada server-side)                                                                      | `pages/api/database/revert.ts`                     |
| Tolerância do timestamp no Revert       | QUICK **11 s** · HISTORY **5 ms** (servidor deriva o instante via `planRevert`; divergência → `409`) | `pages/api/database/revert.ts` (`resolveRevertAt`) |
| `SYSTEM_TIME_MAX`                       | `2038-01-19 03:14:07.999999` (limite do `ROW_END` do MariaDB)                                        | `lib/revert/history.ts` (`TIMESTAMP_MAX`)          |
| Tabelas reversíveis                     | `Active`, `FatherSpace`, `Category` (whitelist)                                                      | `lib/revert/history.ts` (`REVERTABLE_TABLES`)      |
| Escala do inventário                    | `Active.id` = 4 chars hex (65.536 combinações) — colisão provável em inventário grande               | `lib/prisma.ts:8-24`                               |
| Tamanho máximo de arquivo de componente | **1.927 linhas** em `components/ListSection.tsx`                                                     | —                                                  |
| Threads de conexão Prisma               | 1 (singleton com hot-reload guard)                                                                   | `lib/prisma.ts:46-54`                              |

---

## 3. Architecture & Code Layout — Arquitetura e Layout

### 3.1 Design Patterns & Architectural Style

Estilo: **monólito modular em camadas**, sem `src/`, sem barrel files, sem DI container.
Serverless-first (Pages Router → cada `pages/api/**` é uma função independente).

| Pattern              | Aplicação                                                                           |
| -------------------- | ----------------------------------------------------------------------------------- |
| Singleton            | `lib/prisma.ts` — guarda em `global.prismaGlobal` para hot-reload                   |
| Repository implícito | Acessos Prisma ficam no handler; não há camada de repositório                       |
| Middleware chain     | `middleware.ts` (rota) → auth dentro do handler                                     |
| HOC                  | `lib/middlewares/authMiddleware.ts` — `authMiddleware(handler, requiredRoles?)`     |
| Context Provider     | `UserContext` (usuário+tema), `ToastContext` (notificações)                         |
| Hook                 | `useEscapeKey`, `useMediaQuery`                                                     |
| Extension hook       | `$extends` com query hook gerando IDs hex em `active.create` e `fatherSpace.create` |
| Anti-corrupção       | `lib/mediaUrl.ts` reescreve URL do MinIO → proxy local autenticado                  |

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
├── inventory-policy.json           # policy IAM do usuário MinIO da aplicação (AWS S3 v1)
├── inventory-policy-auditor.json   # policy IAM do auditor de órfãos — credencial separada (ListBucket + DeleteObject)
├── compose.yml              # serviço `app` + `banco` (MariaDB)
├── Dockerfile               # 2 estágios (node:22-alpine), runner non-root sobre output:"standalone"
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
├── lib/                     # nunca importa de pages/ ou components/
│   ├── prisma.ts  auth.ts  apiAuth.ts  minio.ts  logger.ts
│   ├── mediaUrl.ts  mediaReferences.ts  version.ts  types.ts  uploadPolicy.ts
│   ├── revert/             # classificação e agrupamento do revert (puros)
│   ├── constants/colors.ts  context/  hooks/  middlewares/
├── types/inventory.ts       # tipos de dominio
├── prisma/
│   ├── schema.prisma        # 6 models, 2 enums, 124 L
│   └── migrations/          # 16 migrations, 2026-01-12 → 2026-05-30 (imutáveis)
├── styles/globals.css       # 123 L — @media print p/ etiquetas
├── scripts/
│   ├── build-optimized.sh  # build standalone + montagem dos assets p/ o runner
│   ├── system-v.ts  # habilita WITH SYSTEM VERSIONING (idempotente)
│   └── audit-minio.ts    # órfãos do bucket MinIO (leitura por padrão; --apagar --confirmar)
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

| Model         | PK                            | Campos-chave                                                                                                                                                                                                                                                                   | Índices                                                                                              |
| ------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `User`        | `id` uuid                     | `email` @unique, `password`, `name?`, `role`, `theme`, `lastLogin?`, **`isCreator`**                                                                                                                                                                                           | `email` @unique                                                                                      |
| `Movement`    | `id` uuid                     | `activeId` FK, `fromSpaceId?`, `toSpaceId?` (Strings **sem FK** — desnormalizadas para preservar histórico)                                                                                                                                                                    | —                                                                                                    |
| `Category`    | `id` uuid                     | `name` @unique, **`color` @unique nullable**, 18 cores na paleta                                                                                                                                                                                                               | `name`, `color` @unique                                                                              |
| `Log`         | `id` uuid                     | `action`, `details` @db.Text, `ip?`, `userAgent?` @db.Text, `userId?`                                                                                                                                                                                                          | `@@index([userId])`, `@@index([action])`                                                             |
| `FatherSpace` | `id` String (**sem default**) | `name` @unique, `notes?`, `address?`, `imageUrl?`, `phone?`, `responsible?`, `parentId?`, `createdById?`                                                                                                                                                                       | `@@index([parentId])`, `@@index([createdById])`                                                      |
| `Active`      | `id` String (**sem default**) | `name`, **`categoryId` obrigatório**, `sku?`, `manufacturer?`, `model?`, **`serialNumber?` @unique**, `fixedValue` Float, **`fatherSpaceId` obrigatório**, `parentId?`, `isPhysicalSpace`, `tag` @default("IN-STOCK"), `notes?` @db.Text, `imageUrl?`, **`fileUrl?` @db.Text** | `@@index([fatherSpaceId])`, `@@index([parentId])`, `@@index([createdById])`, `@@index([categoryId])` |

**Enums:** `UserRole { DIRECTOR, ADMIN, MANAGER, VIEWER }` · `Theme { DARK, LIGHT, SYSTEM }`

**Invariantes:**

- Exclusão de `FatherSpace` ou `Active` pai faz **cascade** em toda a subárvore. Endpoint de delete **deve** avisar sobre o tamanho da subárvore.
- `fileUrl` é `TEXT` e aceita **dois formatos legados**: JSON array **ou** CSV separado por vírgula.
  A leitura dos dois vive em `lib/mediaReferences.ts` (`parseFileUrls`) — **cópia única**, consumida pelo
  QR Code (`pages/api/qrcode/public-get.ts`) e pela auditoria de órfãos. Duas cópias divergindo
  significariam apagar anexo que a tela ainda mostra.
- O frontend envia `serialNumbers[]`, mas **só o primeiro** é persistido (`pages/api/actives/update.ts:44-46,74`). Não assumir array.
- `isCreator: true` marca o único Admin Criador (out-of-band / cessão).
- `Category.color` é @unique e nullable — `null` é permitido em múltiplas categorias (MySQL permite múltiplos NULL em índice único).

### 4.2 API Contracts & Payload Schemas

**Envelope de erro (consistente em todo `pages/api/**`):\*\*

```ts
type ApiError = { error: string };
// status: 400 validação · 401 sem sessão/expirada · 403 RBAC · 404 não encontrado
//         405 método inválido · 409 conflito (serial duplicado) · 500 inesperado
```

**Autenticação:** cookie `auth_token` (httpOnly, `sameSite: lax`, 8 h) **ou** header `Authorization: Bearer <token>`.
Claims: `{ userId, email, role }`. `verifyAuthToken()` em `lib/auth.ts:20-41` é a fonte de verdade.

**RBAC (matriz de referência):**

| Papel      | Leitura | CRUD de ativos/espaços/categorias | Gerencia usuários | Vê `fixedValue`             | Logs                         | Revert |
| ---------- | ------- | --------------------------------- | ----------------- | --------------------------- | ---------------------------- | ------ |
| `DIRECTOR` | total   | sim                               | todos             | sim                         | sim (inclusive edita/deleta) | sim    |
| `ADMIN`    | total   | sim                               | exceto DIRECTOR   | **não** (só total agregado) | sim                          | sim    |
| `MANAGER`  | total   | sim                               | só `VIEWER`       | **não**                     | sim                          | sim    |
| `VIEWER`   | total   | **não**                           | não               | **não**                     | não                          | não    |

`DIRECTOR` é o único papel que pode ser criado por `signup` (`pages/api/auth/signup.ts:54-60`).

**Endpoints sensíveis (contrato de segurança — ver §5.1 e `CONTEXT.md` §3):**

| Endpoint                    | Método              | Hoje                              | Deve ser                                                                                                           |
| --------------------------- | ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/api/auth/login`           | POST                | público                           | público (credenciais)                                                                                              |
| `/api/auth/logout`          | POST                | público                           | público (limpa auth_token e auth_token_creator)                                                                    |
| `/api/auth/me`              | GET                 | privado                           | privado (retorna user e impersonation)                                                                             |
| `/api/auth/seed`            | GET, POST           | público                           | público (bloqueado se `user.count() > 0`)                                                                          |
| `/api/auth/signup`          | POST                | público                           | público (só cria DIRECTOR)                                                                                         |
| `/api/creator-access`       | POST, DELETE, PATCH | privado (criador)                 | privado (exclusivo do criador)                                                                                     |
| `/api/public/initial-check` | GET                 | público                           | público (`requiresSetup: userCount === 0`)                                                                         |
| `/api/qrcode/public-get`    | GET                 | ✅ **privado** (exige sessão)     | privado                                                                                                            |
| `/api/storage/upload-url`   | POST                | ✅ **privado** (exige sessão)     | **privado**                                                                                                        |
| `/api/storage/delete-url`   | DELETE              | ✅ **privato** (exige sessão)     | **privado**                                                                                                        |
| `/api/storage/file`         | GET                 | privado                           | privado (proxy autenticado)                                                                                        |
| `/api/users`                | GET                 | ✅ **privado** (`authMiddleware`) | **privado**                                                                                                        |
| `/api/users/check-director` | GET                 | ✅ **privado** (`authMiddleware`) | privado                                                                                                            |
| `/api/database/revert`      | GET, POST           | privado, bloqueia VIEWER          | privado, bloqueia VIEWER · POST valida o `timestamp` do cliente contra o derivado do histórico (`409` se divergir) |
| `/api/actives/update`       | PUT                 | ✅ **privado** (`authMiddleware`) | privado                                                                                                            |

> Os seis endpoints marcados com ✅ foram fechados na branch `chore/security-p0-debt`. **A proteção
> está no handler**, não só no middleware: `authMiddleware` envolve o handler e devolve `401` sem
> sessão. Nenhum deles depende mais exclusivamente do `middleware.ts` para ser privado.

**Paginação:** não existe. `list` devolve o conjunto inteiro; `/api/logs/list` limita a 200.
Ao adicionar listagem, **não** quebrar o formato de resposta atual sem versionar.

### 4.3 State Management & Idempotency Rules

**Estado cliente:** React Context API. Sem Redux/Zustand.

- `UserContext` (`lib/context/UserContext.tsx`) — usuário + tema. Aplica `.dark` e `colorScheme` no `<html>`; listener de `prefers-color-scheme`. `useUser()` **lança** se usado fora do provider.
- `ToastContext` (`lib/context/ToastContext.tsx`) — 4 tipos: `success | error | warning | info`.
- `BUILD_DATE` em `lib/version.ts` é calculado **só no cliente** para evitar hydration mismatch.

**Regras de idempotência e concorrência:**

| Regra                              | Implementação / Status                                                                                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login→refresh de contexto          | Flag `localStorage.setItem("justLoggedIn")` (`lib/context/UserContext.tsx:69-77`)                                                                                                                                |
| Bootstrap idempotente              | `GET /api/internal/ensure-location-item` garante categoria `ESTRUTURA` + `FatherSpace` id `0000` + `Active` id `ffff`                                                                                            |
| Criação do 1º ADMIN                | `user.count() > 0` → 403 (`pages/api/auth/seed.ts:28-31`)                                                                                                                                                        |
| ID único de `Active`/`FatherSpace` | Loop `randomBytes(2)` + `findUnique` até não colidir (`lib/prisma.ts:8-24`) — **não é transacional**                                                                                                             |
| Serial duplicado                   | 409 + tratamento de `P2002` (`pages/api/actives/create.ts`, `actives/update.ts`)                                                                                                                                 |
| Log de auditoria                   | `lib/logger.ts` **nunca lança** — falha de log não pode derrubar a operação                                                                                                                                      |
| Revert `QUICK`                     | Valida `elapsed ≤ 10 s` antes de executar; o instante de reversão é **derivado no servidor** (`planRevert`) e o `timestamp` do cliente só é comparado (tolerância 11 s) — nunca usado no `FOR SYSTEM_TIME AS OF` |
| Revert `HISTORY`                   | `timestamp` do GET comparado ao derivado (tolerância 5 ms); divergência → `409` "lista desatualizada"                                                                                                            |
| Revert em transação                | `db.$transaction` (`pages/api/database/revert.ts`)                                                                                                                                                               |
| Logout                             | Só limpa o cookie — **o JWT continua válido até 8 h** (sem revogação)                                                                                                                                            |
| Upload                             | Sem idempotência: cada POST gera `Date.now()-filename` como objectName                                                                                                                                           |

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

- `.env` **nunca** é rastreado (`.gitignore` usa `.env*` com `!.env.example`).
- **Nenhuma** credencial, IP ou host de produção pode ser escrito em código. `process.env.X` **sem fallback**.
- `lib/minio.ts` usa `requireEnv()`, que **lança no import** se `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`,
  `MINIO_SECRET_KEY` ou `MINIO_PUBLIC_ENDPOINT` estiverem ausentes — mesma convenção de `JWT_SECRET`.
  Ausência de configuração deve **parar o app**, nunca cair em um valor padrão.
- ✅ **Resolvido em `chore/security-p0-debt`:** as credenciais MinIO e os hosts de produção foram removidos
  do código. **Não reintroduzir. Não ecoar.** O valor original continua no histórico do Git — a correção
  definitiva é **rotacionar a credencial no servidor** (ação humana).
- ✅ `.env.example` criado e `.gitignore` ajustado com `!.env.example`. O arquivo lista **apenas nomes de
  variáveis e placeholders**; nenhum valor real pode entrar nele.

**Controle de acesso**

- Duas camadas: `middleware.ts` (rota) **e** verificação no handler. O handler **não** pode assumir que o
  middleware rodou — qualquer endpoint listado em `PUBLIC_PATHS` é alcançável sem sessão.
- `PUBLIC_PATHS` é lista de allow: **cada entrada exige justificativa**. Endpoint novo → privado por padrão.
- ✅ `authMiddleware` (`lib/middlewares/authMiddleware.ts`) agora aceita **cookie `auth_token`** e
  `Authorization: Bearer`. O cookie é a forma canônica de sessão do frontend (`fetch` sem header explícito).
  O `req.user` preenchido pelo helper é a fonte de verdade para RBAC dentro do handler.
- Handler novo sensível → envolver com `authMiddleware`, **não** depender só do `middleware.ts`.
- ✅ **Resolução de sessão em handler: usar `getSessionUser(req)` de `lib/apiAuth.ts`.** A sequência
  `req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '')` seguida de `jwtVerify`
  manual **não pode ser reintroduzida** — o `replace` não validava o esquema `Bearer`, cada arquivo repetia
  a codificação do segredo, e a leitura do id divergia entre arquivos sendo que o token do login carrega
  apenas `userId` (§4.2).
- `getSessionToken(req)` aceita cookie `auth_token` e header `Authorization: Bearer <token>` (esquema
  case-insensitive, com espaços tolerados). `getSessionUser(req)` **nunca lança**: devolve `null` para token
  ausente, inválido ou expirado, e quem chama decide o status e o corpo — preservando o envelope `{ error }`.
- **Endpoint de listagem também precisa verificar a sessão.** Três endpoints (`actives/list`,
  `categories/list`, `father-spaces/list`) chegou a checar apenas se o token existia, sem verificar a
  assinatura — qualquer string não-vazia passava. Regra: presença de token não é autenticação.

**Recurso de Acesso do Criador (incondicional e sempre autenticado por senha)**

- O acesso do criador é **sempre ativo** e **não existe mais nenhuma flag de ambiente** para ligá-lo ou
  desligá-lo. Decisão do dono do projeto: exigir a senha do criador não é atrito — as senhas ficam no
  Bitwarden. **Não reintroduzir `CREATOR_ACCESS_ENABLED` nem `CREATOR_ACCESS_REQUIRE_PASSWORD`.**
- Causa raiz do bug anterior (403 silencioso em produção) foi ter uma flag **obrigatória disfarçada de
  opcional**: quem configurou omitiu a linha e o recurso degradou sem sinalizar. Feature flag de segurança
  cujo valor padrão desliga o recurso é armadilha, não controle.
- `POST /api/creator-access` **exige sempre** a senha do criador, validada com
  `bcrypt.compare(password, creator.password)` **após** resolver o `creator` e o `targetUser`:
  `targetUserId` ausente → `400 { error: 'targetUserId é obrigatório.' }`;
  senha ausente/vazia → `400 { error: 'Senha é obrigatória.' }`;
  senha errada → `401 { error: 'Senha incorreta.' }` (sem emitir cookie de impersonação).
- `pages/settings.tsx` pede a senha em um modal próprio (`input type="password"` com
  `autoComplete="current-password"`, para o autofill do navegador/Bitwarden funcionar) antes de chamar a API,
  e trata `400`/`401` com toast + limpeza do campo.
- A visibilidade dos botões "Entrar"/"Ceder" depende **apenas** de `user.isCreator`. O campo
  `creatorAccessEnabled` foi removido de `/api/auth/me` e de `lib/context/UserContext.tsx`.
- Regras que permanecem válidas para qualquer flag futura: **nenhuma flag de kill switch pode ser semeada
  globalmente** em `vitest.config.ts` (`test.env`) — ambiente global de teste é exatamente o que faz a suíte
  passar enquanto a produção falha. Se um kill switch for indispensável, ele precisa de teste explícito para o
  valor **ausente**.

**Upload e mídia**

- ✅ Limite de 10 MB e tipos aceitos **são validados no servidor** em `lib/uploadPolicy.ts`, aplicado por
  `pages/api/storage/upload-url.ts`. A checagem do cliente (`components/FileUpload.tsx`) é só UX.
- A validação exige **coerência**: extensão presente precisa estar na allowlist **e** MIME presente precisa
  estar na allowlist. `application/octet-stream` nunca é aceito. Aceite por "MIME **ou** extensão" é
  bypass — permite `.exe` com MIME `application/pdf`.
- `next.config.ts` — `remotePatterns` deriva de `MINIO_PUBLIC_ENDPOINT` e **falha fechado** (lista vazia)
  quando a variável não está definida em tempo de build. **Não reintroduzir host fixo; não ampliar sem revisão.**
- ✅ `inventory-policy.json` restringida a `GetObject`/`PutObject`/`DeleteObject` (sem `s3:*`).
  ⚠️ **A policy só tem efeito depois de aplicada no servidor** — ação humana, ver `CONTEXT.md` §3.1 item 9.
- **`inventory-policy-auditor.json` — credencial SEPARADA da aplicação, só para
  `scripts/audit-minio.ts`.** Concede `s3:ListBucket` em `arn:aws:s3:::inventory`
  (enumerate) e `s3:DeleteObject` em `arn:aws:s3:::inventory/*` (limpar). Sem
  `GetObject` — o auditor nunca lê conteúdo — e **sem `s3:*`**, pelo mesmo motivo de
  `inventory-policy.json`.
  - **Por que a credencial da aplicação não serve:** ela é `GetObject`/`PutObject`/
    `DeleteObject`, e **`ListBucket` está entre elas** — sem o direito de listar não há
    como enumerar o bucket, e um `DeleteObject` que só apaga o que alguém já nomeia não
    encontra órfão. Conceder `ListBucket` à credencial da aplicação para resolver isso
    ampliaria o alcance de todo o app no bucket, e `ListBucket` expõe o **nome** de todos
    os objetos — inclusive anexos de inventário de outros Thermal Ribbon printers — para
    qualquer vazamento dessa credencial. O custo é uma credencial a mais; o benefício é
    que a aplicação continua sem poder enumerar nada.
  - **Ambiente:** `MINIO_AUDIT_ACCESS_KEY` / `MINIO_AUDIT_SECRET_KEY`. O script **só** cai
    para `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` com aviso explícito no log, e a listagem
    deve falhar com `AccessDenied` — o fallback é diagnóstico, não atalho.
  - ⚠️ **A policy só tem efeito depois de aplicada no servidor** — ação humana, ver
    `CONTEXT.md` §3.3.

**Remoção de anexo**

- `deleteFileFromMinio()` (`lib/minio.ts`) **extrai a chave com `getMinioKeyFromUrl()`** de
  `lib/mediaUrl.ts` — regex `/^https?:\/\/[^/]+\/inventory\/(.+)$/`, que captura o caminho
  **completo**, subpastas incluídas.
  - **`split('/').pop()` local é proibido.** O banco guarda a **URL completa** e o bucket guarda a
    **chave nua**: com subpasta ele devolveria só o nome do arquivo e apagaria o objeto errado — ou
    nada, sem sinalizar, porque o `catch` era mudo.
  - **Link externo é ignorado, não é erro.** O app aceita "Cole um link" (ex.: Google Drive) e
    `getMinioKeyFromUrl` devolve `null` para o que não é do bucket `inventory`; nesse caso a função
    **não chama** `removeObject`. Sem isso, o `pop()` de `.../file/d/x/view` viraria a chave `view` e
    o app removeria um objeto do bucket que o usuário nunca pediu.
- A função **não lança**. `removeObject` é idempotente e rejeita objeto já inexistente, e os
  chamadores (`pages/api/father-spaces/delete.ts`, `pages/api/actives/delete.ts`,
  `pages/api/storage/delete-url.ts`) dependem disso para não reverter a exclusão de um registro só
  porque o arquivo já sumiu. A falha é registrada em `console.warn` com a **URL** e o **motivo** —
  sem stack e **sem qualquer credencial**.
- Assinatura `url: string | null | undefined`: chamadores passam colunas do Prisma que podem ser
  `undefined` (`Active.imageUrl`), não só `null`.

**Validação de entrada**

- Sem biblioteca de validação (Zod etc.) no projeto. Handlers validam manualmente.
- ✅ `String()` sem argumento corrigido: `upload-url.ts` lê `activeId` do formulário e vincula o arquivo ao
  ativo quando informado.
- Lógica de validação com regra de negócio deve viver em módulo **puro** em `lib/` (sem I/O), para ser
  testável sem passar por `formidable`/HTTP. `lib/uploadPolicy.ts` é o padrão.

**Histórico do Git**

- O histórico **contém segredos**. **Nunca** reescrever com `rebase`/`filter-branch`/`filter-repo`.
  Remediação correta: rotacionar a credencial no servidor, não reescrever a história.

**Compliance:** dado interno da MegaNuv (inventário, números de série, valores, endereço de locais, telefone).
Tratar como dado sensível: não logar em chat de IA, não enviar a serviço externo sem aprovação.

### 5.2 Testing Strategy & Coverage Thresholds

**Estado atual:** `vitest` instalado e rodando; a suíte passa na íntegra na branch atual. **A contagem
exata de testes não é fixada aqui de propósito** — um número fixo envelhece a cada commit e vira mentira
em silêncio; a fonte é a saída de `yarn test`. Os testes pulados são a integração opt-in do revert, que
exige `REVERT_PROBE_DATABASE_URL`. Cobertura medida: **83% de linhas / 80% de branches /
100% de funções** na superfície de segurança.

> ⚠️ **O gate de cobertura hoje se aplica só a** `lib/middlewares/**`, `lib/uploadPolicy.ts`,
> `pages/api/users/index.ts` e `pages/api/users/check-director.ts`. O alvo global desta tabela
> **permanece pendente** (`CONTEXT.md` §3.3 item 1): cobri-lo exige cobrir todos os 36 endpoints.
> O threshold é um **ratchet sobre o que já é testado**, não uma declaração de que o projeto está coberto.

**Alvo (obrigatório a partir deste setup):**

| Camada                      | Ferramenta                      | Cobertura mínima                                                 |
| --------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| Unitário — `lib/**`         | `vitest`                        | **80%** de linhas / **80%** de branches em `lib/`                |
| Integração — `pages/api/**` | `vitest` + mock de `lib/prisma` | **70%** de linhas por domínio                                    |
| E2E — fluxos críticos       | `@playwright/test`              | 5 fluxos: login · CRUD de ativo · movimentação · upload · revert |

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
- Segredos **nunca** em fixture. O ambiente de teste é semeado no bloco `env` do `vitest.config.ts` com
  valores fictícios; `lib/minio.ts` e `lib/auth.ts` **falham no import** sem essas variáveis, então
  qualquer `MINIO_*` novo precisa ser adicionado ali.
- Lógica de validação com regra de negócio fica em módulo **puro** em `lib/` (sem I/O), para ser testada
  sem HTTP. Testar através de `formidable` só para alcançar uma condição é teste de plumbing.

### 5.3 Automated Validation Pipeline (CI/CD Gates)

**Gates locais — todos obrigatórios, todos precisam passar:**

```bash
yarn lint            # 0 erros, 0 avisos
npx tsc --noEmit     # 0 erros
npx prisma validate  # schema válido
yarn build:opt       # build standalone bem-sucedido
yarn test            # testes + coverage acima do threshold
```

**Estado atual: os 5 passam** (verificados na branch `chore/security-p0-debt`).

> **Requisitos de ambiente por gate** (verificado empiricamente):
>
> - `npx prisma validate` exige apenas `DATABASE_URL` presente (não conecta ao banco).
> - `yarn lint`, `npx tsc --noEmit`, `yarn test` e **`yarn build:opt` não exigem nenhuma variável de
>   ambiente.** As rotas de API (`pages/api/**`) só são avaliadas em runtime, não em tempo de build, então
>   o `requireEnv()` de `lib/minio.ts` e o `JWT_SECRET` de `lib/auth.ts` **não** são disparados no build.
>   É isso que permite ao `Dockerfile` construir a imagem sem nenhum segredo.
> - Em máquina sem `.env`, passar um `DATABASE_URL` fictício inline **apenas para o `prisma validate`** —
>   nunca criar um `.env` com valores de teste versionável. `.env` é gitignored.
> - `NODE_ENV=production` é definido no **runner**, não no builder: o Next faz inlining de
>   `process.env.*` no bundle do cliente, então configuração de runtime deve ser lida no servidor e não
>   passar por variáveis `NEXT_PUBLIC_`.

**Requisitos da imagem Docker** (`Dockerfile`, verificados com `docker build` completo):

- O builder precisa de **bash**: `yarn build:opt` executa `bash scripts/build-optimized.sh`, e
  `node:22-alpine` não traz bash (`/bin/sh: bash: not found`).
- O builder precisa de **`npx prisma generate` explícito depois de `COPY . .`**: a layer de dependências
  vem primeiro (para reaproveitar cache), então o `postinstall` do `@prisma/client` roda **sem** o
  `prisma/schema.prisma` na imagem e não gera o Client — o build quebra com
  `Module '@prisma/client' has no exported member 'UserRole'`.
- Validado de ponta a ponta: imagem de **341MB**, container rodando como `uid=1000(node)`,
  `GET /` → 307, `GET /api/hello` → 200, e os endpoints protegidos respondendo **401** tanto sem sessão
  quanto com `Authorization: Bearer qualquercoisa`.

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

### 5.5 System Versioning (MariaDB)

**O Revert depende de `WITH SYSTEM VERSIONING`.** Toda consulta de histórico usa
`FOR SYSTEM_TIME AS OF` / `FOR SYSTEM_TIME ALL`. Sem a opção na tabela, o MariaDB recusa com
**erro 4124** (`Table `X` is not system-versioned`), e `/api/database/revert` não funciona.

**Tabelas exigidas — fonte única, `REVERTABLE_TABLES` em `lib/revert/history.ts`.**
`Active`, `FatherSpace`, `Category`. **Nunca hardcodear a lista** em script, endpoint ou
documentação: quem precisa da lista importa o mapa.

**O Prisma não modela isso.** `prisma/schema.prisma` e as migrations não têm como declarar a
opção de tabela, e o Prisma geraria DDL sem ela. Logo:

- O `ALTER TABLE ... ADD SYSTEM VERSIONING` é aplicado **fora** do sistema de migrations do
  Prisma e **não deve ser registrado como migration**. Ele não sobrevive a `prisma migrate diff`
  nem a `migrate reset`; o estado do system versioning é responsabilidade **operacional**.
- As migrations existentes são **imutáveis** (`AGENTS.md` §3.3). Não "corrigir" nenhuma delas.

**Verificar e aplicar** — `scripts/system-v.ts` (idempotente, sem I/O além do
banco, roda direto no Node 22 por type-stripping):

```bash
node scripts/system-v.ts            # somente leitura — imprime TABELA | SYSTEM VERSIONING | SITUAÇÃO
node scripts/system-v.ts --aplicar  # ALTER TABLE ADD SYSTEM VERSIONING só no que está 'NO'
node scripts/system-v.ts --tabela Active
```

> **Como o estado é lido (verificado no MariaDB 10.11.14):** por
> `information_schema.tables.TABLE_TYPE`, que vale `'SYSTEM VERSIONED'` para uma tabela com
> `WITH SYSTEM VERSIONING`. A coluna `SYSTEM_VERSIONING` de `information_schema.tables` > **não existe no MariaDB 10.11** — ela é do MySQL 8 — e consultá-la devolve
> `ERROR 1054 (42S22): Unknown column 'SYSTEM_VERSIONING' in 'SELECT'`. Equivalência
> cross-checkada com `SHOW CREATE TABLE`.

O modo padrão é **sempre** leitura; nada é aplicado sem `--aplicar`. Rodar `--aplicar` duas vezes
não executa DDL na segunda, porque só entra no `ALTER` o que a releitura marcou como pendente. O
script termina com `process.exitCode = 1` se alguma tabela esperada continuar sem versionamento —
serve como **check de CI**. Tabela **inexistente** é reportada como `AUSENTE` e não entra no
`ALTER`: `ALTER TABLE` em tabela que não existe só produziria um erro mascarando o problema real.

**O app NÃO tem DDL e nunca vai ganhar.** O handler **não** aplica o `ALTER`: conceder a uma
aplicação web o privilégio de alterar o próprio schema em produção inverte a separação de
responsabilidades e multiplica a superfície de um erro de infraestrutura. A correção é sempre um
passo operacional, executado por quem tem acesso ao banco.

**Contrato do endpoint:** quando o erro 4124 chega ao `catch` de `pages/api/database/revert.ts`,
`parseSystemVersioningError` (`lib/revert/errors.ts`, módulo puro) o reconhece e o handler
responde **503** com `{ error }` em português, nomeando a tabela — ou falando em "uma ou mais
tabelas" quando o nome não veio — e **incluindo o comando exato de correção**
(`node scripts/system-v.ts --aplicar`). O corpo **não** carrega stack,
`details` nem a mensagem crua do Prisma/MariaDB. 503 e não 500 porque a condição é persistente:
retry não resolve, é configuração. Os sentinels `"UNAUTHORIZED"`, `"USER_NOT_FOUND"` e
`"STALE_REVERT_LIST"` passam **antes** dessa checagem e continuam produzindo 401/401/409 — o
reconhecimento nunca pode capturar nenhum deles.
