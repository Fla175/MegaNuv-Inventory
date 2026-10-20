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

#### Security

- **Etapa 0 da `ADR/ADR-001.md` — escrita sem autorização em dois endpoints de mutação de ativos.**
  Achado da auditoria do front-end. `clone-batch.ts` e `update.ts` são os **dois** endpoints de
  mutação de ativos que **não verificavam papel algum** — `delete.ts:17` e `move.ts:41` já
  bloqueiam `VIEWER`, e `create.ts:53` também.
  - **`POST /api/actives/clone-batch` (`:1-30`)** — o handler **não importava `authMiddleware`** e
    não resolvia sessão: exportava-se cru. A autorização dependia só do `middleware.ts`, que valida
    **token, não papel** (`middleware.ts:58-86`), de modo que qualquer `VIEWER` autenticado criava
    até **50 cópias** de qualquer ativo (`qty` limitado a 50 em `:18`), em qualquer destino,
    **copiando `fixedValue` e `notes`** (`:79-80`). Agora resolve a sessão com `getSessionUser`,
    barra `VIEWER` com `403`, e é envolvido por `authMiddleware`.
  - **`PUT /api/actives/update` (`:128`)** — usava `authMiddleware(handler)` **sem
    `requiredRoles`**. O terceiro parâmetro de `authMiddleware` existia desde sempre
    (`lib/middlewares/authMiddleware.ts:24,51-55`) **sem nenhum chamador no projeto**. Um `VIEWER`
    autenticado editava qualquer ativo por ID, e `applyToSimilar` (`:79-106`) propagava a alteração
    para todos os ativos de mesmo `name`/`manufacturer`/`model`/`sku` — escrita em N registros com
    um único `PUT`. Agora passa `["DIRECTOR", "ADMIN", "MANAGER"]`, o complemento de `VIEWER` na
    matriz RBAC, mesma semântica de `delete.ts`/`move.ts`.
  - **Autoria nos clones (`:95-99`).** Os clones não registravam `createdById` — o schema o torna
    opcional (`prisma/schema.prisma:95`), então **não havia como saber quem clonou o quê**. Um
    endpoint de escrita sem autoria é também um endpoint sem auditoria. Mesmo formato de
    `create.ts:131`.
  - **`update.ts` agora usa o singleton (`:4`).** Era o **único** arquivo de `pages/` e `lib/` a
    instanciar `new PrismaClient()` fora de `lib/prisma.ts:5`, burlando o guard de hot-reload.
    Descoberto porque isso tornava o endpoint **impossível de testar com o mock do projeto** — foi
    o que revelou o 403 ausente, já que o teste de regressão falhava com 404 em vez de bloquear.
  - **Regra de produto aplicada:** ADMIN, MANAGER e DIRECTOR veem e editam `fixedValue`; somente
    VIEWER não pode nada. O card de patrimônio total permanece restrito (`dashboard/stats.ts:13`).

#### Added

- **`__tests__/api/actives-write-authz.test.ts`** — 12 testes de regressão exigidos pela Etapa 0:
  `VIEWER` recebe `403` e o banco não muda em `clone-batch` e em `update`; `403` também sem token;
  `applyToSimilar` não propaga; `VIEWER` não zera `fixedValue`; os clones registram
  `createdById`; e `ADMIN`/`MANAGER`/`DIRECTOR` **não** são barrados por papel. **Validados por
  mutação:** remover a guarda de `VIEWER` do `clone-batch` faz **1** teste falhar, remover o
  `requiredRoles` do `update` faz **3**, remover o `createdById` faz **1** — os testes prendem a
  regressão, não apenas a descrevem.

#### Refactored

- **`ADR/ADR-001.md`** — registro da decisão que originou esta correção, em quatro etapas
  (0: escrita sem autorização · 1: dado sensível e perda de dado · 2: duplicação · 3: qualidade).
  Criada nesta sessão a partir de uma revisão de auditoria do front-end; a numeração de ADR foi
  reiniciada neste diretório.

#### Docs

- **`CONTEXT.md` §3.1** —entradas novas para os dois endpoints sem guarda de `VIEWER`.

---

### 🤖 OpenCode Operations (2)

#### Security

- **Etapa 1 da `ADR/ADR-001.md` — `fixedValue` saía no payload para quem não podia vê-lo e era
  destruído por edição sem o campo.** Regra de produto (decisão do dono, 18/10/2026): ADMIN,
  MANAGER e DIRECTOR veem e editam o valor; **somente VIEWER** não o vê. Três correções atômicas —
  a redação sem a preservação viraria perda de dado no primeiro salvamento.
  - **`GET /api/actives/list` (1.1, `pages/api/actives/list.ts:31-45`)** — o endpoint devolvia
    **todos** os escalares para qualquer papel autenticado: o gate de coluna da UI
    (`ListSection.tsx`) escondia o valor, mas o JSON entregava o patrimônio a qualquer cookie de
    `VIEWER` (`curl` bastava). Agora o payload é redigido por destructuring condicionado a
    `canViewValue(session)`. **Desvio de mecanismo, mesmo contrato:** a ADR pede `select` explícito
    no `findMany`; em vez disso o fetch mantém os escalares e o campo é removido pós-query — o
    `findMany` sem `select` carrega todos os campos que a UI consome (`notes`, `imageUrl`,
    `fileUrl`, `createdAt`, ...), e enumerá-los à mão arriscaria derrubar campos da `ListSection`
    em silêncio. A intenção da ADR — `fixedValue` ausente do JSON para `VIEWER` — é idêntica.
  - **`PUT /api/actives/update` (1.2, `pages/api/actives/update.ts:52-63`)** — o parse
    `parseFloat(fixedValue) || 0` gravava `0` sempre que o campo não chegava: "campo ausente" era
    "zerar", e um cliente que editasse o ativo sem repassar o valor destruía o patrimônio em
    silêncio (com `applyToSimilar`, em N registros). Agora `'fixedValue' in req.body` distingue
    **ausente** de **zerado**: ausente → preserva `originalActive.fixedValue`; `0` explícito
    → zera. É o par da redação do 1.1 — sem isso, listar sem o campo + salvar zerava o valor.
  - **`GET /api/qrcode/public-get` (1.3, `:110-160`)** — `...rootActive` espalhava **todos** os
    escalares da raiz, inclusive o valor, sem nenhum gate, e os ativos das seções idem. O
    `VIEWER` autenticado abre a tela do QR Code, então a redação precisa cobrir raiz e filhos.
    Agora `canViewValue(req.user)` decide e a chave **sai do objeto** (não vai como `undefined`).
    **Sobre `notes`:** a evidência da ADR citava o spread de `notes` junto, mas `notes` não é
    o dado sensível da decisão de produto — permanece visível a todos os papéis autenticados,
    coerente com `actives/list`.
  - **`totalValue` no servidor (1.4, `pages/api/qrcode/public-get.ts:158-165`,
    `pages/qrcode/view.tsx:186-191`)** — o "Valor Total" da tela do QR Code somava
    `sec.fixedValue`, que a resposta **jamais carregou**: a soma client-side reduzia a
    `undefined` e o card reportava **apenas o valor da raiz** como se fosse o da subárvore
    inteira — erro silencioso e ao contrário em fluxo de patrimônio. Agora `SectionActive`
    declara `fixedValue` e o **servidor** soma raiz + cada ativo de cada seção, incluindo
    espaços aninhados; a tela consome `data.totalValue ?? 0`. Para `VIEWER`, `totalValue: 0`
    → o card não é renderizado (`totalValue > 0`).

#### Changed

- **`canViewValue(user)` novo em `lib/apiAuth.ts:64-77`** — a regra vive como predicado puro ao
  lado de `isViewer`/`isPrivileged` (alternativa D da ADR, exigida por `SPECS.md §5.1` para
  regra de negócio). **Falha fechado:** allowlist explícito (`DIRECTOR`/`ADMIN`/`MANAGER`),
  não exclusão de `VIEWER` — sessão ausente, sem papel ou com papel desconhecido retorna
  `false`. Mutação "reforçada" (`role !== 'VIEWER'`) falhou nesse teste e foi corrigida antes
  de commitar.
- **`page /qrcode/view.tsx`** — `Section.fixedValue` removido da interface (a resposta nunca o
  carregou) e `ViewData.totalValue?: number` adicionado.

#### Added

- **`__tests__/api/actives-value-visibility.test.ts`** — 16 testes de regressão da Etapa 1:
  5 unitários de `canViewValue` (allowlist, falha fechado), 3 de `actives/list` (VIEWER sem a
  chave — ausente, não `undefined` — com o restante do payload intacto; ADMIN/MANAGER/DIRECTOR
  com o valor), 4 de `actives/update` (ausente preserva 1250 — **o teste obrigatório da ADR**;
  `0` explícito zera; valor novo aplica; `applyToSimilar` sem campo não propaga), 4 de
  `public-get` (401 sem sessão; VIEWER sem `fixedValue` em raiz/ativos e `totalValue` 0;
  DIRECTOR com soma correta de subárvore aninhada = 375). **Validados por 6 mutações:** redação
  incondicional no `list` → 1 falha; parse `|| 0` restaurado no `update` → 2; spread sem gate
  da raiz no `public-get` → 1; soma sem as seções → 1; allowlist trocado por `!== 'VIEWER'`
  (falha aberta) → 1; `signedActives` sempre com valor → 1. Suíte completa: 236 passando
  (era 220, +16).

#### Docs

- **`SPECS.md §4.2`** — cláusula de visibilidade de `fixedValue` nos contratos de
  `actives/list`, `actives/update` e `qrcode/public-get`; nota de drift na matriz RBAC
  (linhas "Vê `fixedValue`" de ADMIN/MANAGER) referenciando a `ADR-002` pendente.
- **`CONTEXT.md §3.1`** — item **15** (exposição de `fixedValue` no payload).

---

### 🤖 OpenCode Operations (3)

#### Changed

