# ESTAGIO-1-CREATOR-ACCESS.md — Arquitetura do acesso do criador

> Design do **Estágio 1** de `next-stages.md`: botão de acesso do criador nos cartões de usuário
> de `pages/settings.tsx`, com API exclusiva `creator-access.ts`.
>
> Documento de **design**. Nenhum arquivo de aplicação foi alterado. A implementação é o
> `## 6. Plano de execução` e depende da aprovação do usuário.

> **Atualizado em 15/10/2026.** O dono do projeto removeu as feature flags do Acesso do Criador: o
> recurso é **sempre ativo** e **sempre exige a senha do criador** (commit `0d575aa`). As variáveis
> `CREATOR_ACCESS_ENABLED` e `CREATOR_ACCESS_REQUIRE_PASSWORD` não existem mais. Onde este documento
> ainda descreve flag, kill switch ou a variante B como padrão, o texto é **histórico** — o contrato
> canônico vigente está em `SPECS.md` §5.1.

**Status:** proposto · **Data:** 30/09/2026 · **Base:** `inventory-v2.22.6` @ `531a2f9`

---

## 1. Decisões do usuário (30/09/2026)

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Identidade do criador | **Novo campo `isCreator` no schema**, blindado. O título só pode ser cedido pelo próprio criador. O destinatário "se tornará um admin, se não for". |
| 2 | Mecânica do acesso | Um clique; o back-end "loga na conta"; redireciona; botão de **voltar** à conta do criador. |
| 3 | Sessão do criador | Cookie que assume prioridade enquanto existir; deletado quando o admin volta. |
| 4 | Testes | **Autorizado** `vitest` + testes do gate (DoD §5.2). |

---

## 2. Bloqueio técnico em (2): bcrypt não descriptografa

A mecânica descrita em (2) tem uma premissa que **não é implementável**, e precisa ser dita antes
de qualquer código:

> "botão **desincripta** a senha da conta salva no bd"

`bcryptjs` é um **hash de mão única por construção**. Ele existe para responder `bcrypt.compare(senha,
hash)` → boolean. Não existe `bcrypt.decrypt(hash)` → senha, nem em versão alguma do algoritmo, e
nenhuma senha nunca é gravada de forma reversível no banco. Os 5 usos atuais no projeto
(`login.ts:32`, `seed.ts:33`, `signup.ts:67`, `users/index.ts:56`, `users/[id].ts:78`) são `hash` ou
`compare`. Recuperação de senha é feito por **reset**, não por decifragem — e exigir o e-mail do alvo
contraria o requisito de um clique.

**Consequência:** o objetivo que importa — *um clique, sem senha, sessão real da conta alvo, botão de
voltar* — é atingido **sem** descriptografar nada, porque o back-end pode **emitir** a sessão do alvo
diretamente, em vez de fingir ser o alvo com a senha dele. O bcrypt entra (ou não) por outra porta.

---

## 3. ADR-001 — Credencial da sessão impersonada

> **Status:** aceito (o usuário não pôde ser consultado via Jev: sem `TYPESAFE_API_KEY` no ambiente;
> decisão tomada por raciocínio sobre as evidências do código e reportada para confirmação)

### Contexto

O requisito é um clique. O botão vive em `pages/settings.tsx:615-657`, que só renderiza para sessão
autenticada. Três restrições do código:

1. **22 arquivos** em `pages/api/**` leem `req.cookies.auth_token` diretamente (verificado por `rg`).
   Nenhum deles conhece um segundo cookie de token.
2. `lib/auth.ts:43-58` (`generateAuthToken`) é o construtor canônico de token: HS256 via `jose`, payload
   `{userId, email, role, name}`, expiração **fixa** de 8 h (`setExpirationTime('8h')`, sem parâmetro).
   Hoje **não tem nenhum chamador em runtime** — só é citado em `OPENCODE.md:171`.
3. `CONTEXT.md` §3.1 item 11: logout não revoga token; não existe denylist de sessão.

### A decisão que a restrição (1) força

A descrição de (3) na §1 do usuário — "um cookie que assume a prioridade enquanto existir" — **não é
implementável sem quebrar a consistência de autorização**. Se o token da conta alvo morasse num cookie
secundário que "vence por prioridade", nenhum dos 22 endpoints o leria: a UI mostraria o alvo, mas o
back-end continuaria autorizando o criador nas verificações de papel. O efeito seria o pior possível —
impersonar um `VIEWER` e ainda assim executar ações de `ADMIN`.

