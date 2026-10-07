# CONTEXT.md — Contexto Atual do Projeto

> **Este arquivo é a foto do "agora".** É atualizado a **cada sessão** de trabalho de IA.
> Ele responde: o que o sistema é, o que está em foco agora, e o que está quebrado.
> Não é um documento normativo — para regras, ver `AGENTS.md` e `SPECS.md`.

**Última atualização:** 06/10/2026 · **Branch do worktree principal:** `fix/revert-classification` ·
**Versão:** `2.22.6` · **Documentos canônicos:** `AGENTS.md`, `SPECS.md`, `OPENCODE.md`

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

> **Correção da classificação de reversão (revert).**
> Causa-raiz provada no banco `revert_probe` (MariaDB com system-versioning): a classificação de ação
> morava dentro do handler `pages/api/database/revert.ts` e estava invertida — registro criado e nunca
> alterado era rotulado `CREATE` em vez de `MOVE`/`UPDATE`, registro com única versão vigente era
> **omitido** da listagem, e registro deletado era rotulado `CREATE` em vez de `DELETE`. O `POST`
> (execução da reversão) estava correto — o defeito era de rótulo/listagem, não de corrupção de dados.

Estado: **implementado e commitado na branch `fix/revert-classification`** (módulos puros `lib/revert/*`,
testes unitários + API com Prisma mockado, teste de integração opt-in, autoridade do timestamp no POST,
remoção dos gatilhos mortos do popup e vocabulário unificado). Gates verdes: `lint`, `tsc`, `prisma
validate`, `build:opt`, `vitest` (69 passando, 5 pulados — integração opt-in). 6 commits aprovados pelo
usuário e executados (ver `git log`); **Estágio 1 também commitado** (autorizado pelo usuário) — working
tree limpo.

### 2.2 Worktrees e Branches ativos

| Caminho                      | Branch                   | Finalidade                                                  |
| ---------------------------- | ------------------------ | ----------------------------------------------------------- |
| `/var/code/inventory`        | `fix/revert-classification` | Correção da classificação de reversão (foco atual).      |
| `/tmp/opencode/inventory-p0` | `chore/security-p0-debt` | **Isolado.** Correções de segurança P0 (§3.1).              |

O worktree P0 está **limpo** — nenhuma correção implementada ainda. É o destino natural da próxima sessão de IA.

### 2.3 Ordem de trabalho sugerida para a próxima sessão

1. ~~Commitar o trabalho de revert~~ — **feito** (6 commits: `test/revert-unit`, `fix/revert-classification`,
   `fix/revert-authority`, `fix/revert-popup-trigger`, `fix/revert-vocabulary`, `chore/revert-observability`).
2. ~~Commitar o Estágio 1~~ — **feito** (autorizado pelo usuário; renomeação `isSystem`→`isCreator`,
   formatação Prettier e ajustes de texto consolidados em um commit).
3. `chore/security-p0-debt` — remover credenciais hardcoded de `lib/minio.ts` e `pages/api/storage/upload-url.ts`
   (rotacionar a credencial no MinIO **antes** — ela está no histórico do Git).
4. `chore/security-p0-debt` — fechar os 3 endpoints públicos e o `GET /api/users` sem auth.
5. `fix/build-docker` — corrigir `Dockerfile:7` (`yarn build` não existe).
6. `refactor/auth-helper` — consolidar as ~22 verificações de JWT em um helper único.

---

## 3. Known Issues & Blockers

### 3.1 🔴 P0 — Segurança (dívida crítica ABERTA)

| #   | Problema                                                       | Onde                                                                | Impacto                                                                                                                                                     |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Credenciais MinIO hardcoded** como fallback de `process.env` | `lib/minio.ts:9-10,18-19` · `pages/api/storage/upload-url.ts:14-15` | Qualquer pessoa com acesso ao repositório tem a chave do bucket. **Está no histórico do Git** — não some ao remover.                                        |
| 2   | **Host/IP de produção hardcoded**                              | `lib/minio.ts:6,15` · `upload-url.ts:11,40` · `next.config.ts:21`   | Vaza topologia de infraestrutura.                                                                                                                           |
| 3   | **`/api/storage/upload-url` público e sem auth**               | `middleware.ts:13` + handler sem verificação                        | **Upload anônimo** no bucket. Vetor de DoS de storage.                                                                                                      |
| 4   | **`/api/storage/delete-url` público**                          | `middleware.ts` (`PUBLIC_PATHS`)                                    | **Exclusão anônima** de objetos do bucket, se a URL for conhecida.                                                                                          |
| 5   | **`/api/qrcode/public-get` público**                           | `middleware.ts:12` + fora do matcher (`middleware.ts:98`)           | **Vazamento de inventário**: nome, SKU/EAN, fabricante, modelo, **número de série**, valor e anexos com presigned URL de 1 h, sem nenhuma autenticação. |
| 6   | **`GET /api/users` sem auth no handler**                       | `pages/api/users/index.ts:13-31`                                    | Lista de todos os usuários (nome, e-mail, papel) a qualquer pessoa que alcance o endpoint.                                                                  |
| 7   | **`GET /api/users/check-director` sem auth**                   | `pages/api/users/index.ts`                                          | Vaza se já existe DIRECTOR.                                                                                                                                 |
| 8   | **`/api/actives/update` sem auth no handler**                  | `pages/api/actives/update.ts`                                       | Confia apenas no middleware. Qualquer brecha futura no middleware vira escrita não autenticada.                                                             |
| 9   | **`inventory-policy.json` concede `s3:*`**                     | `inventory-policy.json:5-8`                                         | A mesma credencial de aplicação pode **deletar o bucket** e gerenciar ACLs.                                                                                 |
| 10  | **Validação de upload só no cliente**                          | `components/FileUpload.tsx:134`                                     | Limite de 10 MB e tipo de arquivo não são aplicados no servidor.                                                                                            |
| 11  | **Logout não revoga o token**                                  | `pages/api/auth/logout.ts`                                          | JWT válido por até **8 h** após logout. Sem denylist de sessão.                                                                                             |
| 12  | **Segredos no histórico do Git**                               | `git log`                                                           | **Não reescrever histórico.** Remediação = rotacionar a credencial no servidor.                                                                             |