- **Etapa 2 da `ADR/ADR-001.md` — a mesma regra implementada mais de uma vez.** Quatro dos cinco
  itens compartilham a mesma raiz: uma cópia por tela, cada uma evoluindo sozinha.
  - **2.2 + 2.1 — `SearchableSelect` único, com a semântica de `"default"` reconciliada ANTES da
    extração** (ordem exigida pela ADR). A árvore de locais existia em duas cópias
    (`components/ListSection.tsx:77-409` e `components/actives/activeForm.tsx:144-474`) que
    divergiram: o `ListSection` tratava `type === "default"` como espaço na cor e no hover, mas
    escondia o selo de tipo; o formulário **nem conhecia o valor** (`grep '"default"'` → 0).
    `"default"` é o **sentinela** "Manter no espaço original de cada um" do diálogo de clonagem —
    não é local. A regra agora vive em `lib/searchableSelect.ts` (módulo puro):
    `getOptionKind` devolve `space | active | sentinel`; o sentinela é **neutro** (não veste azul
    de espaço) e nunca exibe "Espaço Pai"/"Espaço Físico". O componente único está em
    `components/ui/SearchableSelect.tsx` e recebe `variant="list" | "form"` — **a variante muda
    apenas classes**, preservando a linguagem visual de cada tela; a lógica é uma só. O botão de
    expandir, o tamanho do nome por nível e a borda da raiz foram conferidos contra as duas cópias
    originais para não regredir. Extração eliminou **664 linhas duplicadas**.
  - **2.3 — `parseFileUrls` como cópia única.** `qrcode/view.tsx` reimplementava o parser (sem
    dedup) e `ListSection.tsx` fazia só `split(',')`: um `fileUrl` em JSON array legado virava
    **um único link literal** `["http://a.pdf"]` na tela de visualização. Ambos agora importam
    `lib/mediaReferences.ts` (exigência de `SPECS.md` §4.1), que já tem testes próprios.
  - **2.4 — `fetchData` de `settings` deixou de engolir falha.** O `catch` mudo e a ausência de
    checagem de `res.ok` faziam falha de rede/servidor parecer **lista vazia** ("nenhum registro").
    Agora notifica com o `error` do envelope ou mensagem de conexão. A dependência usada é
    `showError` (callback estável do `ToastProvider`), não o objeto `toast` — o objeto troca de
    identidade a cada toast e refaria o fetch da aba a cada notificação.
  - **2.5 — aviso do tamanho da subárvore antes da cascata.** `SPECS.md` §4.1 exige. O diálogo
    dizia "todos os ativos associados" sem número, e o `DELETE` apagava apenas os ativos com
    `fatherSpaceId = id`: os ativos dos espaços-filho ficavam fora da conta e, como
    `Active.fatherSpace` é **Restrict**, a exclusão de um filho com ativo abortava em **500
    genérico**. Agora `GET /api/father-spaces/delete` (mesma rota, mesmo gate ADMIN) devolve
    `{ spaces, actives }` da subárvore inteira e o diálogo informa quantos ativos e espaços-filho
    serão excluídos; o `DELETE` usa **a mesma** subárvore (`lib/spaceTree.ts`) para apagar os
    ativos de todos os espaços e registrar a contagem real no log. As duas `deleteMany` do código
    antigo (a segunda era subconjunto da primeira) viraram uma.

#### Added

- **`lib/searchableSelect.ts`** — semântica pura do seletor (categoria da opção, raiz, filhos,
  descendentes com guarda de ciclo, contagem, filtro case-insensitive com `trim`).
- **`lib/spaceTree.ts`** — `collectSpaceSubtreeIds(spaces, rootId)`, em largura, raiz primeiro,
  sem repetição e sem laço em hierarquia cíclica (dado legado não pode travar a rota de exclusão).
- **`components/ui/SearchableSelect.tsx`** — componente único, props tipadas (fim do `any` na
  assinatura).
- **Testes — 24 novos, validados por 4 mutações.** `__tests__/lib/searchableSelect.test.ts` (11):
  a reconciliação do `"default"` (sentinela, não espaço), árvore, netos, ciclo, filtro.
  `__tests__/lib/spaceTree.test.ts` (4): subárvore, irmãos excluídos, ciclo, raiz primeiro.
  `__tests__/api/father-spaces-delete.test.ts` (8): prévia com contagem da subárvore, gate
  ADMIN/401/404/405, `DELETE` cobrindo filhos, imagens e log com a contagem real. Mutações:
  `getOptionKind` voltando a tratar `default` como espaço → 1 falha; subárvore só com a raiz → 5;
  prévia contando só o espaço clicado → 1; `DELETE` só no espaço clicado → 1.

#### Docs

- **`SPECS.md` §4.2** — contrato da prévia (`GET /api/father-spaces/delete`) e da exclusão em
  cascata sobre a subárvore inteira.
- **`CONTEXT.md` §2.1** — foco atual: ADR-001 Etapas 0–2 concluídas, Etapa 3 e ADR-002 pendentes.

---

> **Próxima release: `2.25.2`.** A versão vive em `package.json:3` e é lida por `lib/version.ts` (sem
> hardcode). O bump foi feito com `npm version 2.25.2 --no-git-tag-version`: o `--no-git-tag-version` é
> obrigatório porque a IA **não cria tag nem branch de release** (`AGENTS.md` §3.2, `CONTEXT.md` §4). O
> `yarn.lock` não foi tocado. A branch `inventory-v2.25.2` e a tag `v2.25.2` são criação humana.
>
> **Por que patch:** release **exclusivamente de documentação** — nenhuma mudança de caminho de código,
> nenhuma credencial nova, nenhum comportamento observável. Duas correções documentais: o drift de
> contagem de testes no `SPECS.md` e a consolidação da dívida #17 do `CONTEXT.md`. O minor anterior
> (`2.25.1`, patch sobre `2.25.0`) somava a correção de `deleteFileFromMinio` (`split('/').pop()` →
> `getMinioKeyFromUrl()`, §5.1); o minor `2.25.0` é que somava caminho novo e credencial a criar.
>
> **Sessão anterior (bumpara `2.25.0`, minor):** a série desde `2.22.7` soma correção de segurança P0,
> correção de build, refactor de auth em ~20 endpoints, correção de RBAC, o script de system versioning e
> o **auditor de órfãos do MinIO** — que adiciona um caminho de código novo e uma credencial nova no
> servidor. Isso é mudança de comportamento observável, não correção pontual.

### 🤖 OpenCode Operations

#### Docs

- **Correção do drift de contagem de testes no `SPECS.md` §5.2.** O "Estado atual" fixava
  **143 testes passando** — número envelhecido que envelhecia a cada commit e já era mentira. A frase
  agora **não fixa número**: `vitest` instalado e rodando, suíte passando na íntegra na branch atual, e a
  contagem explícita fica sendo a **saída de `yarn test`**. A mesma correção foi aplicada nas duas
  ocorrências do `CONTEXT.md` que fixavam **101** (§2.1, registro de gates da sessão de security P0, e
  §3.3 item 1). O que era informação útil foi preservado: o gate de cobertura se aplica **só** à
  superfície de segurança e o alvo global de `SPECS.md` §5.2 permanece **pendente** (baseline 0%, 36
  endpoints a cobrir). As contagens **por arquivo** (`__tests__/lib/minio-delete.test.ts`,
  `lib/mediaReferences.ts`) foram mantidas: não envelhecem como a global.
- **Dívida #17 do `CONTEXT.md` §3.3 consolidada.** A linha da tabela — desproporcionalmente longa para
  uma célula — ficou só com problema, onde e status (**🟡 PENDENTE — ação humana**) + ponte para a nova
  subseção. A explicação longa migrou para **§3.3.1**, que acrescenta o **passo a passo com `mc`** para
  criar a credencial do auditor (`admin user add` → `policy create` → `policy attach` → variáveis de
  ambiente → primeira execução só de leitura com `--saida`), o motivo pelo qual a credencial da
  aplicação não serve, o comportamento esperado sem ela (`AccessDenied`), a referência a `SPECS.md` §5.1
  e ao `inventory-policy-auditor.json`, e o aviso de que `--apagar` exige `--confirmar` e é
  **irreversível** (o bucket não tem versioning).
- **Status do auditor preservado como pendente.** A credencial **não existe** no servidor:
  `MINIO_AUDIT_ACCESS_KEY` e `MINIO_AUDIT_SECRET_KEY` não estão definidos no ambiente. O que é
  verificável e está registrado: o arquivo de policy está versionado e o script existe e está pronto.
  A criação da credencial permanece **ação humana pendente** — nada nesta sessão tocou o MinIO.
- **Versão `2.25.2`** propagada para `AGENTS.md` §1 ("Versão atual") e `CONTEXT.md` (cabeçalho
  "Versão:" e §4, com a justificativa patch). `lib/version.ts` continua lendo `package.json` — sem
  hardcode.
- Gates da sessão: `yarn lint`, `npx tsc --noEmit` e `yarn test` verdes — baseline mantido, nenhuma
  regressão (release só de documentação).

### 🤖 OpenCode Operations

#### Changed

- **Bump de versão para `2.25.1`** (patch), com `npm version 2.25.1 --no-git-tag-version`: nenhuma tag,
  nenhum commit automático, `yarn.lock` intacto. O `--no-git-tag-version` é obrigatório porque a IA
  **não cria tag nem branch de release** (`AGENTS.md` §3.2, `CONTEXT.md` §4).
- `AGENTS.md` §1 ("Versão atual") e `CONTEXT.md` §4 ("Versão atual" + justificativa patch vs minor)
  atualizados para `2.25.1`. `lib/version.ts` continua lendo `package.json` — sem hardcode.

### 🤖 OpenCode Operations

#### Fixed

- **`deleteFileFromMinio` (`lib/minio.ts`) apagava o objeto errado e podia apagar o objeto
  errado por link externo.** A função derivava a chave com `url.split('/').pop()`, o que quebrava
  em dois casos verificados empiricamente:
  - **Subpasta:** o banco guarda a **URL completa** e o bucket guarda a **chave nua**. Para
    `http://host/inventory/subpasta/1792-foto.jpg` o `pop()` devolvia `1792-foto.jpg`, e a remoção
    atingia o objeto errado — ou nada, sem sinalizar, porque o `catch` era mudo.
  - **Link externo:** o app aceita "Cole um link" (ex.: Google Drive). Para
    `https://drive.google.com/file/d/abc123/view` o `pop()` devolvia `view` e o app chamava
    `removeObject('inventory', 'view')` — uma remoção no bucket que o usuário **nunca pediu**.
