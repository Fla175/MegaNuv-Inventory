# CONTEXT.md — Contexto Atual do Projeto

> **Este arquivo é a foto do "agora".** É atualizado a **cada sessão** de trabalho de IA.
> Ele responde: o que o sistema é, o que está em foco agora, e o que está quebrado.
> Não é um documento normativo — para regras, ver `AGENTS.md` e `SPECS.md`.

**Última atualização:** 21/10/2026 · **Branch:** `refactor/modularize-ui`
**Versão:** `2.25.2` · **Documentos canônicos:** `AGENTS.md`, `SPECS.md`, `OPENCODE.md`

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

> **Execução da `ADR/ADR-001.md` — Etapas 0, 1, 2 e 3 concluídas, em branches empilhadas.**
> Etapa 0 (`fix/actives-write-authz`, `49a2b58`): autorização de escrita em `clone-batch` e `update`.
> Etapa 1 (`fix/actives-value-visibility`, `d76992a`): redação de `fixedValue` por papel, preservação
> do campo ausente no update e soma do patrimônio no servidor. Etapa 2
> (`fix/frontend-duplication-silent-errors`, `c81c91f`): `SearchableSelect` único em `components/ui/`
> com a semântica de `"default"` reconciliada em módulo puro, `parseFileUrls` como cópia única nas
> duas telas, `fetchData` de `settings` notificando falha, e prévia/cascata da subárvore de espaço
> (`GET /api/father-spaces/delete`) avisando o que será excluído. Etapa 3
> (`fix/quality-a11y-lint`): modais com `role="dialog"`/`aria-modal` e `Esc` nos cinco
> (3.1); labels associados com `htmlFor`/`id` (3.2); `FileUpload` delegando a
> `lib/uploadPolicy.ts` — fim do bypass de `application/octet-stream` (3.3); `types/inventory.ts`
> finalmente usado via `InventoryItem`, sem os `any` de `ListSection`/`activeForm`/`pages/index`
> (3.4); `eslint .` cobrindo `__tests__`, com os **149 erros** corrigidos e helper compartilhado
> `__tests__/helpers/http.ts` (3.5); contagens do `SPECS.md`/`CONTEXT.md` (3.6); código morto
> removido e comentários PT-BR traduzidos (3.7); typo do cabeçalho do `ListSection` (3.8).
> Gates da Etapa 3: `eslint .`/tsc/prisma limpos, **260 testes** passando, build standalone 90M.
>
> **`ADR-002` — matriz RBAC canônica — concluída em `fix/rbac-matrix` (20/10/2026).** A matriz de
> `SPECS.md` §4.2 passou a separar ativos/categorias de espaços e a refletir a decisão de
> `fixedValue` de 18/10. No código: espaços Pai ficaram com DIRECTOR/ADMIN (a UI já os mostrava; a
> API só aceitava ADMIN); a gestão de usuários voltou à matriz (DIRECTOR todos; ADMIN exceto
> DIRECTOR; MANAGER só VIEWER) e fechou a escalada em que um MANAGER criava/editava/excluía
> DIRECTOR; logs passaram a ser apagáveis por DIRECTOR/ADMIN (MANAGER só lê). A política vive em
> `lib/rbac.ts`; `POST`/`PATCH /api/users` não devolvem mais o hash de senha. **90 testes novos**
> (350 no total), validados por mutação 5/7/4/3. Gates: `eslint .`/tsc/prisma limpos, build 90M.