A restrição é resolvida invertendo **qual** cookie guarda **qual** token:

| | Solução ingênua (rejeitada) | **Solução adotada** |
|---|---|---|
| `auth_token` | token do **criador** (intacto) | token **efetivo** — alvo enquanto impersona, criador antes/depois |
| 2º cookie | token do **alvo**, "vencendo por prioridade" | token **original do criador** (stash de retorno), httpOnly |
| 22 endpoints | leriam o token **errado** | leem `auth_token` e veem o alvo — **funcionam sem alteração** |
| "Voltar" | exige resolver prioridade em todo lugar | troca os dois cookies em **uma** resposta |

A "prioridade" que o usuário pediu é obtida por **quais** tokens cada cookie carrega, não por lógica de
resolução espalhada. Efeito: **zero alterações** nos 22 endpoints, zero dívida nova em código existente,
coerência total de autorização.

### Alternativas avaliadas

| # | Alternativa | Veredito |
|---|---|---|
| A | **Overlay assinado por `jose` + stash httpOnly** (adotada) | 1 clique real, sem senha, sem custo por requisição, 0 arquivos legados alterados. bcrypt não participa. |
| B | A + `bcrypt.compare` da senha do criador no POST | bcrypt no lugar certo (senha humana de baixa entropia). Mas contraria "acesso automático": vira 2 cliques + 1 campo, e +80-120 ms de CPU por emissão. Foi **opt-in**; em 15/10/2026 virou o **padrão** (decisão do dono, §13 item 5). |
| C | `bcrypt.compare` a **cada requisição** do caminho comum | bcrypt é o algoritmo **errado** para segredo de alta entropia (HMAC-SHA256 seria o certo), roda a 60-100 ms × todas as requisições da API e **não adiciona segurança** — o token HMAC já é unforgeável. Rejeitada. |
| D | Regerar e sobrescrever `user.password` do alvo | Destrói a senha real do usuário e deixa a conta exposta no navegador. Rejeitada por risco de dados. |

### Consequências

**Boas**
- 1 clique, sessão real do alvo, "voltar" instantâneo e sem novo login.
- Nenhum arquivo de `pages/api/**` existente é tocado. Nenhuma dívida nova.
- `generateAuthToken` ganha o primeiro consumidor real e passa a ser a **única** fonte da forma do token.

**Ruins (aceitas, documentadas)**
- **O stash não é revogável.** Ele é um token de 8 h num cookie httpOnly. É exatamente a dívida #11 já
  registrada (`logout` não revoga). Corrigi-la aqui sem corrigi-la no `logout` seria um buraco pior:
  ver §5, correção (C).
- **A sessão da impersonação é mais curta que a da criação.** Intencional: 2 h em vez de 8 h (§5).
- **bcrypt não participa do caminho de autenticação desta feature.** Registrado aqui para não ser
  lido como omissão.

---

## 4. Schema — campo `isCreator`

```prisma
model User {
  // … 22 campos existentes …
  isCreator  Boolean  @default(false)  // Admin Criador: único por instância, out-of-band
}
```

Migration **append-only** nova. DDL puro, sem dado:

```sql
ALTER TABLE `User` ADD COLUMN `isCreator` TINYINT(1) NOT NULL DEFAULT FALSE;
```

### 4.1 Backfill — passo manual, separado da migration

`prisma/migrations/` é imutável e `OPENCODE.md` §2.4 exige autorização explícita para mutar dados. O
backfill é, portanto, um passo manual do operador, **idempotente** e com precedência determinística —
a coluna nasce com todo mundo em `false`, o que **desabilita a feature com segurança** até o passo rodar.

Precedência (primeira que casar): `isCreator = true` mais antigo → `role = 'ADMIN'` mais antigo →
`role = 'DIRECTOR'` mais antigo → usuário mais antigo.

```sql
UPDATE `User` SET `isCreator` = TRUE
WHERE `isCreator` = FALSE
  AND NOT EXISTS (SELECT 1 FROM (SELECT `isCreator` FROM `User`) AS u WHERE u.`isCreator` = TRUE)
ORDER BY `createdAt` ASC
LIMIT 1;
```

> Se a resposta for `0 rows affected`, **nenhum** usuário tem `isCreator = true`: a feature fica
> inerte e o botão nunca aparece. Isso é o comportamento seguro — não um bug. Verificar com
> `SELECT id, email, role, isCreator FROM User;` (não exibe segredos).

---

## 5. Blindagem do campo — regras invioláveis