- **Correção:** a extração da chave passa a ser a canônica, `getMinioKeyFromUrl()` de
  `lib/mediaUrl.ts` (regex `/^https?:\/\/[^/]+\/inventory\/(.+)$/`), que captura o caminho completo,
  subpastas incluídas. Quando ela devolve `null` — URL externa ou de outro bucket — a função
  **não chama** `removeObject`: não há nada nosso para apagar, e isso **não é erro**.
- **Assinatura** de `url: string | null` para `string | null | undefined`: os chamadores passam
  colunas do Prisma que podem ser `undefined` (`Active.imageUrl`).
- **`catch` mudo → `console.warn`** com a URL e o motivo do erro (sem stack, sem credencial).
  A função **continua sem lançar**: `removeObject` é idempotente e rejeita objeto já inexistente, e
  `pages/api/father-spaces/delete.ts`, `pages/api/actives/delete.ts` e
  `pages/api/storage/delete-url.ts` dependem disso para não reverter a exclusão de um registro só
  porque o arquivo já sumiu.

#### Added

- **`__tests__/lib/minio-delete.test.ts`** — 11 testes de regressão de `deleteFileFromMinio`, com o
  pacote `minio` mockado (`vi.mock('minio', ...)`) para que `removeObject` seja um spy e nenhuma
  chamada de rede aconteça: URL sem subpasta, URL **com** subpasta (o caso que mais importa),
  subpasta profunda, https com porta explícita, **link externo e bucket errado** (não removem nada),
  `null` / `undefined` / string vazia, e `removeObject` rejeitando (a função não propaga o erro e
  registra o motivo).
  > O teste foi validado por mutação: contra a implementação antiga (`split('/').pop()` + `catch`
  > mudo) **6 dos 11 falham**, incluindo os dois de subpasta e o de link externo.

#### Changed

- Regras registradas em `SPECS.md` §5.1 (bloco **Remoção de anexo**): a extração da chave tem que ser
  a canônica, `split('/').pop()` local é **proibido**, link externo é **ignorado** (não erro), a
  função **não lança**, e a assinatura aceita `undefined`.

#### Docs

- `CONTEXT.md` §2.1 e §3.3 #18: a dívida aberta sobre `deleteFileFromMinio` derivar a chave com
  `split('/').pop()` está registrada como **corrigida** nesta branch.

### 🤖 OpenCode Operations

#### Added

- **`lib/mediaReferences.ts` — módulo puro de referência de mídia** (sem I/O, sem Prisma, sem MinIO),
  com três funções testáveis sem tocar em infraestrutura:
  - `parseFileUrls(fileUrl)` lê `Active.fileUrl` nos **dois formatos legados** da mesma coluna
    (`SPECS.md` §4.1): JSON array (dados antigos) ou CSV (o que `pages/api/actives/update.ts:49`
    grava). Tentativa em ordem JSON array → CSV, dedup preservando ordem, e **nunca lança** — um
    único registro corrompido não pode abortar uma auditoria que varre a tabela inteira.
  - `collectReferencedKeys(activeRows, fatherSpaceRows)` junta as **três** colunas que guardam
    referência viva — `Active.fileUrl`, `Active.imageUrl` e `FatherSpace.imageUrl` — aplicando
    `getMinioKeyFromUrl()` de `lib/mediaUrl.ts` (**reutilizado, não reescrito**). Auditar só
    `fileUrl` apagaria fotos. URL externa (Google Drive) devolve `null` no helper e é ignorada.
  - `findOrphans({ minioKeys, referencedKeys, graceCutoff, objectAges })` decide: órfão = **não
    referenciado E mais antigo que `graceCutoff`**. O resto vai para `protectedByGrace`, que existe
    por uma corrida real (upload termina antes do commit no banco). Objeto sem `LastModified`
    legível é **protegido**: sem data não há como provar que é antigo.
- **`scripts/audit-minio.ts` — auditor de órfãos do bucket MinIO** (ADR-002). Roda por
  type-stripping do Node 22 (`node scripts/audit-minio.ts`, sem build), lê o banco pelo
  singleton `db` de `lib/prisma.ts` (`SPECS.md` §1.2) e enumera o bucket **recursivamente**
  capturando nome e `LastModified` — recursivo para que subpasta futura seja auditada sem mudança
  no script.
  - **Modo leitura é o PADRÃO.** Imprime referenciados no banco, objetos no bucket, órfãos e
    protegidos pela graça. `--apagar` **exige `--confirmar` junto**: nenhum comando de uma linha
    apaga objeto por acidente. O relatório JSON (`--saida`) é gravado **antes** de qualquer
    remoção, para que a lista exista mesmo se o processo morrer no meio de um lote; a remoção vai
    em lotes de 100 e a **primeira falha interrompe** em vez de reportar sucesso parcial.
  - Opções: `--apagar`, `--confirmar`, `--minutos <n>` (padrão 1440 = 24 h), `--bucket <nome>`
    (padrão `BUCKET_NAME` de `lib/minio.ts` — fonte única, sem literal repetido), `--saida <arquivo>`.
  - Fecha o pool em `finally` e define `process.exitCode = 1` em erro. O `catch` final imprime
    **só o tipo** da exceção: mensagem do driver pode carregar endpoint ou DSN.
  - ⚠️ **A credencial da aplicação NÃO serve** — `inventory-policy.json` não tem `ListBucket`, e
    sem listar não há como enumerar o bucket. O script prefere
    `MINIO_AUDIT_ACCESS_KEY`/`MINIO_AUDIT_SECRET_KEY` e só cai para
    `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` **com aviso explícito**, porque esse fallback deve
    falhar com `AccessDenied` — é diagnóstico, não atalho.
- **`inventory-policy-auditor.json` — credencial SEPARADA da aplicação**, só para o auditor:
  `s3:ListBucket` em `arn:aws:s3:::inventory` (enumerar) e `s3:DeleteObject` em
  `arn:aws:s3:::inventory/*` (limpar). **Sem `GetObject`** (o auditor nunca lê conteúdo) e
  **sem `s3:*`**. A política da aplicação não foi ampliada de propósito: `ListBucket` expõe o
  **nome** de todos os objetos do bucket, e dar isso ao app ampliaria o alcance de qualquer
  vazamento daquela credencial.
- **`__tests__/lib/mediaReferences.test.ts` — 25 testes** de lógica pura. Cobrem os dois formatos
  de `fileUrl`, JSON válido que não é array, duplicatas, `null`/`undefined`/`""`/espaços, valor
  malformado que não pode lançar; as três colunas em `collectReferencedKeys`, URL externa
  ignorada, union sem duplicata, extração da chave nua e subpasta preservada; e em `findOrphans`:
  órfão verdadeiro, referenciado preservado, órfão novo protegido pela graça, exato no cutoff,
  `LastModified` ausente e data inválida. **Nenhum teste toca MinIO ou MariaDB reais.**

#### Changed

- **`pages/api/qrcode/public-get.ts` — a lógica duplicada de `signFileUrl` foi removida** e
  passou a importar `parseFileUrls` de `lib/mediaReferences.ts`. Comportamento idêntico (a função
  nova é a antiga com a extração do parser), e a duplicação deixou de existir: duas cópias do
  parser divergindo significariam a auditoria apagar um anexo que a tela do QR Code ainda mostra.
- `SPECS.md` §4.1 apontava para `public-get.ts:41-52` como fonte da leitura de `fileUrl`; passou a
  apontar para `lib/mediaReferences.ts`, que é agora a cópia única. §1.2 e §3.2 registraram o
  módulo, o script e a policy nova no mapa do projeto.

#### Docs

- `README.md`: nova seção **Storage Maintenance — MinIO Orphan Auditor**, em inglês — o que o
  script faz, o padrão de leitura, os comandos de leitura e de aplicação, `--apagar` exigindo
  `--confirmar`, o motivo do período de graça e o aviso de irreversibilidade (o bucket não tem
  versioning), e a necessidade da credencial própria com `ListBucket`.
- `SPECS.md` §5.1 (Upload e mídia): `inventory-policy-auditor.json` registrada como credencial
  separada, com o motivo de a da aplicação não servir (sem `ListBucket`).
- `CONTEXT.md` §3.3 #17: pendência de criar/aplicar a credencial do auditor no MinIO, com os três
  passos (usuário, policy, variáveis) e o registro de que **nenhuma remoção foi executada** — a
  auditoria foi validada só por unidade, sem MinIO.
- `CONTEXT.md` §3.1 #9 permanece: a `inventory-policy.json` restrita continua **pendente de ser
  aplicada no servidor**.

> **Validação pendente (deliberada).** Não há MinIO local, e o único acessível é o de produção,
> cujo bucket **não tem versioning** — rodar `--apagar` lá seria irreversível e fora de escopo.
> Nenhum comando de remoção foi executado em nenhum ambiente. O que falta para validação manual:
> criar a credencial de auditoria, rodar `node scripts/audit-minio.ts --saida relatorio.json`
> e conferir a lista contra anexos conhecidos de um ativo antes de qualquer `--apagar --confirmar`.

### 🤖 OpenCode Operations

#### Added

- **Bump de versão `2.23.0` → `2.25.0`** (minor) via `npm version 2.25.0 --no-git-tag-version`.
  Verificado: `package.json:3` = `2.25.0`, `git diff --stat yarn.lock` **vazio**, `git tag --list "v2.25.0"`
  **vazio**, nenhum commit automático. Minor e não patch porque a série desde `2.22.7` soma correção de
  segurança P0, correção de build, refactor de auth, correção de RBAC, o script de system versioning e o
  auditor de órfãos — caminho de código novo **e** credencial nova a criar no servidor.
  A branch `inventory-v2.25.0` e a tag `v2.25.0` são criação humana.

#### Docs

- Versão atualizada para `2.25.0` em `AGENTS.md` (linha "Versão atual"), `CONTEXT.md` (cabeçalho
  "Versão:" e §4), `README.md` ("Current Version") e nesta nota de release.

