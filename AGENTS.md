# AGENTS.md — Instruções Centrais (Multi-IA)

> Este é o **documento de entrada único** para qualquer agente de IA que atue neste repositório.
> Ele é intencionalmente curto e aponta para documentos canônicos. **Não duplique informação aqui.**

---

## 0. Ordem de Leitura Obrigatória

Antes de executar **qualquer** tarefa, leia nesta ordem:

1. `AGENTS.md` (este arquivo) — regras transversais.
2. `CONTEXT.md` — estado atual do projeto, foco da sprint e bloqueadores conhecidos.
3. `SPECS.md` — contrato técnico: stack, arquitetura, limites, contratos de API e Definition of Done.
4. `<SEU-AGENTE>.md` — regras locais específicas do seu agente:
   - `OPENCODE.md` — OpenCode
   - `JEV.md` — JEV AI
   - `CLAUDE.md` - Claude Code
   - `CURSOR.md` - Cursor
   - `DEVIN` - Devin
   - `GEMINI.md` — Gemini CLI
   - etc.
5. `CHANGELOG.md` — registro das mudanças feitas por IA (obrigatório ler antes e depois de alterar).

Se qualquer documento acima conflitar com um pedido do usuário, **o pedido do usuário prevalece**,
e a divergência deve ser registrada em `CHANGELOG.md` na mesma alteração.

---

## 1. Identificação do Projeto

| Campo | Valor |
|---|---|
| Nome | MegaNuv Inventory |
| Slug (`project.id`) | `meganuv-inventory` |
| Versão atual | `2.25.0` (fonte da verdade: `package.json:3`, exposta via `lib/version.ts`) |
| Branch corrente | `inventory-v2.22.6` |
| Repositório | `Fla175/MegaNuv-Inventory` |
| Stack | Next.js 15.3.3 (**Pages Router**) · React 19 · TypeScript 5.9 (strict) · Tailwind v4 · Prisma 6 + MariaDB · MinIO (S3) |
| Gerenciador de pacotes | **Yarn 1 (`yarn.lock`)** — nunca `npm install` |
| Tamanho do código | ~10.300 linhas em `.ts/.tsx/.css/.sh` |

---

## 2. Repositório de Documentos

| Documento | Contém | Mutabilidade |
|---|---|---|
| `AGENTS.md` | Regras transversais para todos os agentes. Índice, não enciclopédia. | Baixa — só muda por decisão explícita do usuário. |
| `OPENCODE.md` | Regras locais do OpenCode. | Média |
| `SPECS.md` | Contrato técnico verificável (stack, layout, dependências, contratos, DoD). | Alta — acompanha o código. |
| `CONTEXT.md` | Foto do "agora": foco atual, bloqueadores, débitos abertos. | **Alta — atualizada a cada sessão.** |
| `CHANGELOG.md` | Diário de alterações por agente de IA. | **Alta — append-only, uma seção por sessão.** |
| `ESTAGIO-1-CREATOR-ACCESS.md` | Arquitetura do acesso do criador (Estágio 1). | Média |
| `README.md` | Documentação de uso humano (existente, parcialmente desatualizada). | Média |

---

## 3. Regras Transversais Invioláveis

### 3.1 Segredos
- **NUNCA** escrever, colar, commitar ou ecoar valores de `.env`, `JWT_SECRET`, `MINIO_SECRET_KEY`,
  `MINIO_ACCESS_KEY`, `DB_PASSWORD` ou `DATABASE_URL` em qualquer arquivo, resposta de chat, log ou commit.
- Ao citar variáveis de ambiente, citar **apenas o nome**.
- **Não propagar** as credenciais MinIO que hoje estão hardcoded em `lib/minio.ts:9-10,18-19` e
  `pages/api/storage/upload-url.ts:14-15` (ver `CONTEXT.md` §3). Nenhuma credencial real pode ser adicionada
  a um literal de código novo.
- Antes de commitar, verificar que nenhum segredo entrou no diff.