`isCreator` é privilégio do nível mais alto. Cada regra abaixo tem um teste de regressão
correspondente (§10).

| # | Regra | Como é garantida |
|---|---|---|
| **A** | **Nunca** escrito por caminho genérico de usuário. | `pages/api/users/[id].ts:80-88` grava só `{name, email, role, password}`; `users/index.ts:58-65` grava só `{name, email, role, password}`. Confirmado por inspeção + teste de regressão parametrizado sobre as duas rotas. |
| **B** | Escrita só pelo endpoint de cessão, e só pelo detentor atual. | `PATCH /api/creator-access` exige `isCreator === true` na sessão **efetiva**. |
| **C** | `logout` limpa **os dois** cookies. | ⚠️ **Bug de projeto aberto:** `pages/api/auth/logout.ts:9-17` limpa só `auth_token`. Sem esta correção, um creator que faz logout enquanto impersona **deixa um token de 8h do diretor vivo no navegador**. Correção entra no escopo. |
| **D** | Acesso **incondicional**, fail-closed **por senha**. | O acesso do criador **nunca** é desligável por configuração: nenhuma flag o habilita ou desabilita. A proteção é exigir a senha do criador e validá-la com `bcrypt.compare` a cada entrada — ausente → `400`, incorreta → `401`. **Motivo da troca (15/10/2026):** a flag anterior era obrigatória, mas não documentada no `.env.example`; quem configurou a implantação omitiu a linha e o recurso degradou em silêncio com um `403` sem mensagem, enquanto `vitest.config.ts` semeava a flag como `true` e mascarava a falha em CI. Um kill switch cujo default desliga o recurso é uma armadilha, não um controle. **Não reintroduzir flags.** |
| **E** | No máximo **um** detentor. | Verificação dentro de `db.$transaction` com `isolationLevel: Serializable`. |
| **F** | Não vazado na listagem. | `/api/users` GET **não** inclui `isCreator` no `select` (`users/index.ts:16-23` fica intocado) — o botão depende só do flag da **sessão**. |
| **G** | Auditável. | `enter` / `restore` / `transfer` gravam `Log` com ator, alvo, IP e UserAgent. |
| **H** | Sem impersonação encadeada. | O gate é `isCreator` na sessão efetiva; o alvo nunca é detentor (regra E), então um `DIRECTOR` impersonado não pode reimpersonar. |
| **I** | Sem dupla impersonação. | `409` se o cookie de stash já existe — força `restore` antes de entrar em outra conta. Evita confusão de sessão e mantém a trilha de auditoria linear. |
| **J** | `lastLogin` do alvo **não** é tocado. | Não é um login; mexer poluiria o histórico de acesso do usuário. |

### 5.1 Drift de papel

O gate é **`isCreator === true` isolado**, não `isCreator && role === 'ADMIN'`. O título é a
autoridade; o papel é ortogonal. Consequência aceita: um creator degradado a `VIEWER` via
`PATCH /api/users/[id]` **continua** com o poder de impersonar. A cessão promove o destinatário a no
mínimo `ADMIN`, então a deriva é improvável — e é preferível a "magia" de re-promover no meio de um
PATCH de terceiro.

---

## 6. Contrato da API — `pages/api/creator-access.ts`

Um arquivo, três ações por método HTTP (mesmo estilo de discriminador de método de
`pages/api/users/index.ts`). **Não entra em `PUBLIC_PATHS`** — `middleware.ts` exige sessão em tudo
que não estiver na allow-list, e `/api/creator-access` não tem `.` no path, então cai no escudo de
token (`middleware.ts:66-94`). Nenhuma linha de `middleware.ts` muda.

Envelope de erro: `{ error: string }`, conforme `SPECS.md` §4.2 (o projeto mistura `error` e
`message`; o endpoint novo segue o canônico).

### `POST /api/creator-access` — entrar na conta

```jsonc
// request
{ "targetUserId": "<uuid>", "reason": "opcional, min 8 chars, vai para o log", "password": "<senha do criador>" }
```