### 🤖 OpenCode Operations

#### Added

- **`lib/revert/errors.ts` — reconhecimento puro do erro MariaDB 4124** (`` Table `X` is not
system-versioned ``). Módulo sem I/O, sem Prisma, sem Next: `parseSystemVersioningError(error)`
  devolve `{ table }`, `{ table: '' }` quando o 4124 vem sem nome, ou `null`. O código é procurado
  em duas fontes independentes — o rótulo `` Code: `4124``` da mensagem e o `meta.code` do
`PrismaClientKnownRequestError` (aceito como string **e** como número) — e basta uma confirmar.
O nome da tabela é extraído de  `` Table `X` is not system-versioned ``, com fallback para
`meta.message`, onde o Prisma também repete o texto do driver.
- **`scripts/system-v.ts` — verificação/aplicação idempotente.** Roda direto
  pelo Node 22 por type-stripping (`node scripts/...`, sem build e sem runner novo), usa o
  singleton de `lib/prisma.ts` e deriva a lista de `REVERTABLE_TABLES` — **sem hardcode**.
  Consulta `information_schema.tables` filtrando `TABLE_SCHEMA = DATABASE()`, então é
  multi-banco. O **modo leitura é o padrão** e imprime `TABELA | SYSTEM VERSIONING | SITUAÇÃO`;
  `--aplicar` emite `ALTER TABLE ... ADD SYSTEM VERSIONING` só nas tabelas que voltaram `'NO'`,
  relê o estado e não repete DDL na segunda execução. Opções: `--aplicar` e `--tabela <nome>`
  (validada contra `REVERTABLE_TABLES`). Fecha a conexão em `finally` e define
  `process.exitCode = 1` quando alguma tabela esperada fica sem versionamento — o que o torna
  utilizável como **check de CI**.
  - **Estado lido por `information_schema.tables.TABLE_TYPE` = `'SYSTEM VERSIONED'`, e não pela
    coluna `SYSTEM_VERSIONING`** — a premissa de partida (que a coluna existiria) está **errada
    para o MariaDB**: ela é do MySQL 8 e no MariaDB 10.11.14 a consulta devolve
    `ERROR 1054 (42S22): Unknown column 'SYSTEM_VERSIONING' in 'SELECT'`. Verificado
    empiricamente, e a equivalência com `SHOW CREATE TABLE` foi cross-checkada. A premissa está
    registrada em `SPECS.md` §5.5 para ninguém reintroduzir a coluna.
  - Tabela **inexistente** sai como `AUSENTE` e **não** entra no `ALTER`; erros de uso (opção
    desconhecida, tabela fora de `REVERTABLE_TABLES`) imprimem a mensagem, enquanto erro do driver
    é redacted para o tipo — a mensagem do Prisma pode carregar fragmento do DSN.
- **503 acionável em `GET`/`POST /api/database/revert`.** O `catch` reconhece o 4124 e responde
  503 com `{ error }` em português, nomeando a tabela (ou dizendo "uma ou mais tabelas"), citando
  `system versioning` e **incluindo o comando exato** de correção
  (`node scripts/system-v.ts --aplicar`). **Sem** stack, `details` ou mensagem
  crua do Prisma/MariaDB no corpo. 503 — e não 500 — porque a condição é persistente: retry não
  resolve, é configuração.

#### Fixed

- **`GET /api/database/revert` deixava vazar 500 com stack em produção.** O 4124 do MariaDB
  (tabela sem `WITH SYSTEM VERSIONING`) caía no `catch` sem mapeamento. Agora é reconhecido e
  traduzido na origem.
- **Regressão evitada no mesmo `catch`:** `"UNAUTHORIZED"`, `"USER_NOT_FOUND"` e
  `"STALE_REVERT_LIST"` são verificados **antes** do reconhecimento do 4124 e seguem produzindo
  401/401/409. `parseSystemVersioningError` devolve `null` para os três — coberto por teste
  dedicado, junto com a garantia de que a regex é ancorada no rótulo `Code:` e não dispara por
  qualquer "4124" que apareça numa mensagem qualquer.
- **`tsconfig.json` — `allowImportingTsExtensions: true`.** Necessário para o script: o
  type-stripping nativo do Node resolve especificadores ESM e exige a extensão `.ts` explícita
  nos imports relativos. A opção é válida porque `noEmit` já é `true`; nada do build do Next foi
  alterado.

#### Docs

- **`README.md`** — aviso visível na seção de setup, após o bloco do `.env`: system versioning é
  obrigatório para o Revert, o comando de verificação e o de aplicação, e o aviso de que isso fica
  **fora** do sistema de migrations do Prisma.
- **`SPECS.md` §5.5 — System Versioning (MariaDB)**, nova seção: o Revert exige; quais tabelas,
  via `REVERTABLE_TABLES` e sem hardcode; como verificar/aplicar; que o DDL fica fora do Prisma e
  **não deve ser migration**; que o app **não tem DDL e nunca vai aplicá-lo**; e o contrato do
  endpoint (503 acionável, sem vazar stack, sem capturar os sentinels de 401/409).
- **`CONTEXT.md` §3.5** — `Active` registrada como corrigida manualmente (e **não** via migration,
  que é o comportamento correto aqui); `FatherSpace` e `Category` registradas como **ainda não
  verificadas**, com o script apontado como a verificação que falta; e o novo comportamento 503.

### 🤖 OpenCode Operations

#### Security

- **Remoção definitiva das feature flags `CREATOR_ACCESS_ENABLED` e `CREATOR_ACCESS_REQUIRE_PASSWORD`** —
  decisão do dono do projeto: o Acesso do Criador é **sempre habilitado** e **sempre exige a senha do
  criador**. Como o dono guarda as senhas no **Bitwarden**, exigir a senha não é atrito e não se justifica
  um interruptor. Registrando o motivo do descarte: a causa raiz do bug reportado foi ter uma flag
  **obrigatória disfarçada de opcional** — quem configurou omitiu a linha e o recurso degradou em silêncio,
  respondendo `403` sem sinalizar o motivo. Um "feature flag" de segurança cujo padrão desliga o recurso é
  armadilha, não controle. Consequências aplicadas:
  - `pages/api/creator-access.ts` não abre mais com kill switch: `POST`/`DELETE`/`PATCH` respondem conforme a
    autenticação real, sem gate de ambiente.
  - O `POST` passou a **exigir sempre** a senha do criador, validada com `bcrypt.compare(password,
creator.password)` **depois** de resolver o `creator` e o `targetUser`. Contratos preservados:
    `400 { error: 'Senha é obrigatória.' }` (ausente/vazia) e `401 { error: 'Senha incorreta.' }` (errada);
    `targetUserId` continua obrigatório (`400`) e a validação da senha **não** emite cookie de impersonação.
  - `.env.example` não declara mais nenhuma variável de Acesso do Criador.
  - `vitest.config.ts` perdeu o comentário que documentava a flag como não semeada de propósito.
- **Confirmação de senha na UI (defesa em profundidade):** o botão "Entrar" deixa de chamar a API
  diretamente e abre um modal de solicitação de senha, no mesmo padrão visual do modal de transferência
  já existente em `pages/settings.tsx`. O campo usa `<input type="password" autoComplete="current-password">`
  para que o autofill do navegador/Bitwarden funcione. `400` e `401` viram toast apropriado e o campo é
  limpo para nova tentativa; `401` reporta explicitamente senha incorreta.

#### Changed

- `POST /api/creator-access` passou a enviar `{ targetUserId, password }` (antes só `targetUserId`).
- A UI de `pages/settings.tsx` mantém o modal de transferência intacto; o novo modal de entrada é irmão dele.

#### Fixed

- **403 silencioso do `/api/creator-access`:** a degradação vinha de a flag ser lida como ausente. Agora não
  há flag para faltar — o recurso está ativo por construção.
- **2 testes que já falhavam antes desta mudança passavam a depender do `.env` local:** o `.env` da máquina
  tinha `CREATOR_ACCESS_REQUIRE_PASSWORD=true`, que o Vitest carrega, e fazia `returns 200 for creator user`
  e `returns 404 when target user does not exist` retornarem `400`. Com a exigência de senha incondicional os
  dois foram corrigidos na raiz (mock de `bcrypt` + senha no body), não por ajuste de `.env`.
- **Cobertura do caminho de senha, antes inexistente:** adicionados 4 casos — `400` sem `password`,
  `400` com `password` vazia, `401` com senha errada (garantindo ausência de `Set-Cookie`) e `200` com senha
  correta (garantindo a chamada a `bcrypt.compare` com o hash do criador). O `describe` inteiro
  `Kill Switch Guard` (3 casos do `403` da flag) e os 5 casos de `creatorAccessEnabled` em `/api/auth/me`
  foram removidos; no lugar ficou um caso que afirma que o campo **não** é mais exposto.

### 🤖 OpenCode Operations

#### Security

- **Recurso de Acesso do Criador inoperante em produção (403 em todo POST/DELETE/PATCH)** —
  `pages/api/creator-access.ts:22` abria com `if (process.env.CREATOR_ACCESS_ENABLED !== 'true') return 403`,
  mas a variável **não era declarada nem no `.env` nem no `.env.example`**. Com a flag ausente,
  `undefined !== 'true'` é sempre verdadeiro: o botão "Entrar" aparecia para a conta criadora e a API
  recusava com 403 — falha funcional e, sobretudo, um _fail-open_ de configuração documentada como se fosse
  um _feature flag_ opcional, quando na prática era obrigatória. Quatro correções encadeadas:
  1. `.env.example` passa a declarar `CREATOR_ACCESS_ENABLED=true` e `CREATOR_ACCESS_REQUIRE_PASSWORD=false`,
     com comentário explicando que, se a primeira estiver ausente ou for diferente de `"true"`,
     `POST`/`DELETE`/`PATCH` respondem 403 — a flag deixou de ser invisível para quem lê o exemplo;
  2. `/api/auth/me` passou a expor `creatorAccessEnabled: boolean` no objeto do usuário, para que o cliente
     saiba se o recurso está ativo;
  3. `pages/settings.tsx` passou a exigir `user.creatorAccessEnabled` além de `user.isCreator` no bloco
     "Entrar"/"Ceder" — a UI não exibe mais botões que necessariamente falhariam. O campo foi adicionado à
     `interface User` local e ao tipo `User` de `lib/context/UserContext.tsx` (`creatorAccessEnabled?:
boolean`), que é a origem dos dados vindos de `/api/auth/me`;
  4. `vitest.config.ts` teve `CREATOR_ACCESS_ENABLED: 'true'` **removido** de `test.env`: a flag global
     mascarava exatamente este defeito — a suíte passava enquanto a produção falhava. Cada teste de
     creator-access define a flag no próprio `beforeEach`, então a remoção não depende dela.