> **Contexto herdado — release de documentação `2.25.2` — implementada e verificada antes:**
> (a) **correção do drift de contagem de testes** no `SPECS.md` §5.2, que fixava um número
> envelhecido em vez de apontar para a saída de `yarn test`, e em duas células do `CONTEXT.md` (§2.1 e
> §3.3 #1); (b) **consolidação da dívida #17** em linha de tabela legível + nova subseção §3.3.1 com o
> **passo a passo de criação da credencial do auditor** (`mc admin user add` / `policy create` /
> `policy attach`). A credencial do auditor **continua não criada** — status permanece
> **PENDENTE, ação humana**. Bump para **`2.25.2`** (patch) na mesma branch.

> **Contexto herdado — correção de deleção de anexo no MinIO — implementada e verificada antes:** > `deleteFileFromMinio` (`lib/minio.ts`) derivava a chave do objeto com
> `split('/').pop()`, o que apagava o **objeto errado** com subpasta e transformava um **link
> externo** em chave de deleção dentro do bucket `inventory`. A chave agora é extraída pela função
> canônica `getMinioKeyFromUrl()` (`lib/mediaUrl.ts`), link externo é ignorado sem erro, o `catch`
> mudo virou `console.warn` com URL e motivo, e a assinatura passou a aceitar `undefined`.
> 11 testes de regressão em `__tests__/lib/minio-delete.test.ts` — 6 deles falham contra a
> implementação antiga (validação por mutação). Regras em `SPECS.md` §5.1, dívida em
> `CONTEXT.md` §3.3 #18. Bump para **`2.25.1`** (patch) na mesma branch.

> **Contexto herdado — security P0 (§3.1) — implementado e verificado antes:**
> Foco da sessão anterior: remover credenciais/hosts de produção do código e fechar os endpoints que
> estavam alcançáveis sem autenticação.

Estado: **implementado na branch `chore/security-p0-debt`**, que foi **rebaseada sobre
`fix/revert-classification`** (o rebase foi necessário porque a branch original derivava de
`inventory-v2.22.6` e não tinha o framework de documentação — `AGENTS.md`, `CHANGELOG.md`,
`CONTEXT.md`, `SPECS.md` foram criados depois; sem eles a regra `AGENTS.md` §3.4 não podia ser cumprida).

Gates executados e verdes: `yarn lint` (0 erros), `npx tsc --noEmit` (0 erros), `npx prisma validate`
(schema válido), `yarn build:opt` (standalone 90M), `yarn test` (suíte inteira passando, incluindo os
pulados da integração opt-in) e cobertura da superfície de segurança em **83% de linhas / 80% de
branches**, acima do gate de 70%. A contagem exata de testes não é fixada aqui — ver `SPECS.md` §5.2.

Corrigido nesta branch (detalhe no `CHANGELOG.md`): credenciais MinIO e hosts de produção removidos do
código; `authMiddleware` aceitando cookie além de Bearer; autenticação no handler de
`/api/storage/upload-url`, `/api/storage/delete-url`, `/api/qrcode/public-get`, `GET /api/users`,
`GET /api/users/check-director` e `PUT /api/actives/update`; `inventory-policy.json` sem `s3:*`; validação
de upload autoritativa no servidor (`lib/uploadPolicy.ts`); `.env.example` criado.

> **Ação humana obrigatória:** a credencial MinIO que estava no código **continua válida no servidor** e
> **no histórico do Git**. Esta mudança impede nova exposição, mas só a **rotação da credencial** elimina a
> exposição passada. Isso vale para qualquer novo deploy.

### 2.2 Worktrees e Branches ativos

| Caminho                      | Branch                      | Finalidade                                                                 |
| ---------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `/var/code/inventory`        | `fix/revert-classification` | Revert + Estágio 1 (commitado, tree limpo).                                |
| `/tmp/opencode/inventory-p0` | `chore/security-p0-debt`    | Correções de segurança P0 — **rebased sobre `fix/revert-classification`**. |

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
8. ~~**Bump de versão**~~ — **feito**: para **`2.23.0`** (minor) com
   `npm version 2.23.0 --no-git-tag-version`. O bump para `2.22.7` foi rebaixado porque a série
   `refactor/auth-helper` soma correção de segurança, correção de build, refactor de auth em ~20 endpoints
   e correção de RBAC, com mudança de comportamento observável. **Falta criação humana da branch
   `inventory-v2.23.0` e da tag `v2.23.0`** — a branch antiga `inventory-v2.22.7` **não** deve ser criada.
9. ~~`fix/creator-access-flag`~~ — **resolvido e depois revertido por decisão do dono**: o
   `CREATOR_ACCESS_ENABLED` não existia no `.env` nem no `.env.example`, então `/api/creator-access`
   respondia 403 sempre. A correção inicial foi **declarar a flag**; o dono **rejeitou essa abordagem**:
   as duas feature flags foram **removidas do código**. O Acesso do Criador é agora **sempre ativo** e
   **sempre exige a senha do criador** (o dono guarda as senhas no Bitwarden, então não há atrito).
   Causa raiz registrada: flag obrigatória disfarçada de opcional degradou em silêncio.
10. ~~`test/coverage-baseline`~~ — **parcial**: `lib/mediaReferences.ts` entrou com 25 testes unitários
    (puro, sem I/O). O gate de cobertura em si **continua** se aplicando só à superfície de segurança
    (§3.3 #1) e o alvo de 70–80% em todo `pages/api/**` segue pendente.
11. `chore/docker-compose-env` — `compose.yml` não declara `MINIO_*` nem `JWT_SECRET`, e o serviço `app`
    usa `command: yarn dev` com bind-mount do código (a imagem construída não é usada).
12. **Criar a credencial do auditor de órfãos no MinIO** — §3.3 #17. **Ação humana, anterior ao primeiro uso
    de `scripts/audit-minio.ts`:** (a) usuário MinIO separado, (b) aplicar
    `inventory-policy-auditor.json`, (c) `MINIO_AUDIT_ACCESS_KEY` / `MINIO_AUDIT_SECRET_KEY` no ambiente.
    Não há MinIO local, e o de produção **não tem versioning** — por isso a auditoria foi validada só por
    unidade. Fazer uma execução de leitura com `--saida`, conferir a lista contra anexos conhecidos de um
    ativo, e só então considerar `--apagar --confirmar`.

---

## 3. Known Issues & Blockers

### 3.1 🔴 P0 — Segurança

> **Itens 1 a 10 foram corrigidos nesta branch** (`chore/security-p0-debt`) — ver `CHANGELOG.md`.
> **Itens 13 e 14 foram corrigidos pela Etapa 0 da `ADR/ADR-001.md`** (branch `fix/actives-write-authz`).
> **Itens 15 (e 14, par 1.2) pela Etapa 1** (branch `fix/actives-value-visibility`).
> **Os itens 11 e 12 continuam abertos.** A coluna _Estado_ reflete a situação pós-correção.

| #   | Problema                                                       | Onde                                                             | Estado / Impacto                                                                                                                                                                             |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Credenciais MinIO hardcoded** como fallback de `process.env` | `lib/minio.ts` · `pages/api/storage/upload-url.ts`               | ✅ **Código corrigido** — `requireEnv()` falha no import se a variável faltar. ⚠️ **A credencial segue válida no servidor e no histórico do Git: só a rotação elimina a exposição passada.** |
| 2   | **Host/IP de produção hardcoded**                              | `lib/minio.ts` · `upload-url.ts` · `next.config.ts`              | ✅ **Corrigido** — nenhum host em código; `remotePatterns` vem de `MINIO_PUBLIC_ENDPOINT` e falha fechado se ausente.                                                                        |
| 3   | **`/api/storage/upload-url` público e sem auth**               | `middleware.ts` · `pages/api/storage/upload-url.ts`              | ✅ **Corrigido** — saiu de `PUBLIC_PATHS` e passou a exigir sessão no handler.                                                                                                               |
| 4   | **`/api/storage/delete-url` público**                          | `pages/api/storage/delete-url.ts`                                | ✅ **Corrigido** — exige sessão no handler.                                                                                                                                                  |
| 5   | **`/api/qrcode/public-get` público**                           | `middleware.ts` · `pages/api/qrcode/public-get.ts`               | ✅ **Corrigido** — exige sessão no handler. Estava fora do matcher do middleware; agora a proteção não depende dele.                                                                         |
| 6   | **`GET /api/users` sem auth no handler**                       | `pages/api/users/index.ts`                                       | ✅ **Corrigido** — passou a usar `authMiddleware`.                                                                                                                                           |
| 7   | **`GET /api/users/check-director` sem auth**                   | `pages/api/users/check-director.ts`                              | ✅ **Corrigido** — passou a usar `authMiddleware`.                                                                                                                                           |
| 8   | **`/api/actives/update` sem auth no handler**                  | `pages/api/actives/update.ts`                                    | ✅ **Corrigido** — deixou de depender só do middleware.                                                                                                                                      |
| 9   | **`inventory-policy.json` concede `s3:*`**                     | `inventory-policy.json`                                          | ✅ **Restrito** a `GetObject`/`PutObject`/`DeleteObject`. ⚠️ **Requer aplicar a nova policy no MinIO** — o arquivo só tem efeito depois de aplicado no servidor.                             |
| 10  | **Validação de upload só no cliente**                          | `lib/uploadPolicy.ts` (novo) · `pages/api/storage/upload-url.ts` | ✅ **Corrigido** — validação autoritativa no servidor (tipo, coerência MIME×extensão e 10 MB).                                                                                               |
| 11  | **Logout não revoga o token**                                  | `pages/api/auth/logout.ts`                                       | 🔴 **ABERTO** — JWT válido por até **8 h** após logout. Sem denylist de sessão.                                                                                                              |
| 12  | **Segredos no histórico do Git**                               | `git log`                                                        | 🔴 **ABERTO** — **não reescrever histórico.** Remediação = **rotacionar a credencial no servidor** (ação humana, §2.3 item 5).                                                               |
| 13  | **`clone-batch` sem verificação de papel**                     | `pages/api/actives/clone-batch.ts`                               | ✅ **Corrigido** (Etapa 0 da `ADR/ADR-001.md`) — o handler **não importava `authMiddleware`** e não resolvia sessão: exportava-se cru. A proteção vinha só do `middleware.ts`, que valida **token, não papel** (`middleware.ts:58-86`), então qualquer `VIEWER` autenticado criava **até 50 cópias** de qualquer ativo (`qty` máx. 50 em `:18`), copiando `fixedValue` e `notes` (`:79-80`). Agora resolve a sessão com `getSessionUser`, barra `VIEWER` com `403`, registra `createdById` (`:95-99`) e é envolvido por `authMiddleware`. **Não era acesso anônimo** — o matcher do middleware cobre a rota; o defeito era qualquer sessão de menor privilégio escrever. 12 testes em `__tests__/api/actives-write-authz.test.ts`. |
| 14  | **`actives/update` sem verificação de papel**                   | `pages/api/actives/update.ts`                                    | ✅ **Corrigido** (Etapa 0) — usava `authMiddleware(handler)` **sem `requiredRoles`**, que é o terceiro parâmetro do helper (`lib/middlewares/authMiddleware.ts:24,51-55`) e **não tinha nenhum chamador no projeto**. Um `VIEWER` autenticado editava qualquer ativo por ID, e `applyToSimilar` (`:79-106`) propagava a alteração para todos os ativos de mesmo `name`/`manufacturer`/`model`/`sku` — escrita em N registros com um único `PUT`. Agora passa `["DIRECTOR","ADMIN","MANAGER"]`, o complemento de `VIEWER` na matriz RBAC, mesma semântica de `delete.ts:17` e `move.ts:41`. Corrigido de passagem: era o **único** arquivo a instanciar `new PrismaClient()` fora de `lib/prisma.ts`, o que o tornava **impossível de testar** com o mock do projeto. |
| 15  | **`fixedValue` no payload para quem não pode vê-lo + apagado pela edição sem o campo** | `actives/list.ts` · `actives/update.ts` · `qrcode/public-get.ts` · `qrcode/view.tsx` | ✅ **Corrigido** (Etapa 1 da `ADR/ADR-001.md`, `fix/actives-value-visibility`) — os três endpoints de leitura devolviam **todos** os escalares a qualquer papel autenticado: o gate de coluna da UI escondia o valor do `VIEWER`, mas o JSON entregava o patrimônio (`curl` bastava). E o `update` parseava `fixedValue` com `\|\| 0` incondicionalmente — **ausência era "zerar"**, destruindo o valor em silêncio no primeiro salvamento sem o campo (com `applyToSimilar`, em N). Agora `canViewValue(user)` (predicado puro em `lib/apiAuth.ts:64-77`, falha fechado) redige o campo **ausente do objeto**, não `undefined`; o `update` distingue ausente (preserva `originalActive.fixedValue`) de `0` explícito (zera); e o **"Valor Total" da tela do QR Code passou a ser somado no servidor** (`totalValue: 0` para `VIEWER`) — a soma client-side reduzia `sec.fixedValue`, que a resposta jamais carregou, e reportava só o valor da raiz. Regra de produto (dono, 18/10/2026): ADMIN/MANAGER/DIRECTOR veem e editam; somente VIEWER não vê. 16 testes em `__tests__/api/actives-value-visibility.test.ts`, validados por 6 mutações. |

**RBAC (ADR-002, 20/10/2026) — drifts fechados.** Três gates não correspondiam à matriz:
(a) `father-spaces/{create,update,delete}` exigiam ADMIN, embora a UI mostrasse a aba a DIRECTOR —
agora DIRECTOR/ADMIN via `canManageSpaces`; (b) `POST /api/users` só barrava MANAGER de criar ADMIN
e `users/[id]` só comparava com ADMIN — um MANAGER **criava/editava/excluía DIRECTOR**, e o DIRECTOR
não gerenciava ninguém; a matriz passou a ser aplicada (`canActOnUser`/`canAssignRole`), com DIRECTOR
singleton semeado apenas pelo criador; (c) `logs/clear` era ADMIN-only, mas a UI mostrava o botão
ao DIRECTOR — agora DIRECTOR/ADMIN apagam e MANAGER só lê. Testes em `__tests__/lib/rbac.test.ts` e
`__tests__/api/rbac-*.test.ts` (90 novos), validados por mutação.

> **`ADR-003` — modularização + Shadcn UI — Etapas A–D concluídas em `refactor/modularize-ui`.**
> `pages/dashboard.tsx` caiu para **124 linhas**, `components/ListSection.tsx` para **355** e
> `pages/settings.tsx` para **169**. A tela de settings foi dividida em
> `components/settings/*` (5 abas + 5 modais + header/nav/modais) e nove hooks de domínio
> (`useSettingsPermissions`, `useSettingsData`, `useRevertHistory`, `useCreatorAccess`,
> `useUserCrud`, `useSpaceCrud`, `useCategoryCrud`, `useThemeSettings`, `useSettingsDelete`).
> `ConfirmDialog` usa `Dialog` do Shadcn por dentro, com a API pública preservada para o
> `ListSection`; os formulários usam `Dialog` + `Select` e mantêm o clique no backdrop bloqueado.
> A etapa C foi reparada antes da D: o commit `027baec` havia deixado `ListSection` como stub e
> comentado a página; o orquestrador foi restaurado a partir de `69bcac3`.
> **Próximo foco:** Etapa E (revisão final do patch, docs e fechamento da ADR-003).

**Bloqueia release?** Não foi declarado bloqueador duro por decisão do usuário em 25/09/2026. Antes de
qualquer novo deploy: **rotacionar a credencial MinIO** (item 12) e **aplicar a nova `inventory-policy.json`**
no servidor (item 9) — as duas são ações humanas, não de código.

### 3.2 🟠 P1 — Build e Corretude

| #   | Problema                                                          | Onde                              | Detalhe                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ~~**`yarn build` não existe** no `package.json`~~ — **corrigido** | `Dockerfile`                      | O build da imagem usava `yarn build` e quebrava (`error Command "build" not found`). Passou a usar `yarn build:opt`, e o runner foi reescrito para o layout `output: "standalone"` (cache mount do BuildKit, usuário não-root). ⚠️ **O `docker build` completo não foi executado até o fim por falta de espaço em disco no host** — ver `CHANGELOG.md`. `docker build --check` passa. |
| 2   | `package-lock.json` não rastreado + `yarn.lock` modificado        | raiz                              | Artefato de `npm install` acidental. **Remover o `package-lock.json`** e restaurar `yarn.lock`.                                                                                                                                                                                                                                                                                       |
| 3   | ~~`String()` sem argumento~~ — **corrigido**                      | `pages/api/storage/upload-url.ts` | O `activeId` agora é lido do formulário e vinculado ao ativo quando informado.                                                                                                                                                                                                                                                                                                        |
| 4   | ~~`echo "$ comando"`~~ — **corrigido**                            | `scripts/build-optimized.sh`      | Passou a `echo "> comando"`. Também corrigido: `next build` falhava com `command not found` fora do `yarn run` (`node_modules/.bin` não está no `PATH`); agora usa `yarn next build`.                                                                                                                                                                                                 |
| 5   | ~~`remotePatterns.port: ''`~~ — **corrigido**                     | `next.config.ts`                  | Propriedade omitida; `remotePatterns` agora deriva de `MINIO_PUBLIC_ENDPOINT`.                                                                                                                                                                                                                                                                                                        |
| 6   | JSON inválido (vírgula final)                                     | `.vscode/settings.json:8`         | VS Code reporta erro de parse.                                                                                                                                                                                                                                                                                                                                                        |
| 7   | `/qrcode` em `PUBLIC_PATHS` mas sem `pages/qrcode/index.tsx`      | `middleware.ts:17`                | A rota `/qrcode` retorna 404. Existe apenas `/qrcode/view`.                                                                                                                                                                                                                                                                                                                           |
| 8   | Shield de "setup inicial" totalmente comentado                    | `middleware.ts:41-59`             | A verificação é feita client-side em `pages/login.tsx:16-38`. Fragilidade conhecida.                                                                                                                                                                                                                                                                                                  |
| 9   | ~~`next lint` depreciado~~ — **corrigido**                        | `package.json:9`                  | Migrado para `eslint .` com `ignores` apenas de build/dependências (`.next/`, `node_modules/`, `coverage/`, `next-env.d.ts`). O gate passou a cobrir `__tests__` e revelou **149 erros** (140 `no-explicit-any`, 5 `no-unused-vars`, 4 `no-non-null-asserted-optional-chain`), todos corrigidos com o helper `__tests__/helpers/http.ts`.                                                                                                                                                                            |

### 3.3 🟡 P2 — Manutenção e Qualidade

| #   | Problema                                                                              | Onde                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Cobertura de testes ainda parcial** — runner instalado, mas longe do alvo           | projeto inteiro                                                                                                                                    | `vitest` está instalado e roda, mas o gate de cobertura se aplica hoje **só à superfície de segurança** (`lib/middlewares`, `lib/uploadPolicy.ts`, `pages/api/users/{index,check-director}.ts` — 83% linhas / 80% branches). O alvo de `SPECS.md` §5.2 (70–80% por domínio em todo `pages/api/**`) permanece **pendente** e exige cobrir os 36 endpoints.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2   | **Nenhuma CI**                                                                        | sem `.github/`                                                                                                                                     |
| 3   | ~~**Verificação de JWT replicada**~~ — **consolidada**                                | `lib/apiAuth.ts` (`getSessionUser`)                                                                                                                | A sequência `req.cookies.auth_token \|\| authorization.replace("Bearer ") → jwtVerify` estava replicada em ~20 arquivos de `pages/api/**`, com o prefixo `Bearer` não validado e a leitura do id divergente. Todos passaram a usar `getSessionUser()`, que delega a `verifyAuthToken()` (`lib/auth.ts`, fonte de verdade). `authMiddleware` continua sendo o wrapper para handlers que querem o 401 padronizado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4   | ~~**`components/ListSection.tsx` tinha 2.150 linhas**~~ — **corrigido**                | `components/ListSection.tsx` (355 L) + `components/list/*` — orquestrador restaurado na Etapa C da `ADR-003`                                                                     |
| 4b  | ~~**`pages/settings.tsx` tinha 1.254 linhas**~~ — **corrigido**                        | `pages/settings.tsx` (169 L) + `components/settings/*` + `lib/hooks/use*Settings*` — Etapa D da `ADR-003`                                                                        |
| 4c  | ~~**`pages/dashboard.tsx` tinha 375 linhas**~~ — **corrigido**                         | `pages/dashboard.tsx` (124 L) + `components/dashboard/*` — Etapa B da `ADR-003`                                                                                                  |
| 5   | **12 dependências declaradas e nunca importadas**                                     | `recharts`, `framer-motion`, `react-rnd`, `@headlessui/react`, `axios`, `jsonwebtoken`, `js-cookie`, `jwt-decode`, `eruda`, `uuid`, `qrcode.react` |
| 6   | **Espaço de IDs pequeno**: `Active.id`/`FatherSpace.id` = 4 chars hex (65.536)        | `lib/prisma.ts:8-24` — colisão plausível em inventário grande                                                                                      |
| 7   | `DEBUG_ALLOW_JWT` no `.env` nunca é lido no código                                    | `.env` — variável morta, remover                                                                                                                   |
| 8   | `COOKIE_SECURE` e `NEXT_PUBLIC_BASE_URL` ausentes do `.env`                           | `pages/api/auth/login.ts:49`, `pages/api/auth/logout.ts:13`                                                                                        |
| 9   | Sem `.env.example` (`.gitignore:34` usa `.env*` e bloqueia)                           | —                                                                                                                                                  |
| 10  | `skipLibCheck`, `noUncheckedIndexedAccess`, `noUnusedLocals` ausentes                 | `tsconfig.json`                                                                                                                                    |
| 11  | `content` do Tailwind não cobre `lib/`, `types/`, `styles/`                           | `tailwind.config.mjs:6-9`                                                                                                                          |
| 12  | `Active.categoryId` obrigatório mas relação `category` opcional                       | `prisma/schema.prisma:84` vs `:100`                                                                                                                |
| 13  | `Movement Movement[]` em PascalCase                                                   | `prisma/schema.prisma:105`                                                                                                                         |
| 14  | `README.md` desatualizado (versão, `yarn dev`, stack duplicada, nº de anexos)         | `README.md:6,30-38,44`                                                                                                                             |
| 15  | 6 SVG de boilerplate do Next sem uso                                                  | `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`                                                                             |
| 16  | **`ListSectionProps.onMove?` declarado mas nunca usado**                              | `lib/types.ts:16` vs `components/ListSection.tsx:411`                                                                                              | A prop `onMove?: (item: Active) => void` está declarada na interface `ListSectionProps`, mas `ListSection` não a desestrutura na assinatura do componente e nenhum chamador a fornece (`grep -c onMove components/ListSection.tsx` → 0). É tipagem morta. **Pendente de investigação** (nenhum teste em runtime foi feito): confirmar se a movimentação de ativos perdeu o atalho que usava essa via — ou se a prop é apenas um resíduo de uma refatoração e pode ser removida. Não registrar como comportamento quebrado sem verificação.                                                                                                                                                                                                                                                                                                                                                                          |
| 17  | **Credencial do auditor de órfãos não existe no MinIO**                               | `inventory-policy-auditor.json` (novo) · `scripts/audit-minio.ts`                                                                                  | 🟡 **PENDENTE — ação humana.** O script está pronto e não roda até a credencial existir. Detalhes, razão e passo a passo: **§3.3.1**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 18  | ~~**`deleteFileFromMinio` derivava a chave com `split('/').pop()`**~~ — **corrigido** | `lib/minio.ts:39`                                                                                                                                  | ✅ **Corrigido nesta branch.** Dois defeitos: (1) com **subpasta**, o banco guarda a URL completa e o bucket a chave nua, então o `pop()` devolvia `1792-foto.jpg` em vez de `subpasta/1792-foto.jpg` e apagava o objeto errado — ou nada, sem sinalizar, porque o `catch` era mudo; (2) com **link externo** ("Cole um link", ex.: Google Drive), `.../file/d/x/view` virava `removeObject('inventory', 'view')` — remoção no bucket que o usuário nunca pediu. A chave agora sai de `getMinioKeyFromUrl()` (`lib/mediaUrl.ts`), que devolve `null` para o que não é do bucket `inventory` e aí **não remove**; o `catch` virou `console.warn` com URL e motivo, e a função segue **sem lançar** porque `removeObject` é idempotente e os chamadores de delete dependem disso. 11 testes de regressão em `__tests__/lib/minio-delete.test.ts` (6 falham contra a implementação antiga). Regras em `SPECS.md` §5.1. |

### 3.3.1 Credencial do auditor de órfãos — o que falta e como criar

Detalhe do item **17** da tabela acima.

**Estado:** o bucket `inventory` acumulava ~532 objetos sem referência no banco. O script que os
encontra está pronto (`scripts/audit-minio.ts`, leitura por padrão), mas **não roda** até que a
credencial exista no servidor. **A credencial ainda não foi criada** — `MINIO_AUDIT_ACCESS_KEY` e
`MINIO_AUDIT_SECRET_KEY` não estão definidos no ambiente. O arquivo `inventory-policy-auditor.json`
está versionado e pronto para ser aplicado.

**Por que a credencial da aplicação não serve.** A credencial do app é `GetObject`/`PutObject`/
`DeleteObject`, e **`ListBucket` não está entre elas** — sem o direito de listar não há como enumerar o
bucket, e um `DeleteObject` que só apaga o que alguém já nomeia não encontra órfão. Conceder
`ListBucket` à aplicação resolveria isso, mas ampliaria o alcance de todo o app no bucket e passaria a
expor o **nome** de todos os objetos para qualquer vazamento dessa credencial. Regras completas em
`SPECS.md` §5.1.

**O que acontece sem ela.** O script cai para `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` com aviso explícito
e a listagem falha com `AccessDenied` — **comportamento esperado, não bug**.

**Passo a passo para criar a credencial** (`mc` = MinIO Client, apontado para o servidor real):

1. Criar o usuário separado da aplicação:
   ```bash
   mc admin user add <alias> inventory-auditor <SENHA_FORTE>
   ```
2. Aplicar a policy versionada no repositório:
   ```bash
   mc admin policy create <alias> inventory-auditor inventory-policy-auditor.json
   mc admin policy attach <alias> inventory-auditor --user inventory-auditor
   ```
3. Definir `MINIO_AUDIT_ACCESS_KEY` e `MINIO_AUDIT_SECRET_KEY` no ambiente onde o script roda
   (`.env`, **não versionado**; ver `AGENTS.md` §3.1 — segredos nunca em arquivo commitado).
4. Primeira execução **só de leitura**, gravando relatório:
   ```bash
   node scripts/audit-minio.ts --saida relatorio.json
   ```
5. Conferir a lista contra anexos conhecidos de um ativo antes de qualquer remoção.

⚠️ **`--apagar` exige `--confirmar` junto** (`node scripts/audit-minio.ts --apagar --confirmar`) e
o **bucket não tem versioning**: a remoção é **irreversível**. Nenhuma remoção foi executada até agora —
a auditoria foi validada só por unidade, sem MinIO.

### 3.4 Estado do Working Tree

**Etapa D commitada em `refactor/modularize-ui`.** O trabalho do revert, do Estágio 1 e das
Etapas A–C da ADR-003 também está commitado. Permanecem no working tree **apenas itens externos
pré-existentes**, fora do escopo desta branch: `.gitignore` (`/runs/harness2/`), `opencode.json`,
a deleção de `ESTAGIO-1-CREATOR-ACCESS.md` e os arquivos `fowler-*.md`. Nenhum deles foi
restaurado nem commitado por esta sessão.

- `yarn.lock` e `package-lock.json` — ver §3.2 #2 (artefato de `npm install` acidental).

### 3.5 Dependências do ambiente

- **MariaDB** precisa de **system-versioning** habilitado. Sem isso, `/api/database/revert` quebra.
- **✅ Produção — `Active` corrigida manualmente.** A tabela `Active` foi habilitada
  (`ALTER TABLE Active ADD SYSTEM VERSIONING`) por operação humana, e não por migration. O
  `prisma/schema.prisma` segue sem `systemVersioning` e **continua assim por desenho**: o Prisma
  não modela a opção de tabela, então o DDL é aplicado **fora** do sistema de migrations e
  **não deve virar migration** (`SPECS.md` §5.5).
- **⚠️ `FatherSpace` e `Category` ainda NÃO foram verificadas em produção.** A correção manual
  acima foi feita em `Active` porque era a única tabela do `GET` no momento do incidente; o `POST`
  também aceita `FatherSpace` e `Category`, que podem seguir sem versionamento. **Pendência
  aberta:** rodar `node scripts/system-v.ts --aplicar` contra o banco de
  produção e confirmar as três. O `revert_probe` é o único banco local com system-versioning ativo.
- **⚠️ Evidência local de que a pendência é real (16/10/2026):** o script rodou contra o banco de
  desenvolvimento local (`banco`) e reportou `Active = YES`, **`FatherSpace = NO`** e
  **`Category = NO`**. Ou seja, a falha 4124 não é um evento de produção: ela acontece em
  qualquer schema que não teve o `ALTER` rodado, e só `Active` foi corrigida até agora. Confirmar
  em produção antes de considerar o item encerrado.
- **Como verificar de agora em diante:** `scripts/system-v.ts` cobre a lacuna
  de forma idempotente e legível por máquina — modo leitura imprime
  `TABELA | SYSTEM VERSIONING | SITUAÇÃO`, sai com código 1 se alguma tabela esperada ficar de
  fora (dá para usar como gate de CI), e `--aplicar` só emite `ALTER` no que voltou `'NO'`. O
  endpoint deixou de devolver 500 genérico nesse cenário e passou a responder **503** com a
  tabela nomeada e o comando de correção. O `revert_probe` local não é substituto para essa
  verificação: o incidente só apareceu em produção.
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
- **Versão atual: `2.25.2`** (patch sobre `2.25.1`). O patch é o correto aqui: a única mudança desde
  `2.25.1` é de **documentação** — correção do drift de contagem de testes no `SPECS.md` §5.2 (número
  fixo envelhecido, removido em favor da referência à saída de `yarn test`) e consolidação da dívida
  #17 (§3.3.1) com o passo a passo de criação da credencial do auditor. Nenhum caminho de código novo,
  nenhuma credencial criada, nenhuma mudança de comportamento observável.
  **Sessão anterior (`2.25.1`, patch):** a única mudança desde `2.25.0` foi a correção de
  `deleteFileFromMinio` (`split('/').pop()` → `getMinioKeyFromUrl()`, §3.3 #18) — correção pontual
  de comportamento com bug.
  **Histórico do minor anterior (`2.23.0` → `2.25.0`):** a série desde
  `2.22.7` carrega correção de segurança P0, correção de build, refactor de auth em ~20 endpoints,
  correção de RBAC, o script `system-v.ts` e agora o **auditor de órfãos do MinIO**
  (`scripts/audit-minio.ts`) com `lib/mediaReferences.ts` e a policy separada
  `inventory-policy-auditor.json` — caminho de código novo **e** credencial nova a criar no servidor.
  `refactor/auth-helper` já era minor pelos botões condicionais na UI, pelo `isCreator` no seed e pela
  exigência de senha do criador em toda entrada.
  O campo `creatorAccessEnabled` que chegou a ser adicionado em `/api/auth/me` foi **removido** na
  sequência (§2.3 item 9), junto com as duas feature flags do Acesso do Criador.
  A branch `inventory-v2.25.2` e a tag `v2.25.2` são criação humana; a `inventory-v2.22.7` **não** deve ser
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