| Passo | Ação |
|---|---|
| 1 | `req.method !== 'POST'` → `405` |
| 2 | Sem `auth_token` / token inválido → `401` |
| 3 | `verifyAuthToken` → `userId` do criador **efetivo** |
| 4 | `prisma.user.findUnique({ id })` → ausente → `403` (não revela existência) |
| 5 | `user.isCreator !== true` → `403` |
| 6 | Alvo inexistente → `404` |
| 7 | `targetUserId === userId` → `400` |
| 8 | Stash já presente → `409 { error: "Restaure sua conta antes de entrar em outra." }` |
| 9 | Sem `password` no corpo → `400 { error: "Senha é obrigatória." }` |
| 10 | `bcrypt.compare(password, creator.password)` falso → `401 { error: "Senha incorreta." }` |
| 11 | `tokenCriador` = cookie `auth_token` atual (verbatim) |
| 12 | `tokenAlvo` = `generateAuthToken({...alvo}, { expiresIn: '2h' })` |
| 13 | `createLog(req, userId, "CREATOR_ACCESS_ENTER", "…")` |
| 14 | `Set-Cookie: auth_token=<tokenAlvo>` + `Set-Cookie: auth_token_creator=<tokenCriador>` |
| 15 | `200 { user: {id, name, email, role}, impersonated: true }` |

### `DELETE /api/creator-access` — voltar à conta do criador

Sem stash → `400 { error: "Nenhuma sessão de criador para restaurar." }`.
Com stash → `200`, `Set-Cookie: auth_token=<stash>` + expira `auth_token_creator`, e
`createLog(..., "CREATOR_ACCESS_RESTORE", ...)` com `userId` do **alvo** (é a sessão efetiva que
está saindo).

Se o token original do criador **tiver expirado** durante a impersonação, `DELETE` ainda faz a troca e o
cliente cai em `/login`. É o comportamento correto e é a mesma semântica da dívida #11.

### `PATCH /api/creator-access` — ceder o título

```jsonc
{ "newCreatorId": "<uuid>" }
```

Em **uma** `db.$transaction` com `isolationLevel: Serializable` (regra E):

1. `newCreatorId === userId` → `400`
2. Destinatário inexistente → `404`
3. `UPDATE User SET isCreator = false WHERE isCreator = true`
4. `UPDATE User SET isCreator = true, role = <promovido> WHERE id = newCreatorId`
   — `<promovido>` = `ADMIN` se o papel atual for `VIEWER` ou `MANAGER`; preservado se já for `ADMIN`
   ou `DIRECTOR` (não há rebaixamento).
5. `createLog(..., "CREATOR_ACCESS_TRANSFER", ...)`

⚠️ **Auto-bloqueio:** ceder o título é **irreversível por esta API** — o antigo criador vira ADMIN
comum e não pode readquirir o título sozinho. Só outra pessoa que já o tenha pode ceder de volta. A UI
exige confirmação digitada (§8).

### 6.1 Extensão de `lib/auth.ts`

`generateAuthToken` recebe um **parâmetro opcional** — 3 linhas, backwards-compatible, hoje com
**zero chamadores**, então nenhum consumidor existente quebra:

```ts
export async function generateAuthToken(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  options?: { expiresIn?: string | number },   // default: '8h'
): Promise<string>
```