- **Admin master criado pelo seed nunca era criador** — `pages/api/auth/seed.ts` criava o primeiro `ADMIN`
  sem `isCreator`, e o schema aplicava o default `false`. Como o único caminho para tornar-se criador
  (`PATCH /api/creator-access`) exige que o solicitante **já** seja `isCreator`, um sistema inicializado por
  `seed` ficava permanentemente sem criador. `pages/api/auth/signup` já fazia certo
  (`adminCount === 0` → `isCreator: true`); o seed agora grava `isCreator: true`, com o comentário de que o
  admin master é o criador por definição.

#### Fixed

- **Cobertura de regressão para os dois bugs acima** — `__tests__/api/creator-access.test.ts` ganhou casos
  explícitos para a flag **ausente** (`delete process.env.CREATOR_ACCESS_ENABLED`, e a asserção de que ela
  está `undefined`), tanto para `POST` quanto para `DELETE`/`PATCH`, preservando os 18 casos anteriores;
  e 5 casos para o novo `creatorAccessEnabled` de `/api/auth/me` (flag `"true"` e os valores ausente,
  `"false"`, `"TRUE"` e `"1"`, este último para travar a comparação estrita).
- **`__tests__/api/seed-creator.test.ts`** (novo, 6 casos) — com Prisma mockado no estilo de
  `signup-rbac.test.ts` e `security-auth.test.ts`, trava que o `user.create` do seed recebe
  `role: 'ADMIN'` **e** `isCreator: true`, que `isCreator: false` enviado no body não sobrepõe o valor,
  que o log `SYSTEM_INITIALIZED` é gravado com o id do novo creator, e preserva as travas existentes
  (403 com base já populada, 400 sem email/senha e o redirecionamento do `GET`).

#### Changed

- **Versão `2.22.7` → `2.23.0`** via `npm version 2.23.0 --no-git-tag-version`. O patch para `2.22.7` estava
  errado: o conjunto acumula correção de segurança (credenciais MinIO removidas do código, endpoints de
  listagem sem verificação de assinatura, `/api/database/revert` devolvendo 500 em vez de 401), correção de
  build da imagem, refactor da verificação de JWT em ~20 endpoints e correção de RBAC no signup — com
  **mudança de comportamento observável** em endpoints, não apenas correção interna. Isso é **minor**
  (novo campo em resposta de API, botões condicionais na UI, novo campo `creatorAccessEnabled`), não patch.
  Apenas `package.json` mudou; `yarn.lock` intacto, nenhuma tag criada (`--no-git-tag-version`) e nenhum
  commit automático. `lib/version.ts` lê a versão de `package.json`, não há hardcode para atualizar.

### 🤖 OpenCode Operations

#### Security

- **`POST /api/auth/signup` aceita `DIRECTOR` novamente** — o gate usava `session.role !== 'ADMIN'`, que
  barrava o próprio `DIRECTOR` de criar usuário, em desacordo com a tabela de RBAC (`SPECS.md` §4.2), onde
  `DIRECTOR` tem "todos" em _Gerencia usuários_. A condição passou a usar `isPrivileged()`
  (`lib/apiAuth.ts`), que cobre `DIRECTOR` e `ADMIN` em um único lugar.
  _Coberto por `__tests__/api/signup-rbac.test.ts` (6 casos: tabela de papéis para `ADMIN`/`DIRECTOR`/
  `MANAGER`/`VIEWER`, ausência de sessão e o bootstrap do primeiro `ADMIN` como `isCreator`). Confirmado que
  o teste falha ao reintroduzir a condição antiga._

#### Changed

- **Versão `2.22.6` → `2.22.7`** via `npm version --no-git-tag-version` (patch, seguindo a convenção
  histórica `2.20.1` → `2.22.6`). Apenas `package.json` mudou; `lib/version.ts` lê a versão de lá.

### 🤖 OpenCode Operations

#### Security

- **Três endpoints de listagem aceitavam qualquer token não-vazio** — `pages/api/actives/list.ts`, `pages/api/categories/list.ts` e `pages/api/father-spaces/list.ts` faziam apenas `if (!token)` e **nunca verificavam a assinatura**: um header `Authorization: Bearer qualquercoisa` devolvia o inventário, as categorias e a árvore de espaços completa. Na prática o `middleware.ts` segurava a requisição, mas o handler não pode assumir que o middleware rodou (`SPECS.md` §5.1). Agora todos verificam a sessão.

#### Fixed

- **Verificação de JWT consolidada em um helper único** (`lib/apiAuth.ts`) — 20 arquivos de `pages/api/**` repetiam a mesma sequência com variações que não eram cosméticas:
  - o prefixo `Bearer ` não era validado — `authorization?.replace("Bearer ", "")` aceitava um header sem o esquema e o repassava ao verificador; o helper exige o esquema (`/^Bearer\s+(.+)$/i`);
  - cada arquivo repetia `new TextEncoder().encode(JWT_SECRET!)`, apesar de `verifyAuthToken()` ser a fonte de verdade;
  - a leitura do id divergia entre `decoded.id || decoded.userId || decoded.sub`, `decoded.id || decoded.sub || decoded.userId` e só `decoded.userId`, embora o token do login carregue apenas `userId` (`SPECS.md` §4.2) — as demais expressões eram código morto;
  - `pages/api/database/revert.ts` tinha um `catch` de `jose.errors.JWTInvalid` que se tornou inalcançável (o helper nunca lança) e foi removido em `categories/{create,update,delete}`.
- **`/api/database/revert` devolvia 500 em vez de 401 para token inválido** — `jwtVerify` lançava, a exceção caía no `catch` sem mapeamento e virava `Erro interno`. Com o helper, token ausente, inválido ou expirado resulta em `null` e o endpoint passa a responder `401`.
- **Chave `JWT_SECRET_MISSING` removida de `revert.ts`** — era inalcançável, já que `lib/auth.ts` valida `JWT_SECRET` no import do módulo.

#### Added

- `lib/apiAuth.ts` — `getSessionToken(req)`, `getSessionUser(req)`, `isViewer()` e `isPrivileged()`. Não escreve na resposta: quem chama decide o status e o corpo, preservando o envelope `{ error: string }` de cada endpoint.
- `__tests__/lib/apiAuth.test.ts` — 21 casos cobrindo extração por cookie e por header, esquema `Bearer` case-insensitive, rejeição de header sem esquema, preferência do header sobre o cookie, token vazio, `req.cookies` indefinido, `getSessionUser` sem lançar, os predicados de papel e três casos de regressão para o bug de token não verificado.

#### Changed

- `pages/api/auth/me.ts` — a sessão principal passou a usar o helper; a verificação do token de **stash** do criador (`auth_token_creator`) continua com `jwtVerify` direto, porque é um cookie distinto e fora do escopo do helper.
- Nenhum status code ou mensagem de erro foi alterado, exceto o `revert.ts` (500 → 401 para token inválido), que era um defeito.

### 🤖 OpenCode Operations

#### Fixed

- **Envelope de erro do `authMiddleware` alinhado ao contrato do projeto** (`lib/middlewares/authMiddleware.ts`) — o helper respondia `{ message: ... }`, mas o envelope documentado em `SPECS.md` §4.2 é `{ error: string }` e **todo** o frontend lê `data.error` nos toasts (`components/FileUpload.tsx`, `components/ListSection.tsx`, `components/imageUpload.tsx`, `components/actives/activeForm.tsx`, `pages/settings.tsx`). Consequência prática: nos endpoints protegidos, um 401 caía no texto genérico de fallback em vez de "Autenticação necessária". As respostas 401/403 do helper agora usam `error`, e o 403 deixou de ser meioaportada.
- **Testes que travam o contrato do envelope** — 4 casos novos em `__tests__/api/security-auth.test.ts` cobrem o formato do 401 (sem sessão e com token inválido) e do 403 por `requiredRoles`, incluindo a asserção de que `message` **não** é usado. Verificado que o teste falha ao reintroduzir a chave antiga.

### 🤖 OpenCode Operations

#### Fixed

- **Build da imagem Docker corrigido** — `Dockerfile:7` executava `yarn build`, que **não existe** no `package.json`; o script de build é `build:opt` (`scripts/build-optimized.sh`). O build da imagem estava quebrado (`error Command "build" not found`) e agora usa o script correto.
- **`Dockerfile` passa a respeitar `output: "standalone"`** — o runner copiava o `node_modules` inteiro (1.1G) e depois executava `CMD ["yarn","start"]`, cujo script faz `cd .next/standalone && node server.js`, layout que o runner nunca montava. Agora o runner copia o conteúdo de `.next/standalone` para `/app`, mais `.next/static`, `public/`, `prisma/` e `package.json`, e sobe com `node server.js` — que é o que o artifact standalone realmente produz. Verificado: o `server.js` gerado sobe e responde (`GET /` → 307 para login, `GET /api/hello` → 200).
- **Camada de instalação com cache mount do BuildKit** — o cache do yarn (~2.8G, com binários do rolldown para ~13 plataformas) era gravado dentro da layer. Agora é montado como cache do BuildKit: persiste entre builds, mas nunca entra na imagem, o que reduz a layer de instalação e evita estourar o disco do host.
- **Runner não-root** — o estágio final roda como `node` (uid 1000), com `NODE_ENV=production` e `HOSTNAME=0.0.0.0` explícitos.
- **Instalação com `--frozen-lockfile`** no Dockerfile — garante que a imagem nunca altera o `yarn.lock` (regra de `SPECS.md` §5.3); antes era `yarn install` sem trava.
- **`scripts/build-optimized.sh`**: os `echo "$ comando"` imprimiam o `$` literal em vez do comando sendo executado; e `next build` falhava com `command not found` quando o script era rodado fora do `yarn run`, porque `node_modules/.bin` não está no `PATH`. Passou a usar `yarn next build` e `echo "> ..."`.

