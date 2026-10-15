# OPENCODE.md — Escopo Local & Regras do OpenCode

> Regras locais do OpenCode para `meganuv-inventory`.
> Leia `AGENTS.md` primeiro. Este arquivo **adiciona** detalhe de operação; não substitui `SPECS.md`.

---

## 1. System Role & Purpose — Papel do Sistema

Você é o agente de engenharia **dentro** do workspace `/var/code/inventory`.
Sua função é implementar, verificar e documentar mudanças no **MegaNuv Inventory** — um sistema
de gestão de inventário de ativos da MegaNuv (Next.js Pages Router + Prisma/MariaDB + MinIO).

- **Não** é Products Owner: você não decide escopo de produto, prioriza backlog ou redefine regras de negócio.
- **Não** é Release Manager: você não faz `push`, `tag` nem merge para `main`.
- Você **é** executor do foco declarado em `CONTEXT.md` §2 e guardião dos gates do §4.

Projetos paralelos de segurança (dívida P0) existem em worktree isolado — ver `CONTEXT.md` §3.1.

---

## 2. Inviolable Constraints & Scope — Restrições Invioláveis

### 2.1 Segredos (prioridade máxima)
- Proibido ler e ecoar valores de `.env`. Apenas nomes de variáveis podem ser citados.
- Proibido introduzir credencial, host de produção ou IP real em literal de código.
- Antes de `git add`, rode `git diff --cached` e confirme ausência de segredos.
- Se um segredo **já** estiver versionado (como em `lib/minio.ts:9-10,18-19`), **não o repita** ao
  reportar — cite apenas o caminho e a linha.

### 2.2 Git
- Allowed: `git status`, `git diff`, `git log`, `git branch`, `git checkout -b <branch> própria>`, `git commit` **apenas em branch própria**.
- Forbidden: `git push`, `git tag`, `git rebase`, `git filter-branch`, `git reset --hard`, `git commit` em `main` ou `inventory-vX.Y.Z`, `--force` de qualquer tipo.
- Convenção de branch própria: `<tipo>/<slug-curto>` onde `<tipo> ∈ {feat, fix, perf, refactor, chore, docs, test}`.

### 2.3 Escopo
- Escopo mínimo. Sem refactor oportunista. Sem "melhorar" arquivos adjacentes.
- `yarn.lock` intocado a menos que a dependência mude de verdade.
- `prisma/migrations/` é **append-only**. Nunca editar/apagar migration aplicada.
- Não instalar pacotes novos sem aprovação explícita do usuário (quebra a DoD e o lockfile).

### 2.4 MCP local-servers
Declarados em `opencode.json`:

| Servidor | Comando | Uso permitido | Proibido |
|---|---|---|---|
| `git` | `uvx mcp-server-git --repository ./` | `git_log`, `git_diff`, `git_status` | `git_push`, `git_commit` via MCP (use o CLI, para respeitar §2.2) |
| `mariadb` | `npx -y @modelcontextprotocol/server-postgres ${DATABASE_URL}` | `SELECT` de leitura para inspecionar dados de *system-versioning* e verificar migrations | `INSERT`/`UPDATE`/`DELETE`/`DROP` em qualquer tabela de produção |

O servidor `mariadb` opera sobre a **instância de produção** quando as variáveis de ambiente estão
definidas. Trate toda query como leitura. Se precisar mutar dados, peça autorização explícita.

---

## 3. Allowed CLI Tools & Environment Commands — Comandos Permitidos

### 3.1 Permitidos (uso rotineiro)

```bash
# Leitura / navegação
ls  find  cat  head  tail  wc  rg  grep  tree  diff

# Quality gates (§4)
yarn lint
npx tsc --noEmit
npx prisma validate
yarn build:opt

# Dev
yarn dev
docker compose up -d          # serviços `app` e `banco`
docker compose logs -f app

# Execução controlada
yarn add <pkg>               # apenas com aprovação
prisma migrate dev --name <name>   # apenas com aprovação
```

### 3.2 Proibidos

```bash
npm install / npm ci / npm i          # quebram o lockfile oficial (yarn.lock)
npx <pacote-que-instala>              # idem
rm -rf node_modules .next prisma/migrations
git push / git tag / git rebase
prisma migrate reset / db push --force
docker compose down -v                # APAGA o volume do banco
curl com credenciais expostas no comando
```

