# CONTEXT.md — Contexto Atual do Projeto

> **Este arquivo é a foto do "agora".** É atualizado a **cada sessão** de trabalho de IA.
> Ele responde: o que o sistema é, o que está em foco agora, e o que está quebrado.
> Não é um documento normativo — para regras, ver `AGENTS.md` e `SPECS.md`.

**Última atualização:** 15/10/2026 · **Branch:** `chore/security-p0-debt` (rebased sobre `fix/revert-classification`)
**Versão:** `2.23.0` · **Documentos canônicos:** `AGENTS.md`, `SPECS.md`, `OPENCODE.md`

---

## 1. Core System Purpose

O **MegaNuv Inventory** é o sistema interno de gestão de inventário de ativos da MegaNuv.
Cadastra ativos e espaços físicos numa **hierarquia recursiva** (`FatherSpace` → `Active` filho → `Active` filho`),
controla movimentações entre locais, anexa arquivos em **MinIO**, imprime etiquetas com **QR Code**
e permite **reverter alterações** via _system-versioning_ do MariaDB.

**Stack:** Next.js 15.3.3 (Pages Router) · React 19 · TypeScript 5.9 strict · Tailwind v4 · Prisma 6 + MariaDB · MinIO.

**Maturidade:** aplicação **funcional e completa em funcionalidades**, com **débito técnico relevante**
em segurança, testes e manutenção. Ver §3.

---

## 2. Active Focus & Current Task

### 2.1 Foco atual

> **Correções de segurança P0 (§3.1) — implementadas e verificadas nesta branch.**
> Foco da sessão: remover credenciais/hosts de produção do código e fechar os endpoints que
> estavam alcançáveis sem autenticação.

Estado: **implementado na branch `chore/security-p0-debt`**, que foi **rebaseada sobre
`fix/revert-classification`** (o rebase foi necessário porque a branch original derivava de
`inventory-v2.22.6` e não tinha o framework de documentação — `AGENTS.md`, `CHANGELOG.md`,
`CONTEXT.md`, `SPECS.md` foram criados depois; sem eles a regra `AGENTS.md` §3.4 não podia ser cumprida).

Gates executados e verdes: `yarn lint` (0 erros), `npx tsc --noEmit` (0 erros), `npx prisma validate`
(schema válido), `yarn build:opt` (standalone 90M), `yarn test` (**101 passando, 5 pulados** — a integração
opt-in) e cobertura da superfície de segurança em **83% de linhas / 80% de branches**, acima do gate de 70%.

Corrigido nesta branch (detalhe no `CHANGELOG.md`): credenciais MinIO e hosts de produção removidos do
código; `authMiddleware` aceitando cookie além de Bearer; autenticação no handler de
`/api/storage/upload-url`, `/api/storage/delete-url`, `/api/qrcode/public-get`, `GET /api/users`,
`GET /api/users/check-director` e `PUT /api/actives/update`; `inventory-policy.json` sem `s3:*`; validação
de upload autoritativa no servidor (`lib/uploadPolicy.ts`); `.env.example` criado.

> **Ação humana obrigatória:** a credencial MinIO que estava no código **continua válida no servidor** e
> **no histórico do Git**. Esta mudança impede nova exposição, mas só a **rotação da credencial** elimina a
> exposição passada. Isso vale para qualquer novo deploy.

### 2.2 Worktrees e Branches ativos

| Caminho                      | Branch                        | Finalidade                                                             |
| ---------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `/var/code/inventory`        | `fix/revert-classification`   | Revert + Estágio 1 (commitado, tree limpo).                            |
| `/tmp/opencode/inventory-p0` | `chore/security-p0-debt`      | Correções de segurança P0 — **rebased sobre `fix/revert-classification`**. |

O worktree P0 contém o mesmo código-base da branch principal; a diferença entre elas é **apenas** o
conjunto de correções de segurança.

### 2.3 Ordem de trabalho sugerida para a próxima sessão

1. ~~Commitar o trabalho de revert~~ — **feito** (6 commits).
2. ~~Commitar o Estágio 1~~ — **feito** (1 commit).
3. ~~Remover credenciais hardcoded de `lib/minio.ts` e `upload-url.ts`~~ — **feito**.
4. ~~Fechar os endpoints públicos e o `GET /api/users` sem auth~~ — **feito**.
5. **Rotacionar a credencial MinIO no servidor** — antes de qualquer deploy. Não é feito por IA.
6. ~~`fix/build-docker`~~ — **feito**: `yarn build:opt` no Dockerfile, runner standalone non-root,
   cache mount do BuildKit, e as duas correções que só apareceram ao rodar o build completo
   (`bash` ausente no alpine e `prisma generate` na ordem de layers errada). Imagem de 341MB **validada**.
7. ~~`refactor/auth-helper`~~ — **feito**: `lib/apiAuth.ts` consolida a verificação de JWT de ~20 arquivos;
   corrigidos de passagem 3 endpoints que não verificavam token e o `revert` que devolvia 500 para 401.
   O gate de RBAC do `signup` voltou a aceitar `DIRECTOR`.
8. ~~**Bump de versão para `2.22.7`~~** — **feito**, mas o patch estava errado: o trabalho da branch
   `refactor/auth-helper` somava correção de segurança, correção de build, refactor de auth em ~20 endpoints
   e correção de RBAC, com mudança de comportamento observável. Rebaixado para **`2.23.0`** (minor) com
   `npm version 2.23.0 --no-git-tag-version`. **Falta criação humana da branch `inventory-v2.23.0` e da tag
   `v2.23.0`** — a branch antiga `inventory-v2.22.7` **não** deve ser criada.
9. `fix/creator-access-flag` — resolvido nesta sessão junto: `CREATOR_ACCESS_ENABLED` não existia no `.env`
   nem no `.env.example`, então `/api/creator-access` respondia 403 sempre; e o `seed` criava o admin master
   sem `isCreator`. Ambos corrigidos e cobertos por teste.
10. `test/coverage-baseline` — elevar a cobertura: o gate hoje se aplica só à superfície de segurança (§3.3 #1).
11. `chore/docker-compose-env` — `compose.yml` não declara `MINIO_*` nem `JWT_SECRET`, e o serviço `app`
    usa `command: yarn dev` com bind-mount do código (a imagem construída não é usada).

---

## 3. Known Issues & Blockers

### 3.1 🔴 P0 — Segurança

> **Itens 1 a 10 foram corrigidos nesta branch** (`chore/security-p0-debt`) — ver `CHANGELOG.md`.
> **Os itens 11 e 12 continuam abertos.** A coluna *Estado* reflete a situação pós-correção.

| #   | Problema                                                       | Onde                                                                | Estado / Impacto                                                                                                                                     |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Credenciais MinIO hardcoded** como fallback de `process.env` | `lib/minio.ts` · `pages/api/storage/upload-url.ts`                  | ✅ **Código corrigido** — `requireEnv()` falha no import se a variável faltar. ⚠️ **A credencial segue válida no servidor e no histórico do Git: só a rotação elimina a exposição passada.** |
| 2   | **Host/IP de produção hardcoded**                              | `lib/minio.ts` · `upload-url.ts` · `next.config.ts`                 | ✅ **Corrigido** — nenhum host em código; `remotePatterns` vem de `MINIO_PUBLIC_ENDPOINT` e falha fechado se ausente.                             |
| 3   | **`/api/storage/upload-url` público e sem auth**               | `middleware.ts` · `pages/api/storage/upload-url.ts`                 | ✅ **Corrigido** — saiu de `PUBLIC_PATHS` e passou a exigir sessão no handler.                                                                      |
| 4   | **`/api/storage/delete-url` público**                          | `pages/api/storage/delete-url.ts`                                   | ✅ **Corrigido** — exige sessão no handler.                                                                                                          |
| 5   | **`/api/qrcode/public-get` público**                           | `middleware.ts` · `pages/api/qrcode/public-get.ts`                  | ✅ **Corrigido** — exige sessão no handler. Estava fora do matcher do middleware; agora a proteção não depende dele.                                  |
| 6   | **`GET /api/users` sem auth no handler**                       | `pages/api/users/index.ts`                                          | ✅ **Corrigido** — passou a usar `authMiddleware`.                                                                                                     |
| 7   | **`GET /api/users/check-director` sem auth**                   | `pages/api/users/check-director.ts`                                 | ✅ **Corrigido** — passou a usar `authMiddleware`.                                                                                                     |
| 8   | **`/api/actives/update` sem auth no handler**                  | `pages/api/actives/update.ts`                                       | ✅ **Corrigido** — deixou de depender só do middleware.                                                                                               |
| 9   | **`inventory-policy.json` concede `s3:*`**                     | `inventory-policy.json`                                             | ✅ **Restrito** a `GetObject`/`PutObject`/`DeleteObject`. ⚠️ **Requer aplicar a nova policy no MinIO** — o arquivo só tem efeito depois de aplicado no servidor. |
| 10  | **Validação de upload só no cliente**                          | `lib/uploadPolicy.ts` (novo) · `pages/api/storage/upload-url.ts`    | ✅ **Corrigido** — validação autoritativa no servidor (tipo, coerência MIME×extensão e 10 MB).                                                        |
| 11  | **Logout não revoga o token**                                  | `pages/api/auth/logout.ts`                                          | 🔴 **ABERTO** — JWT válido por até **8 h** após logout. Sem denylist de sessão.                                                                       |
| 12  | **Segredos no histórico do Git**                               | `git log`                                                           | 🔴 **ABERTO** — **não reescrever histórico.** Remediação = **rotacionar a credencial no servidor** (ação humana, §2.3 item 5).                       |

**Bloqueia release?** Não foi declarado bloqueador duro por decisão do usuário em 25/09/2026. Antes de
qualquer novo deploy: **rotacionar a credencial MinIO** (item 12) e **aplicar a nova `inventory-policy.json`**
no servidor (item 9) — as duas são ações humanas, não de código.

### 3.2 🟠 P1 — Build e Corretude

| #   | Problema                                                     | Onde                                 | Detalhe                                                                                                                                                 |
| --- | ------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ~~**`yarn build` não existe** no `package.json`~~ — **corrigido** | `Dockerfile`                       | O build da imagem usava `yarn build` e quebrava (`error Command "build" not found`). Passou a usar `yarn build:opt`, e o runner foi reescrito para o layout `output: "standalone"` (cache mount do BuildKit, usuário não-root). ⚠️ **O `docker build` completo não foi executado até o fim por falta de espaço em disco no host** — ver `CHANGELOG.md`. `docker build --check` passa. |
| 2   | `package-lock.json` não rastreado + `yarn.lock` modificado   | raiz                                 | Artefato de `npm install` acidental. **Remover o `package-lock.json`** e restaurar `yarn.lock`.                                                         |
| 3   | ~~`String()` sem argumento~~ — **corrigido**                | `pages/api/storage/upload-url.ts`                                    | O `activeId` agora é lido do formulário e vinculado ao ativo quando informado.                                                                              |
| 4   | ~~`echo "$ comando"`~~ — **corrigido**                    | `scripts/build-optimized.sh` | Passou a `echo "> comando"`. Também corrigido: `next build` falhava com `command not found` fora do `yarn run` (`node_modules/.bin` não está no `PATH`); agora usa `yarn next build`. |
| 5   | ~~`remotePatterns.port: ''`~~ — **corrigido**               | `next.config.ts`                                                      | Propriedade omitida; `remotePatterns` agora deriva de `MINIO_PUBLIC_ENDPOINT`.                                                                            |
| 6   | JSON inválido (vírgula final)                                | `.vscode/settings.json:8`            | VS Code reporta erro de parse.                                                                                                                          |
| 7   | `/qrcode` em `PUBLIC_PATHS` mas sem `pages/qrcode/index.tsx` | `middleware.ts:17`                   | A rota `/qrcode` retorna 404. Existe apenas `/qrcode/view`.                                                                                             |
| 8   | Shield de "setup inicial" totalmente comentado               | `middleware.ts:41-59`                | A verificação é feita client-side em `pages/login.tsx:16-38`. Fragilidade conhecida.                                                                    |
| 9   | `next lint` depreciado                                       | `package.json:9`                     | Removido no Next 15.5+. Migrar para `eslint .` (o flat config já está pronto).                                                                          |

### 3.3 🟡 P2 — Manutenção e Qualidade

| #   | Problema                                                                       | Onde                                                                                                                                               |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Cobertura de testes ainda parcial** — runner instalado, mas longe do alvo | projeto inteiro                                                                                                                                    | `vitest` está instalado e roda (**101 testes**), mas o gate de cobertura se aplica hoje **só à superfície de segurança** (`lib/middlewares`, `lib/uploadPolicy.ts`, `pages/api/users/{index,check-director}.ts` — 83% linhas / 80% branches). O alvo de `SPECS.md` §5.2 (70–80% por domínio em todo `pages/api/**`) permanece **pendente** e exige cobrir os 36 endpoints. |
| 2   | **Nenhuma CI**                                                                 | sem `.github/`                                                                                                                                     |
| 3   | ~~**Verificação de JWT replicada**~~ — **consolidada**           | `lib/apiAuth.ts` (`getSessionUser`)                                 | A sequência `req.cookies.auth_token \|\| authorization.replace("Bearer ") → jwtVerify` estava replicada em ~20 arquivos de `pages/api/**`, com o prefixo `Bearer` não validado e a leitura do id divergente. Todos passaram a usar `getSessionUser()`, que delega a `verifyAuthToken()` (`lib/auth.ts`, fonte de verdade). `authMiddleware` continua sendo o wrapper para handlers que querem o 401 padronizado. |
| 4   | **`components/ListSection.tsx` tem 1.927 linhas**                              | UI + modais + impressão + context menu + upload + revert                                                                                           |
| 5   | **12 dependências declaradas e nunca importadas**                              | `recharts`, `framer-motion`, `react-rnd`, `@headlessui/react`, `axios`, `jsonwebtoken`, `js-cookie`, `jwt-decode`, `eruda`, `uuid`, `qrcode.react` |
| 6   | **Espaço de IDs pequeno**: `Active.id`/`FatherSpace.id` = 4 chars hex (65.536) | `lib/prisma.ts:8-24` — colisão plausível em inventário grande                                                                                      |
| 7   | `DEBUG_ALLOW_JWT` no `.env` nunca é lido no código                             | `.env` — variável morta, remover                                                                                                                   |
| 8   | `COOKIE_SECURE` e `NEXT_PUBLIC_BASE_URL` ausentes do `.env`                    | `pages/api/auth/login.ts:49`, `pages/api/auth/logout.ts:13`                                                                                        |
| 9   | Sem `.env.example` (`.gitignore:34` usa `.env*` e bloqueia)                    | —                                                                                                                                                  |
| 10  | `skipLibCheck`, `noUncheckedIndexedAccess`, `noUnusedLocals` ausentes          | `tsconfig.json`                                                                                                                                    |
| 11  | `content` do Tailwind não cobre `lib/`, `types/`, `styles/`                    | `tailwind.config.mjs:6-9`                                                                                                                          |
| 12  | `Active.categoryId` obrigatório mas relação `category` opcional                | `prisma/schema.prisma:84` vs `:100`                                                                                                                |
| 13  | `Movement Movement[]` em PascalCase                                            | `prisma/schema.prisma:105`                                                                                                                         |
| 14  | `README.md` desatualizado (versão, `yarn dev`, stack duplicada, nº de anexos)  | `README.md:6,30-38,44`                                                                                                                             |
| 15  | 6 SVG de boilerplate do Next sem uso                                           | `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`                                                                             |

### 3.4 Estado do Working Tree

**Limpo** — todo o trabalho do revert (6 commits) e do Estágio 1 (1 commit) foi commitado na branch
`fix/revert-classification`. Nada pendente de autorização.

- `yarn.lock` e `package-lock.json` — ver §3.2 #2 (artefato de `npm install` acidental).

### 3.5 Dependências do ambiente

- **MariaDB** precisa de **system-versioning** habilitado. Sem isso, `/api/database/revert` quebra.
- **⚠️ Produção:** a tabela `Active` **não** tem `WITH SYSTEM VERSIONING` em produção
  (`prisma/schema.prisma` sem systemVersioning, nenhuma migration) — o `GET /api/database/revert`
  falharia em produção. O `revert_probe` é o único banco com system-versioning ativo.
- **MinIO** é **externo** ao `compose.yml`. `compose.yml` não declara `MINIO_*` nem `JWT_SECRET`.
- Sem `JWT_SECRET` definido, o app **crasha** em `lib/auth.ts:8`.
- `next.config.ts` só libera `next/image` para `minio.meganuv.com:80`.
- **Dívida conhecida do revert (fora de escopo desta correção):** o `GET` lista apenas `Active`
  enquanto o `POST` aceita 3 tabelas (`Active`, `FatherSpace`, `Category`) — assimetria registrada;
  os módulos `lib/revert/*` já são table-agnostic.

---

## 4. Versionamento e Release

**Convenção adotada (decidida em 25/09/2026): versionamento por branch dedicada.**

- A **versão** mora em `package.json:3` e é exposta via `lib/version.ts` para o rodapé.
- Cada release cria uma branch `inventory-vX.Y.Z` e faz merge para `main` — ver o histórico
  (`v2.22.5`, `inventory-v2.22.6`) e os merges `e5262f6`, `3347121` de sincronização dev→produção.
- Branch de versão é **proibida para a IA**: sem `push`, sem `tag`, sem commit direto.
- A IA trabalha apenas em branch própria (`<tipo>/<slug>`) e reporta ao usuário.
- **Bump de versão pela IA:** `npm version <X.Y.Z> --no-git-tag-version`. O `--no-git-tag-version` é
  obrigatório — sem ele o `npm version` cria tag e commit automático, e a IA não cria tag
  (`AGENTS.md` §3.2). O comando **não** altera o `yarn.lock`. Bump em `package.json` é suficiente:
  `lib/version.ts` lê a versão de lá, sem hardcode.
- **Versão atual: `2.23.0`** (bumped de `2.22.7`, **minor**). O patch para `2.22.7` era incorreto: a série
  `refactor/auth-helper` carrega correção de segurança, correção de build, refactor de auth em ~20 endpoints
  e correção de RBAC, com **mudança de comportamento observável** (novo campo `creatorAccessEnabled` em
  `/api/auth/me`, botões condicionais na UI, novo `isCreator` no seed) — isso é minor, não patch.
  A branch `inventory-v2.23.0` e a tag `v2.23.0` são criação humana; a `inventory-v2.22.7` **não** deve ser
  criada.
- `npm` é proibido para **instalar** dependências (`AGENTS.md` §3.3), mas `npm version` é seguro: ele
  não toca em lockfile nem em `node_modules`.

**Histórico de branches:** `main` · `inventory-v2.0.0` · `inventory-v2.22.1` · `inventory-v2.22.4` ·
`inventory-v2.22.6` · `v2.22.5` · `inventory-2.0` · `arena/01a0b6ab-meganuv-inventory`.

---

## 5. Pontos de Entrada para uma IA queacabou de chegar

1. `AGENTS.md` §0 (ordem de leitura) e §3 (regras invioláveis).
2. Este arquivo, §2 (foco) e §3 (débitos) — **não repita o que já está aqui**.
3. `SPECS.md` §3.2 (mapa de diretórios) e §5 (DoD).
4. `opencode.json` — o que o watcher indexa e quais MCP estão disponíveis.
5. Se a tarefa tocar segurança → worktree `/tmp/opencode/inventory-p0`, branch `chore/security-p0-debt`.