#### Docs

- Documentado em `CONTEXT.md` §3.2 que o `yarn build` inexistente foi corrigido, e em `SPECS.md` §3.2 o novo fluxo de build da imagem em dois estágios.

> \*\*#### Fixed

- **Build da imagem Docker corrigido de verdade** — ver a seção da release `2.22.7` abaixo. Dois defeitos
  novos só apareceram quando o `docker build` foi executado de ponta a ponta:
  - `node:22-alpine` **não traz `bash`**, e `yarn build:opt` executa `bash scripts/build-optimized.sh`
    (`/bin/sh: bash: not found`). O builder agora instala `bash` via `apk add --no-cache bash`.
  - ao dividir a layer de dependências, `yarn install` passa a rodar **antes** de `COPY . .`; o
    `postinstall` do `@prisma/client` roda sem o `prisma/schema.prisma` na imagem e não gera o Client, o
    que quebrava o type-check com `Module '@prisma/client' has no exported member 'UserRole'`. Restaurado o
    `npx prisma generate` explícito **depois** do `COPY . .`.
    _Lição: a remoção anterior do `generate` foi validada apenas localmente, onde o Client já estava
    gerado — a verificação não reproduzia a ordem de layers do container._

> **Validação real da imagem** (não mais só `docker build --check`): o build completa, a imagem fica com
> **341MB**, o container sobe como `uid=1000(node)` e responde — `GET /` → 307, `GET /api/hello` → 200,
> `GET /login` → 200. Os endpoints protegidos respondem **401** sem sessão e **401** com token falso
> (`Authorization: Bearer qualquercoisa`), confirmando as correções de segurança na imagem real.
> (`POST /api/auth/login` responde 500 nesse container de teste porque ele não tem banco configurado.)

### 🤖 OpenCode Operations

#### Security

- **Credenciais MinIO removidas do código** (`lib/minio.ts`, `pages/api/storage/upload-url.ts`) — os fallbacks que embutiam `accessKey`/`secretKey` de produção foram substituídos por `requireEnv()`, que **falha no import** se a variável estiver ausente (mesma convenção já usada por `JWT_SECRET` em `lib/auth.ts:8`). Nenhuma credencial real é ecoada aqui; as linhas originais eram o único ponto de vazamento no código. **A credencial que estava no histórico do Git não é removida por esta mudança: continua sendo necessário rotacioná-la no servidor.**
- **Hosts de produção eliminados do código** — `lib/minio.ts`, `pages/api/storage/upload-url.ts` e `next.config.ts` não fixam mais endpoint/IP de produção. `next/image` agora deriva `remotePatterns` de `MINIO_PUBLIC_ENDPOINT` e **falha fechado** (lista vazia) quando a variável não está definida em tempo de build. O exemplo do comentário em `lib/mediaUrl.ts` foi genericizado.
- **Endpoints públicos fechados com autenticação no handler** (itens 3, 4, 5 e 8 de `CONTEXT.md` §3.1): `/api/storage/upload-url`, `/api/storage/delete-url`, `/api/qrcode/public-get` e `PUT /api/actives/update`. Os três primeiros saíram de `PUBLIC_PATHS` no `middleware.ts` e passaram a ser protegidos por `authMiddleware` no handler — a camada de controle do handler deixa de depender do middleware.
- **`GET /api/users` e `GET /api/users/check-director` agora exigem sessão** — `GET /api/users` listava nome, e-mail e papel de todos os usuários sem qualquer verificação; `check-director` confirmava a existência do DIRECTOR. Ambos passam por `authMiddleware`.
- **`authMiddleware` aceita cookie `auth_token` além de `Authorization: Bearer`** — o frontend chama as APIs com `fetch` e o cookie httpOnly é a forma canônica de sessão; aceitar apenas o header deixava handlersAuth Protected inconsistentes com o middleware de rota.
- **`inventory-policy.json` restrito** de `s3:*` (que incluía deletar o bucket e gerenciar ACL) para `s3:GetObject`, `s3:PutObject` e `s3:DeleteObject`.

#### Fixed

- **Validação de upload agora é autoritativa no servidor** (item 10). A checagem de 10 MB e de tipo existia só em `components/FileUpload.tsx`, contornável com um cliente arbitrário. A regra foi extraída para o módulo puro `lib/uploadPolicy.ts` e aplicada em `pages/api/storage/upload-url.ts`.
- **Bypass corrigido na própria validação**: a primeira versão aceitava arquivo por MIME **ou** por extensão, o que permitia enviar um `.exe` com MIME `application/pdf`. A regra final exige coerência — extensão presente precisa estar na allowlist **e** MIME presente precisa estar na allowlist; `application/octet-stream` nunca é aceito. O teste que encontrou isso está em `__tests__/lib/uploadPolicy.test.ts`.
- **`String()` sem argumento removido** (`pages/api/storage/upload-url.ts:25`) — retornava sempre `""`, então o campo `active` da resposta era invariavelmente `null`. O upload agora aceita um campo opcional `activeId` no formulário e vincula o arquivo ao ativo quando ele existe.
- **`next.config.ts`** — removido `remotePatterns.port: ''`, que pode rejeitar URL com porta explícita.
- **Arquivos não utilizados** — o `package.json` referencia `vitest.config.ts` (arquivo único); não há mais config duplicada.

#### Added

- `lib/uploadPolicy.ts` — módulo puro (sem I/O) com a allowlist de MIME/extensão, o limite de 10 MB e `validateUpload()`, testável isoladamente.
- `__tests__/lib/uploadPolicy.test.ts` — 21 casos cobrindo extração de extensão, coerência MIME×extensão, rejeição de executáveis e de `application/octet-stream`, e os limites de tamanho (inclusive exatamente no limite).
- `__tests__/api/security-auth.test.ts` — 12 casos verificando que os cinco endpoints protegidos respondem `401` sem sessão e que a RBAC de `POST /api/users` é respeitada (VIEWER e MANAGER barrados por papel), além do fluxo por cookie e por `Authorization: Bearer`.
- `.env.example` — documenta os nomes das variáveis obrigatórias com valores de placeholder, e `.gitignore` foi ajustado com `!.env.example` para que o arquivo possa ser versionado sem nunca versionar um `.env`.

#### Changed

- `middleware.ts` — `/api/storage/upload-url` saiu de `PUBLIC_PATHS` e o early-return que liberava a rota foi removido; `PUBLIC_PATHS` ficou reduced a login, auth, APIs públicas e estáticos.
- `vitest.config.ts` — as variáveis `MINIO_*` de teste foram adicionadas ao bloco `env` (necessárias porque `lib/minio.ts` falha no import sem elas) e o threshold de cobertura passou a se aplicar à superfície de segurança coberta nesta branch, em vez de todo o `pages/api/**`. **O alvo global de 70–80% de `SPECS.md` §5.2 permanece pendente** e está registrado em `CONTEXT.md` §3.3: o projeto tem baseline 0% e 36 endpoints, então elevar o gate para o conjunto exige cobrir o projeto inteiro.
- `CONTEXT.md` e `SPECS.md` — contrato de segurança dos endpoints e o estado de cobertura atualizados para refletir o que foi corrigido.

#### Removed

- Nenhum arquivo versionado foi removido. (Durante o trabalho, um `getAuthenticatedUser` Chegou a ser adicionado em `lib/auth.ts` e foi removido antes do commit por estar sem uso — código morto não entra.)

### 🤖 Antigravity Operations

#### Added

- `pages/api/creator-access.ts` — API dedicada para Acesso do Criador com 3 rotas: `POST` (entrar na conta alvo, emitindo token de impersonação de 2h e gravando stash httpOnly `auth_token_creator` de 8h), `DELETE` (restaurar sessão do criador trocando os cookies de volta) e `PATCH` (transferir título de criador com atualização transacional serializável).
- `prisma/migrations/20260930193000_add_is_creator/migration.sql` — migration append-only adicionando coluna `isCreator TINYINT(1) NOT NULL DEFAULT FALSE` no model `User`.
- `vitest.config.ts`, `__tests__/lib/auth.test.ts` e `__tests__/api/creator-access.test.ts` — infraestrutura de testes unitários e de integração com Vitest cobrindo 25 casos (RBAC, kill switch, guards de input, blindagem de endpoints de usuários, transferência de título, emissão e restauração de cookies, e sinalização de sessão).

#### Changed

- `lib/auth.ts` — expandida a função `generateAuthToken` para aceitar parâmetro opcional `expiresIn` (padrão `'8h'`) e encadear `.setIssuedAt()`.
- `pages/api/auth/logout.ts` — atualizado o logout para limpar simultaneamente os dois cookies: `auth_token` e `auth_token_creator` (prevenindo vazamento de sessão de criador no stash).
- `pages/api/auth/me.ts` — incluído `isCreator` na consulta do usuário e adicionado o objeto `impersonation` (`{ active: true, creatorName }`) na resposta quando o cookie stash `auth_token_creator` estiver presente.
- `lib/context/UserContext.tsx` — adicionados `isCreator` ao tipo `User`, estado `impersonation` e a função `restoreCreatorSession` exposta pelo contexto.
- `components/Layout.tsx` — adicionada a faixa superior de aviso de impersonação ("Sessão de X · você está como Y") com botão "Voltar à minha conta".
- `pages/settings.tsx` — adicionados o botão "Entrar" (para a conta de qualquer usuário sem senha) e o botão "Ceder" (para transferir o título de criador com modal de confirmação por digitação) nos cartões de membros.
- `package.json` — adicionado script `"test": "vitest run"` e dependências de dev `vitest`, `@vitest/coverage-v8` e `vite`.
- `next-stages.md` — marcado o Estágio 1 como concluído.

### 🤖 OpenCode Operations

#### Added