**Bloqueia release?** Não foi declarado bloqueador duro por decisão do usuário em 25/09/2026, mas
qualquer novo deploy deve considerar os itens 1, 3, 4 e 5.

### 3.2 🟠 P1 — Build e Corretude

| #   | Problema                                                     | Onde                                 | Detalhe                                                                                                                                                 |
| --- | ------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`yarn build` não existe** no `package.json`                | `Dockerfile:7`                       | O build da imagem Docker **está quebrado hoje**: `error Command "build" not found`. O script correto é `yarn build:opt` (`scripts/build-optimized.sh`). |
| 2   | `package-lock.json` não rastreado + `yarn.lock` modificado   | raiz                                 | Artefato de `npm install` acidental. **Remover o `package-lock.json`** e restaurar `yarn.lock`.                                                         |
| 3   | `String()` sem argumento                                     | `pages/api/storage/upload-url.ts:25` | Sempre retorna `""` → o `active` retornado é sempre `null` e vai na resposta.                                                                           |
| 4   | `echo "$ comando"` com `$` literal                           | `scripts/build-optimized.sh:4-7`     | Deveria ser `set -x` ou `echo "comando"`.                                                                                                               |
| 5   | `remotePatterns.port: ''`                                    | `next.config.ts:22`                  | Código de porta vazio pode rejeitar URL com porta explícita. Omitir a propriedade.                                                                      |
| 6   | JSON inválido (vírgula final)                                | `.vscode/settings.json:8`            | VS Code reporta erro de parse.                                                                                                                          |
| 7   | `/qrcode` em `PUBLIC_PATHS` mas sem `pages/qrcode/index.tsx` | `middleware.ts:17`                   | A rota `/qrcode` retorna 404. Existe apenas `/qrcode/view`.                                                                                             |
| 8   | Shield de "setup inicial" totalmente comentado               | `middleware.ts:41-59`                | A verificação é feita client-side em `pages/login.tsx:16-38`. Fragilidade conhecida.                                                                    |
| 9   | `next lint` depreciado                                       | `package.json:9`                     | Removido no Next 15.5+. Migrar para `eslint .` (o flat config já está pronto).                                                                          |

### 3.3 🟡 P2 — Manutenção e Qualidade

| #   | Problema                                                                       | Onde                                                                                                                                               |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **0% de cobertura de testes** e nenhum runner instalado                        | projeto inteiro                                                                                                                                    |
| 2   | **Nenhuma CI**                                                                 | sem `.github/`                                                                                                                                     |
| 3   | **Verificação de JWT replicada em ~22 arquivos**                               | `pages/api/**`; `lib/middlewares/authMiddleware.ts` é usado por **1** arquivo (`protected.ts`)                                                     |
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

**Histórico de branches:** `main` · `inventory-v2.0.0` · `inventory-v2.22.1` · `inventory-v2.22.4` ·
`inventory-v2.22.6` · `v2.22.5` · `inventory-2.0` · `arena/01a0b6ab-meganuv-inventory`.

---

## 5. Pontos de Entrada para uma IA queacabou de chegar

1. `AGENTS.md` §0 (ordem de leitura) e §3 (regras invioláveis).
2. Este arquivo, §2 (foco) e §3 (débitos) — **não repita o que já está aqui**.
3. `SPECS.md` §3.2 (mapa de diretórios) e §5 (DoD).
4. `opencode.json` — o que o watcher indexa e quais MCP estão disponíveis.
5. Se a tarefa tocar segurança → worktree `/tmp/opencode/inventory-p0`, branch `chore/security-p0-debt`.