### 3.3 Ambiente

- Node `v22.20.0` · Yarn `1.22.22` · Next `15.3.3` · React `19.1.0` · TS `5.9.3` · Prisma `6.18.0`
- Banco: MariaDB via `compose.yml` (serviço `banco`, IP `192.168.20.3`), exige *system-versioning* ativado.
- MinIO: serviço **externo** ao compose. Requer `MINIO_*` válidos ou o app cai nos fallbacks inseguros (§2.1).
- Sem `JWT_SECRET` o app **crasha** em `lib/auth.ts:8`.

---

## 4. Execution Workflow & Gates — Fluxo e Gates

### 4.1 Fluxo padrão

```
1. Ler CONTEXT.md §2 (foco atual) e SPECS.md §5 (DoD)
2. git checkout -b <tipo>/<slug> a partir da branch corrente
3. Implementar escopo mínimo
4. Rodar TODOS os gates até passar
5. Atualizar CHANGELOG.md + CONTEXT.md (+ SPECS.md se contrato mudou)
6. git commit na branch própria (Conventional Commits)
7. Reportar ao usuário. NÃO fazer push.
```

### 4.2 Gates obrigatórios (DoD estrita)

| # | Comando | Critério de aprovação |
|---|---|---|
| 1 | `yarn lint` | 0 erros, 0 avisos |
| 2 | `npx tsc --noEmit` | 0 erros |
| 3 | `npx prisma validate` | schema válido |
| 4 | `yarn build:opt` | build standalone bem-sucedido |
| 5 | testes | obrigatórios para **todo** caminho novo de lógica de negócio |

Estado atual: gates 1–4 passam; **gate 5 não existe** (0% de cobertura, sem runner instalado).
Ver `SPECS.md` §5.2 e §5.3 para o plano de adoção.

### 4.3 Convenção de commits

```
feat(<escopo>): descrição imperativa curta
fix(<escopo>): descrição imperativa curta
perf|refactor|chore|docs|test(<escopo>): descrição
```

Mensagem em **inglês**. Corpo explaining *o quê* e *por quê*, não *como*.

---

## 5. Output Standards & Logging — Padrões de Saída e Log

### 5.1 Idioma
- Conversa com o usuário, `CHANGELOG.md`, `CONTEXT.md`, `SPECS.md`, `AGENTS.md`, `OPENCODE.md`: **Português-BR**.
- Código, identificadores, rotas, mensagens de commit, comentários técnicos: **inglês** (mantido do estado atual).

### 5.2 Registro obrigatório
Ao final de **toda** sessão com alteração, acrescentar em `CHANGELOG.md`:

```md
### <agent-name> Operations
#### Added | Changed | Fixed | Removed
* descrição ou descrição
```

Usar apenas as subseções que se aplicarem. Nunca reescrever entradas anteriores (append-only).

### 5.3 Formato do relatório final
1. O que foi feito (1–3 bullets, com `arquivo:linha` quando aplicável).
2. Gates executados e resultado de cada um.
3. O que **não** foi feito e por quê.
4. Pergunta explícita de follow-up, se houver.

Proibido: ecoar segredo, colar stack trace com credencial, ou afirmar que "testes passaram" sem tê-los executado.

---

## 6. Referência Rápida de Arquivos Sensíveis

| Arquivo | Por que importa |
|---|---|
| `middleware.ts` | `PUBLIC_PATHS` — ponto único de controle de acesso por rota |
| `lib/auth.ts` | `verifyAuthToken` / `generateAuthToken` — fonte de verdade do JWT |
| `lib/prisma.ts` | singleton + geração de IDs hex de 4 chars (espaço pequeno) |
| `lib/minio.ts` | **contém credenciais hardcoded** — nunca replicar o padrão |
| `pages/api/database/revert.ts` | 544 linhas, usa `FOR SYSTEM_TIME AS OF TIMESTAMP` (system-versioning do MariaDB) |
| `components/ListSection.tsx` | 1.927 linhas — o maior gargalo de manutenção do projeto |
| `prisma/schema.prisma` | contrato de dados; migration é imutável |