### 3.2 Git
- A IA **pode** commitar **apenas em branch própria de trabalho** (ver convenção em `SPECS.md` §3.1).
- A IA **nunca** faz `push`, `tag`, `--force`, nem commita diretamente em `main` ou em branches
  versionadas (`inventory-vX.Y.Z`).
- Commits seguem **Conventional Commits**, coerentes com o histórico existente (`perf:`, `fix:`, `Update:`).
- O histórico do repositório **contém segredos no histórico** — nunca reescrever histórico com `rebase`/`filter-branch`.

### 3.3 Escopo de alteração
- Alterar o mínimo necessário para o objetivo declarado. **Não fazer refactor oportunista** junto de uma correção.
- Não mexer em `yarn.lock` a menos que a dependência realmente mude.
- **Nunca** rodar `npm install` / `npm ci` / `npx <pacote>` que altere lockfiles — usar `yarn`.
- Não apagar nem regenerar as 16 migrations em `prisma/migrations/`. Migrations são imutáveis após aplicadas.

### 3.4 Documentação como parte do trabalho
Toda alteração de IA **deve**, no mesmo conjunto de mudanças:
1. Registrar a entrada em `CHANGELOG.md` sob `## [Unreleased] → ### <agente> Operations`.
2. Atualizar `CONTEXT.md` se o foco, o status ou os bloqueadores mudaram.
3. Atualizar `SPECS.md` se a stack, a arquitetura, um contrato de API ou a DoD mudaram.

---

## 4. Gates de Qualidade (resumo — detalhe em `SPECS.md` §5)

Estado atual do repositório: **0% de cobertura de testes e nenhuma CI**. A partir deste setup, a DoD é **estrita**:

```
yarn lint          → 0 erros, 0 avisos
npx tsc --noEmit   → 0 erros
prisma validate    → schema válido
yarn build:opt     → build standalone bem-sucedido
testes             → obrigatórios para TODO caminho novo de lógica de negócio
```

Comandos são usados para **verificar**; qualquer mudança de código nova precisa passar por todos.
Falha em qualquer gate = mudança **não concluída**.

---

## 5. Fluxo Padrão de Trabalho de um Agente

1. Ler `CONTEXT.md` §2 para entender o foco atual.
2. Branchar: `git checkout -b <tipo>/<slug-curto>` a partir da branch corrente.
3. Implementar o escopo mínimo.
4. Rodar os gates do §4. Iterar até passar.
5. Atualizar `CHANGELOG.md`, `CONTEXT.md` e, se aplicável, `SPECS.md`.
6. Commitar na branch própria com mensagem Conventional Commits.
7. **Reportar ao usuário.** Não fazer push. Não abrir PR sem pedido explícito.

---

## 6. Anti-Padrões Conhecidos neste Repositório

Não reproduzir estes padrões em código novo. Cada um tem uma entrada em `CONTEXT.md` §3.

| Anti-padrão | Onde existe hoje |
|---|---|
| Verificação de JWT replicada em ~22 arquivos em vez de um helper único | `pages/api/**`, `lib/middlewares/authMiddleware.ts` (usado por 1 arquivo) |
| Arquivo de 1.927 linhas com UI, modais, impressão e context menu | `components/ListSection.tsx` |
| Credencial ou host de produção como *fallback* de `process.env` | `lib/minio.ts:6,15`, `pages/api/storage/upload-url.ts:11,40` |
| Endpoint em `PUBLIC_PATHS` do middleware sem auth no handler | `middleware.ts:6-18` |
| Validação de upload de arquivo apenas no cliente | `components/FileUpload.tsx:134` |
| Dependência declarada e nunca importada (12 no total) | `recharts`, `framer-motion`, `react-rnd`, `@headlessui/react`, `axios`, `jsonwebtoken`, `js-cookie`, `jwt-decode`, `eruda`, `uuid`, `qrcode.react` |

---

## 7. Idioma

Documentos e mensagens de IA: **Português-BR**.
Código, identificadores, nomes de rota, nomes de commit e comentários técnicos em inglês: **permanecem em inglês**
(coerente com o estado atual do repositório). Não "traduza" o código existente.