- `opencode.json` — configuração local do OpenCode: `project.id: meganuv-inventory`, `root: ./`, watcher com `ignore: [".vscode"]` e `include: [pages/, components/, lib/, types/]`, e `mcp.local-servers` com `git` (`uvx mcp-server-git`) e `mariadb` (`@modelcontextprotocol/server-postgres` sobre `${DATABASE_URL}`, uso somente leitura).
- `AGENTS.md` — documento de entrada único multi-IA: ordem de leitura obrigatória, identificação do projeto, repositório de documentos, regras transversais de segredos/git/escopo, gates de qualidade, fluxo padrão de trabalho e índice de anti-padrões.
- `OPENCODE.md` — regras locais do OpenCode: papel do sistema, restrições invioláveis, comandos de CLI permitidos e proibidos, fluxo com gates, padrões de saída e registro, e referência de arquivos sensíveis.
- `SPECS.md` — contrato técnico verificável em 5 seções: domínio e bounded contexts, stack e limites estruturais, arquitetura e regras de grafo de dependência, modelos de dados e contratos de API, e DoD (segurança, estratégia de testes, pipeline de validação).
- `CONTEXT.md` — estado atual do projeto: propósito, foco da sessão, débitos conhecidos classificados em P0/P1/P2, estado do working tree e convenção de versionamento.
- `CHANGELOG.md` — este diário.
- Worktree isolado criado: `/tmp/opencode/inventory-p0` na branch `chore/security-p0-debt`, a partir de `inventory-v2.22.6` (commit `531a2f9`), destinado às correções de segurança P0. **Nenhuma correção implementada ainda** — worktree limpo.

#### Docs

- Documentada a dívida técnica existente como base factual, sem alterar nenhum arquivo de aplicação:
  - **P0 (12 itens)** — credenciais MinIO hardcoded (`lib/minio.ts:9-10,18-19`, `pages/api/storage/upload-url.ts:14-15`), hosts de produção no código, 3 endpoints públicos sem auth (`/api/storage/upload-url`, `/api/storage/delete-url`, `/api/qrcode/public-get`), `GET /api/users` e `GET /api/users/check-director` sem auth, `PUT /api/actives/update` sem auth no handler, policy MinIO com `s3:*`, validação de upload só no cliente, logout sem revogação de token e segredos no histórico do Git.
  - **P1 (9 itens)** — `Dockerfile:7` executa `yarn build`, que não existe no `package.json` (build Docker quebrado); `package-lock.json` não rastreado e `yarn.lock` modificado; `String()` sem argumento em `upload-url.ts:25`; `echo "$ …"` em `scripts/build-optimized.sh`; `remotePatterns.port: ''` em `next.config.ts:22`; JSON inválido em `.vscode/settings.json:8`; `/qrcode` em `PUBLIC_PATHS` sem página correspondente; shield de setup inicial comentado em `middleware.ts:41-59`; `next lint` depreciado.
  - **P2 (15 itens)** — 0% de cobertura de testes, ausência de CI, verificação de JWT replicada em ~22 arquivos, `components/ListSection.tsx` com 1.927 linhas, 12 dependências órfãs, espaço de IDs de 4 chars hex, variáveis de ambiente mortas/ausentes, `tsconfig.json` permissivo, `content` do Tailwind incompleto, inconsistências de schema e `README.md` desatualizado.
- Adotadas as decisões do usuário em 25/09/2026: `project.id` = `meganuv-inventory`; gerenciador oficial **Yarn 1**; IA **pode commitar em branch própria** (nunca `push`/`tag`/`main`/branch de versão); versionamento por **branch dedicada** `inventory-vX.Y.Z`; DoD **estrita desde já** (testes e CI obrigatórios, apesar da dívida atual); dívida de segurança **documentada + worktree isolado** (não bloqueadora dura de release).

### 🤖 OpenCode Operations

#### Fixed

- **Classificação de ações do revert** — a lógica saiu do handler de 170 linhas (`pages/api/database/revert.ts`) para módulos puros (`lib/revert/history.ts`). Corrigidos, com verdade de campo do banco `revert_probe`:
  - registro criado e nunca alterado era rotulado `CREATE` em vez de `MOVE`/`UPDATE` (condição `isFirstVersion` invertida em `revert.ts:309-317`);
  - registro com única versão vigente era **omitido** da listagem (`revert.ts:304`);
  - registro deletado era rotulado `CREATE` em vez de `DELETE` (`revert.ts:348`);
  - `CLONE` nunca era produzido — agora é inferido por lote de criações simultâneas na janela de 2 s (`lib/revert/batch.ts`);
  - janela de agrupamento com âncora no item mais recente fragmentava lotes — agora desliza sobre o item mais antigo do lote;
  - `groupId` com `Math.random()` perdia a seleção a cada poll de 5 s — agora determinístico.
- **Autoridade do timestamp no POST** — `resolveRevertAt` deriva o instante de reversão do histórico (`planRevert`) e valida o `timestamp` do cliente contra ele (tolerância: QUICK 11 s, HISTORY 5 ms); divergência vira `409` "lista desatualizada". O `timestamp` do cliente **nunca** chega ao `FOR SYSTEM_TIME AS OF`.
- **Gatilhos mortos do popup de desfazer** (`components/ListSection.tsx`) — removidos 3 call sites de `showUndo` (delete individual, clone em lote, delete em lote): essas APIs não devolvem `timestamp`, então o popup nunca aparecia. Invariante documentado: popup só para movimentação.
- **Vocabulário unificado** — `lib/revert/types.ts` é a fonte única de `REVERT_ACTIONS` (CREATE/UPDATE/DELETE/CLONE/MOVE) e `ACTION_LABELS`; `pages/settings.tsx` importa os tipos (a união local mentia: só 3 ações) e exibe rótulos em pt-BR em vez do valor cru.

#### Added

- `lib/revert/types.ts`, `lib/revert/history.ts`, `lib/revert/batch.ts` — módulos puros de classificação/agrupamento, sem I/O.
- `__tests__/lib/revert/history.test.ts` (16 casos, tabela-verdade do `revert_probe`), `__tests__/lib/revert/batch.test.ts` (janela deslizante, CLONE, rótulos, groupId estável) e `__tests__/api/revert.test.ts` (13 casos com Prisma mockado: classificação do GET + autoridade/409/410 do POST).
- `__tests__/integration/revert-system-versioning.test.ts` — teste de integração **opt-in** (`REVERT_PROBE_DATABASE_URL`) contra o MariaDB com system-versioning; substitui o `debug-revert-logic.test.ts`, que tinha 0 `expect()` e 5 `console.log()` (verde falso).

#### Changed

- `pages/api/database/revert.ts` — `handleGet` delegado a `planRevert` + `batchActivities`; removidos `SYSTEM_TIME_MAX`, `HistoryRow` e `nameColumn` mortos; `handlePost` usa `resolveRevertAt` dentro da transação.
- `pages/settings.tsx` — tipos de revert importados de `lib/revert/types`; rótulos de ação em pt-BR no Histórico.
- `SPECS.md` e `CONTEXT.md` — contrato do revert atualizado (ver seções correspondentes).

#### Removed

- `__tests__/debug-revert-logic.test.ts` — teste-sonda sem asserções, substituído pelo teste de integração opt-in.

### 🤖 OpenCode Operations

#### Changed

- **Estágio 1 finalizado e commitado** — trabalho pendente do Acesso do Criador consolidado na branch `fix/revert-classification`:
  - campo legado `isSystem` removido do schema e unificado em `isCreator` (`prisma/schema.prisma`, `types/inventory.ts`, `lib/context/UserContext.tsx`, `pages/api/auth/me.ts`, `pages/api/auth/signup.ts`, `pages/initial-setup/register.tsx`, `pages/settings.tsx`, `__tests__/api/creator-access.test.ts`, `ESTAGIO-1-CREATOR-ACCESS.md`, `SPECS.md`);
  - formatação Prettier aplicada em `components/ListSection.tsx`, `components/SearchSection.tsx`, `components/actives/activeForm.tsx`, `pages/qrcode/view.tsx` e `pages/api/actives/create.ts` (aspas, quebras de linha e indentação — sem mudança de comportamento);
  - `pages/api/auth/signup.ts` — variável `userSystem` renomeada para `userIsCreator` (completa a renomeação do campo);
  - `pages/api/creator-access.ts` — restaurado `!==` (regressão de `!=` no kill switch);
  - `components/SearchSection.tsx` — placeholder de busca atualizado para "SKU/EAN ou SN";
  - `pages/api/actives/create.ts` — mensagem de conflito `P2002` corrigida (o SKU não é mais verificado, só o número de série);
  - `next-stages.md` — Estágio 3 revisado para 4 etapas.

### 👤 Manual Developer Changes

#### Refactored

- Nenhuma alteração manual do desenvolvedor registrada nesta sessão.

### 🤖 OpenCode Operations (4)

#### Fixed

- **Etapa 3 da `ADR/ADR-001.md` — conformidade e acessibilidade.** Fecha a ADR; a `ADR-002`
  (matriz RBAC) permanece pendente.
  - **3.1 — `Esc` e semântica de diálogo (funcional, não só a11y).** Os 5 modais de
    `pages/settings.tsx` ganharam `role="dialog"`, `aria-modal` e `aria-labelledby`; Entrar e
    Transferência, que não registravam `useEscapeKey`, agora fecham com `Esc` como os outros 3.
  - **3.2 — labels associados.** `htmlFor`/`id` nos labels-irmãos de `ListSection` (2),
    `activeForm` (11), `settings` (4), `FileUpload`, `imageUpload` e `AddLocationModal`; os labels de
    grupo Categoria e Seriais usam `role="group"` + `aria-labelledby`, porque rotulam N controles.
    `CustomSelect` e `SearchableSelect` aceitam `id` e o aplicam ao `button` (elemento rotulável).
    Nos uploads o `id` vem de `useId`, e o label só associa quando o input está renderizado.
  - **3.3 — bypass de upload fechado no cliente.** `FileUpload` mantinha uma cópia da allowlist e
    validava por **ou** (`extensão === tipo || MIME === tipo`): um `.pdf` com
    `application/octet-stream` passava no cliente e era recusado no servidor. Agora delega a
    `validateUpload` (`lib/uploadPolicy.ts`), a mesma regra **e** do servidor
    (`SPECS.md` §5.3); o caso de bypass já era coberto por
    `__tests__/lib/uploadPolicy.test.ts`.
  - **3.8** — cabeçalho `comṕonents/ListSection.tsx` corrigido.

