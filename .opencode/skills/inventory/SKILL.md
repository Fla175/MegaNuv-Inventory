---
name: inventory
description: "Skill local do projeto MegaNuv Inventory. Controla versionamento, commits, e facilita leitura de análises do auditor-yard. ESCOPO: apenas este projeto."
compatibility: opencode
local: true
project: meganuv-inventory
projectPath: /var/code/inventory
---

# inventory — MegaNuv Inventory

Skill local do projeto MegaNuv Inventory. Usar apenas neste projeto.

## Escopo

| Categoria | O quê |
|-----------|-------|
| Versionamento | npm version (major/minor/patch) |
| Commits | Formato convencional + automático |
| Análises | Ler do auditor-yard |
| Tasks | Registrar em code-changes |

## Stack do Projeto

- Next.js 15 (Pages Router)
- TypeScript (strict)
- Prisma 6 + MariaDB
- Tailwind CSS v4
- JWT com cookies seguros

## Estrutura do Projeto

```
/var/code/inventory/
├── pages/          # Frontend + APIs (/pages/api/**)
├── components/     # Componentes React
├── lib/           # Prisma, MinIO, auth, context
├── prisma/        # Schema + migrations
├── types/         # TypeScript types
├── styles/        # globals.css
├── public/        # Assets (svgs, logo)
├── analysis/     # Análises do auditor-yard (analysis-N/)
├── code-changes/ # Tasks realizadas
├── middleware.ts  # Auth middleware
├── .env          # Variáveis de ambiente
├── tailwind.config.mjs
└── AGENTS.md     # Instruções do projeto
```

Ver [references/project-structure.md](./references/project-structure.md)

## Versionamento

### Detectar Nível

| Tipo | Condição |
|------|----------|
| **major** | Quebra compatibilidade, mudança API |
| **minor** | Nova funcionalidade retrocompatível |
| **patch** | Correção bug, refatoração |

### Atualizar Versão

```bash
npm version major
npm version minor
npm version patch
```

Isto: atualiza package.json + cria tag git + commit automático

## Commits

### Formato

```
<tipo>(<escopo>): <descrição>

- Task: <descrição>
- Dificuldade: <baixa|média|alta>
- Nível: <major|minor|patch>
- Como: <resumo>
```

### Tipos

- `feat`: nova funcionalidade
- `fix`: correção
- `refactor`: refatoração
- `chore`: manutenção
- `docs`: documentação

### Escopo

- `api`, `ui`, `db`, `auth`, `config`

### Após Completar

```bash
git add -A
git commit -m "feat(api): ..."
```

## Análises do Auditor-yard

**IMPORTANTE**: Quando usuário mencionar "análise" sem especificar:

**FAZER PERGUNTA CLARIFYING**:

> Deseja ler a análise do auditor-yard?
> 1. Ler última análise (analysis-N mais recente)
> 2. Ler análise específica (informe o número)
> 3. Não ler análise

### Como Ler

1. Escanear pasta `/var/code/inventory/analysis/`
2. Identificar último N (ex: analysis-002)
3. Ler conteúdo de `analysis/analysis-N/ANALYSIS.md`
4. Mostrar resumo em tabela

Ver [references/analysis-reader.md](./references/analysis-reader.md)

## Code Changes (Tasks)

Toda task completada deve ser registrada em `code-changes/CHANGE-N.md`.

Ver [references/code-changes.md](./references/code-changes.md)

## Navegação

- **[references/project-structure.md](./references/project-structure.md)** — Estrutura completa
- **[references/commands.md](./references/commands.md)** — Comandos yarn, prisma
- **[references/version-control.md](./references/version-control.md)** — Versionamento
- **[references/analysis-reader.md](./references/analysis-reader.md)** — Ler análises
- **[references/code-changes.md](./references/code-changes.md)** — Registrar tasks

## Regras de Ouro

1. **Sempre perguntar** sobre análise se usuário não especificar
2. **Commits automáticos** após cada task
3. **Versionar** conforme nível da mudança
4. **Registrar** todo trabalho em code-changes
5. **pt-BR** — output em português