Motivo: mantém a **forma do token em um lugar só**. A alternativa — chamar `jose.SignJWT` direto no
endpoint — criaria um segundo construtor de token e a mesma duplicação que já existe entre
`login.ts:39-44` e `lib/auth.ts:52-54`, contrariando `SPECS.md` §4.2 ("`lib/auth.ts` é a fonte de
verdade").

---

## 7. Sinalização para a UI — `pages/api/auth/me.ts`

O cookie de stash é httpOnly: o cliente **não consegue** saber se está impersonando. Logo o servidor
precisa dizer. O `select` de `me.ts:26-38` ganha `isCreator`, e a resposta ganha uma chave irmã — o
`UserContext` já consome `data.user` e tolera chaves extras (`UserContext.tsx:45-50`), então a mudança
é **aditiva**, não-breaking.

```jsonc
{
  "user": { "id": "…", "name": "…", "email": "…", "role": "…", "theme": "…",
            "isCreator": true, "lastLogin": "…", "createdAt": "…" },
  "impersonation": { "active": true, "creatorName": "BugSlayer" }   // null quando não há stash
}
```

`creatorName` é resolvido do token do stash (`verifyAuthToken` → `name`), sem consulta extra ao banco.

---

## 8. UI

### 8.1 Botão no cartão — `pages/settings.tsx:615-657`

O botão fica **fora** do gate `showActionButtons` (`settings.tsx:620`), que hoje esconde ações quando
o alvo tem posto hierárquico maior (`isTargetHigherRank`, linhas 616-618). Entrar numa conta de
`DIRECTOR` é
precisamente o caso principal — esconder ali tornaria a feature inútil para o Admin Comum.

- Ícone `LogIn` (lucide), rótulo `Entrar`. Aparece só quando `user?.isCreator === true`.
- `onClick` → `POST /api/creator-access` com `{ targetUserId: u.id }` e o motivo (opcional).
- Sucesso → **`window.location.assign('/')`**, recarga total. Não basta um `router.push`: a UI é
  toda condicionada a papel (`canManageAll`, `canSeeLogs`, `settings.tsx:111-116`) e o tema vem do
  usuário (`UserContext.tsx:86-91`) — os dois precisam remontar.
- 409 → toast de aviso pedindo `restore` primeiro.

### 8.2 Botão de ceder título — `pages/settings.tsx:615-657`

Mesmo cartão, ícone `KeyRound` (já importado em `settings.tsx:9`), `ConfirmDialog` com
`variant="danger"` e texto que **exige digitar o nome do destinatário**, por causa do auto-bloqueio
(§6). Sem confirmação digitada, um clique acidental entrega o poder de volta para sempre.

### 8.3 Faixa de "voltar" — `components/Layout.tsx:163-167`

Precisa estar em `Layout`, não em `settings.tsx`: o creator navega entre `/`, `/dashboard` e
`/settings` enquanto impersona e a saída tem de estar visível nas três.

```tsx
{impersonation?.active && (
  <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
    <Undo2 size={16} className="text-amber-600 dark:text-amber-400" />
    <span className="text-xs font-black uppercase tracking-widest">
      Sessão de {impersonation.creatorName} · você está como {user?.name}
    </span>
    <button onClick={restoreCreatorSession}>Voltar à minha conta</button>
  </div>
)}
```

`restoreCreatorSession()` faz `DELETE /api/creator-access` e, em `200`, `window.location.assign('/')`.

### 8.4 `lib/context/UserContext.tsx`

- `User` ganha `isCreator: boolean` (linha 7-16).
- Estado novo `impersonation: { active: boolean; creatorName: string } | null`, preenchido no `fetchUser`
  (linhas 31-61) a partir da chave irmã.
- `restoreCreatorSession()` exposto pelo contexto.
- `useUser()` já lança fora do provider (linha 112-117) — contrato mantido.

---

## 9. Plano de execução

Branch própria: **`feat/creator-access`**, a partir de `inventory-v2.22.6`. Sequência — cada passo
passa nos 5 gates antes do próximo.

| # | Fatia | Arquivos | Verificação |
|---|---|---|---|
| **1** | Extensão de `generateAuthToken` (`expiresIn` opcional) | `lib/auth.ts` | `npx tsc --noEmit`; teste unitário do default `'8h'` e do override |
| **2** | Migration + colunas | `prisma/schema.prisma`, `prisma/migrations/<ts>_add_is_creator/` | `npx prisma validate`; `npx prisma migrate diff` sem drift |
| **3** | Handlers das 3 ações | `pages/api/creator-access.ts` | tabela de testes RBAC (§10) |
| **4** | Correção do `logout` (regra **C**) | `pages/api/auth/logout.ts` | teste: `Set-Cookie` inclui a expiração de `auth_token_creator` |
| **5** | Sinalização | `pages/api/auth/me.ts` | teste de forma da resposta; `UserContext` engole a chave nova |
| **6** | Botão no cartão + ceder título | `pages/settings.tsx` | `yarn lint`; teste do gate de render |
| **7** | Faixa de voltar | `components/Layout.tsx`, `lib/context/UserContext.tsx` | `yarn lint`; `npx tsc --noEmit` |
| **8** | Infra de teste | `vitest.config.ts`, `package.json` | `yarn test` verde |

Ordem deliberada: (4) antes de (6)/(7) porque a feature **vaza um token de 8 h** enquanto (4) não
existir — o buraco é criado na fatia 3 e só fechado na 4.

### 9.1 Pacotes adicionados (autorizados pelo usuário)

`yarn add -D vitest @vitest/coverage-v8` — mantém Yarn 1 e `yarn.lock` como fonte da verdade
(`AGENTS.md` §3.3). Atualizar `SPECS.md` §2.2 e §5.2 ao concluir.

---

## 10. Testes (DoD `SPECS.md` §5.2)

`vitest` com `lib/prisma` mockeado. Nada toca MinIO, MariaDB ou rede real.

| Grupo | Casos |
|---|---|
| **RBAC** (`POST`) | matriz parametrizada sobre os 4 papéis × creator/não-creator: sem sessão → `401`; `VIEWER` → `403`; `MANAGER` → `403`; `ADMIN` não-criador → `403`; creator → `200` |
| **Guards** | senha ausente `400`; senha incorreta `401` (sem `Set-Cookie` emitido); senha correta `200`; alvo inexistente `404`; auto-alvo `400`; stash presente `409`; sem `targetUserId` `400`; método errado `405` |
| **Blindagem** (regressão, regras A/F) | `PATCH /api/users/:id` e `POST /api/users` **não** alteram `isCreator`, para nenhum corpo |
| **Cessão** (regras E) | transfer promove `VIEWER`/`MANAGER` → `ADMIN`; preserva `ADMIN`/`DIRECTOR`; exatamente 1 detentor após N transfers concorrentes; auto-cessão `400` |
| **Cookies** (regra C) | `POST` emite os dois; `DELETE` troca e expira o stash; `logout` limpa os dois |
| **Expiração** | token da impersonação = 2 h; stash = o do criador, verbatim |
| **`me`** | `isCreator` presente; `impersonation` `null` sem stash e preenchido com stash |

`npx prisma migrate diff` deve reportar **zero** drift. Segredo nunca em fixture — `.env.test` local e
não rastreado.

---

## 11. Gates

```bash
yarn lint                                   # 0 erros, 0 avisos
npx tsc --noEmit                            # 0 erros
npx prisma validate                         # schema válido
npx prisma migrate diff                     # zero drift
yarn test                                   # novo no gate 5 (autorizado)
yarn build:opt                              # build standalone
```

`COOKIE_SECURE=<valor>` precisa existir no `.env`. `SPECS.md` §2.3 e
`CONTEXT.md` §3.3 item 8 registram que `COOKIE_SECURE` está ausente — ao tocar `logout.ts` e
`creator-access.ts`, a mesma expressão `process.env.COOKIE_SECURE === 'true'` de `login.ts:49` é usada,
**sem valor padrão**.

---

## 12. Documentos a atualizar no mesmo commit

1. `CHANGELOG.md` → `## [Unreleased]` → `### 🤖 OpenCode Operations` → `Added` / `Changed` / `Security`.
2. `CONTEXT.md` §2 (foco) e §3 (débito **#11** muda de "aberto" para "parcialmente endereçado").
3. `SPECS.md` — §4.1 (coluna nova em `User`), §4.2 (endpoint novo na tabela de endpoints sensíveis),
   §2.2 (vitest sai de "ausente"), §5.2 (runner instalado), §3.2 (mapa de diretórios).
4. `AGENTS.md` §2 — registrar este documento na tabela de repositório de documentos.
5. `next-stages.md` — marcar o Estágio 1 como concluído.

---

## 13. Decisões em aberto (precisam de resposta antes da fatia 6)

| # | Pergunta | Padrão proposto |
|---|---|---|
| 1 | **"Motivo" obrigatório?** Todo acesso de privilégio em ferramenta de produção costuma exigir justificativa, que vai para o `Log`. | Recomendado **obrigatório, min. 8 caracteres**. Custo: 1 campo de texto, o que tira o "1 clique puro". Opcional torna a feature um clique literal com rastreabilidade mais fraca. |
| 2 | **Nome do cookie de stash.** Você escreveu `auth-token-impersonated`; a convenção do projeto é `auth_token`. | Proposto `auth_token_creator`, por simetria com `auth_token` e com `authMiddleware`. O nome é interno — só o que importa é que os 22 endpoints nunca o leiam. |
| 3 | **Ao ceder o título, o criador anterior é rebaixado?** | Proposto: **mantém o papel** que já tinha (normalmente `ADMIN`), perde só `isCreator`. Rebaixar para `ADMIN` quem era `DIRECTOR` é uma decisão sua. |
| 4 | **Voltar quando o token do criador expirou.** | Proposto: troca os cookies mesmo assim e deixa o middleware mandar para `/login`. Nenhum caminho de recuperação. |
| 5 | **Fator de confirmação (variante B do ADR).** — **SUPERADA em 15/10/2026** | ~~Proposto: **fora do padrão**, ativado por `CREATOR_ACCESS_REQUIRE_PASSWORD=true`. Deixa o caminho bcrypt disponível sem impor o campo extra a quem não quiser.~~ **Superada:** o dono optou por exigir a senha **sempre**, dispensando a flag — o caminho bcrypt deixou de ser opt-in e virou a única porta de entrada (regra **D**). Motivo: as senhas ficam no **Bitwarden**, então o campo extra deixa de ser atrito e o custo de `bcrypt.compare` (~80-120 ms) é absorvido por uma única requisição autenticada. |