#### Changed

- **3.5 — `yarn lint` passou de `next lint` para `eslint .`.** O flat config ganhou `ignores`
  apenas de artefatos (`.next/`, `node_modules/`, `coverage/`, `next-env.d.ts`); `__tests__` está
  coberto de verdade. A migração revelou **149 erros** — não os 102 da ADR, porque a suíte cresceu:
  140 `no-explicit-any`, 5 `no-unused-vars`, 4 `no-non-null-asserted-optional-chain`. Os 10 arquivos
  foram tipados; o `as any` que restava nos helpers virou `as unknown as`/`asMock`, centralizado, e
  não há `ignores` para testes.
- **3.4 — `types/inventory.ts` deixou de ser código morto.** Nova interface estrutural
  `InventoryItem` (a árvore mistura `Active` e `FatherSpace` e a API acrescenta campos derivados)
  adotada por `lib/types.ts`, `ListSection`, `activeForm` e `pages/index`; os três
  `eslint-disable @typescript-eslint/no-explicit-any` saíram. `activeForm` passou a mapear
  explicitamente os campos de `initialData` em vez de espalhar o objeto no estado, e a leitura de
  `fileUrl` usa `parseFileUrls` (a cópia única do 2.3).
- **3.7 — código morto e idioma.** `getActiveColors`/`getPhysicalSpaceColors`
  (`lib/constants/colors.ts`) tinham 0 referências e foram removidos. Comentários PT-BR dos arquivos
  da etapa (`ListSection`, `settings`, `FileUpload`, `imageUpload`, `AddLocationModal`, `index`,
  `activeForm`, `types/inventory`) traduzidos sem perder conteúdo — inclusive a regra de que
  `move.ts` é o único endpoint que devolve `timestamp` para o popup de desfazer.
- **3.6 — contagens.** `SPECS.md` §3.1/§3.2 e `CONTEXT.md` §3.3 #4 atualizados para os valores
  correntes: `ListSection` 2.150 L, `settings` 1.235, `activeForm` 775, `qrcode/view` 614,
  `FileUpload` 307, `components/` 13 `.tsx`. Os números da ADR (1.927/911/659/504) tinham sido
  superados pela própria Etapa 2.

#### Added

- **`__tests__/helpers/http.ts`** — `makeReq`, `makeRes` e `asMock`: os doubles de request/response
  dos testes de API em um lugar, tipados. Elimina a repetição de `makeReq(overrides: any)` +
  `as any` em 10 arquivos.

#### Docs

- **`SPECS.md`** — gate de lint documentado como `eslint .` cobrindo `__tests__`.
- **`CONTEXT.md`** — §2.1 com a Etapa 3 concluída; P1 #9 (`next lint` depreciado) marcado como
  corrigido; P2 #4 com a contagem atual.
- **`ADR/ADR-001.md`** — Etapa 3 marcada como concluída e decisão do 3.5 registrada (corrigir os
  testes, sem `ignores`).

### 🤖 OpenCode Operations (5)

#### Security

- **`ADR-002` — matriz RBAC canônica e fechamento dos gates.** A matriz de `SPECS.md` §4.2 era o
  último item adiado pela `ADR-001`. A auditoria contra os handlers encontrou cinco divergências;
  duas eram falhas de privilégio, não documentação.
  - **MANAGER→DIRECTOR (escalada).** `POST /api/users` só barrava MANAGER de criar **ADMIN**
    (`users/index.ts:42`): um MANAGER criava **DIRECTOR**, papel acima do dele. Em
    `PATCH/DELETE /api/users/[id]`, o código comparava apenas com ADMIN — um MANAGER editava e
    excluía DIRECTOR, e o próprio DIRECTOR não geria ninguém (caía no `403` genérico). A regra
    agora é `canActOnUser`: DIRECTOR todos; ADMIN todos exceto DIRECTOR; MANAGER só VIEWER.
  - **ADMIN comum criava DIRECTOR.** `signup.ts:49-58` aceitava o papel DIRECTOR de qualquer ADMIN
    (quando não existia outro) e estourava 500 no segundo. `POST /api/users` repetia. Agora DIRECTOR
    é **singleton**: só o criador (`isCreator`) semeia o primeiro, e só enquanto não existir outro;
    o segundo devolve **409**, e `signup`/`POST` aplicam a mesma regra (`canAssignRole`).
  - **Hash de senha na resposta.** `POST /api/users` e `PATCH /api/users/[id]` devolviam o registro
    cru do Prisma, incluindo `password`. Ambos passaram a usar `select` com campos seguros.
  - **Espaços Pai.** `create/update/delete` exigiam `role === "ADMIN"`, embora a UI mostrasse a aba
    a DIRECTOR (`canManageAll`) e a matriz dissesse DIRECTOR/ADMIN/MANAGER. Agora DIRECTOR/ADMIN
    (`canManageSpaces`); MANAGER segue com ativos/categorias, sem a estrutura física. A prévia de
    exclusão usa o mesmo gate do delete.
  - **Logs.** A leitura já era DIRECTOR/ADMIN/MANAGER (`logs/list.ts`), mas `logs/clear.ts` era
    ADMIN-only — a UI mostrava o botão ao DIRECTOR, que recebia 403. Agora DIRECTOR/ADMIN apagam e
    MANAGER só lê. A limpeza registra o próprio rastro.
  - **UI de usuários.** As opções de papel passaram a depender do requisitante (MANAGER só VIEWER;
    ADMIN sem DIRECTOR; criador vê DIRECTOR enquanto não existir um) e as ações do MANAGER só
    aparecem em VIEWER. O modal mostra a mensagem do 403/400/409 em vez de fechar em silêncio.

#### Added

- **`lib/rbac.ts`** — política pura e tipada: `canManageSpaces`, `canReadLogs`, `canClearLogs`,
  `canActOnUser`, `assignableRoles`, `canAssignRole`, `isUserRole`. Os handlers delegam a decisão;
  a regra não é reescrita em cada arquivo (o anti-padrão que a ADR-001 apontou no JWT).
- **Testes de RBAC** — `__tests__/lib/rbac.test.ts` (política pura),
  `__tests__/api/rbac-users.test.ts`, `__tests__/api/rbac-spaces.test.ts`,
  `__tests__/api/logs-clear.test.ts`, mais casos em `father-spaces-delete` e `signup-rbac`.
  **90 testes novos** (suíte de 260 para **350**, 5 skipped). Cada guarda foi removida de propósito
  e os testes falharam: `canManageSpaces` → 5; `canAssignRole` → 7; `canClearLogs` → 4;
  `canActOnUser` → 3.

#### Changed

- **Contrato de resposta de `POST/PATCH /api/users`** — mesmos campos úteis (`id`, `name`, `email`,
  `role`, `lastLogin`, `createdAt`), sem `password`. A tela recarrega a lista após salvar.
- **Métodos não suportados em `/api/users/[id]`** — passam a devolver `405` com `Allow`, em vez de
  cair no fim do handler sem resposta.

#### Docs

- **`ADR/ADR-002.md`** — contexto, matriz canônica, alternativas, consequências e evidências em
  `f2c93e7`.
- **`SPECS.md` §4.2** — matriz com colunas separadas para ativos, categorias e espaços; nota de
  `fixedValue`, singleton do DIRECTOR, leitura de usuários e dashboard; linhas de `signup`,
  `/api/users`, `/api/users/[id]`, `/api/father-spaces/*` e `/api/logs/clear` na tabela de
  endpoints sensíveis.
- **`CONTEXT.md`** — §2.1 com a ADR-002 concluída e o bloco de RBAC em §3.1.

---

## - Initial Setup

### System

- **MegaNuv Inventory** — sistema interno de gestão de inventário de ativos da empresa MegaNuv.
- **Nome / slug / versão:** `inventory-meganuv` · `meganuv-inventory` · `2.22.6` (`package.json:3`, exposta via `lib/version.ts`).
- **Repositório:** `Fla175/MegaNuv-Inventory` · **Branch corrente:** `inventory-v2.22.6` · **Último commit:** `531a2f9`.
- **Stack:** Next.js 15.3.3 (Pages Router) · React 19.1.0 · TypeScript 5.9.3 (strict) · Tailwind CSS 4.1.11 · Prisma 6.18.0 + MariaDB · MinIO 8 (S3) · `jose` (JWT HS256) · `bcryptjs` · `formidable` · `lucide-react` · `react-qr-code` · `react-number-format`.
- **Banco:** datasource `provider = "mysql"`, **system-versioning do MariaDB obrigatório** para o recurso de revert. 6 models (`User`, `Movement`, `Category`, `Log`, `FatherSpace`, `Active`) e 2 enums (`UserRole`, `Theme`). 16 migrations aplicadas entre 12/01/2026 e 30/05/2026 — imutáveis.
- **Superfície da aplicação:** 36 endpoints em `pages/api/**`, 7 rotas de página, 12 componentes, 13 arquivos em `lib/`, ~10.300 linhas de código.
- **Funcionalidades:** hierarquia recursiva de espaços e ativos · movimentação com histórico (`Movement`) · 5 papéis de acesso (`DIRECTOR`/`ADMIN`/`MANAGER`/`VIEWER`) · upload de até 5 arquivos por ativo (10 MB) · etiquetas com QR Code · dashboard com agregados · auditoria em log imutável · **revert temporal** (`QUICK` em 10 s e `HISTORY`) · tema light/dark/system persistido por usuário.
- **Infra:** `compose.yml` com serviço `app` (Next, `192.168.20.2:3000`) e `banco` (MariaDB, `192.168.20.3`) na rede interna `192.168.20.0/24`; `Dockerfile` de 2 estágios em `node:22-alpine` com `output: "standalone"`; MinIO externo ao compose.
- **Estado de qualidade no início do setup multi-IA:** `yarn lint` ✅ · `npx tsc --noEmit` ✅ · `yarn build:opt` ✅ · **testes ❌ (0%, sem runner)** · **CI ❌ (ausente)**.
