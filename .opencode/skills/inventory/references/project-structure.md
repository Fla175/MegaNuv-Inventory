# Estrutura do Projeto MegaNuv Inventory

## Visão Geral

Projeto: **MegaNuv Inventory**
Localização: `/var/code/inventory`
Stack: Next.js 15, TypeScript, Prisma 6, MariaDB, Tailwind CSS v4

---

## Estrutura de Pastas

```
/var/code/inventory/
├── .opencode/skills/      # Skills locais do projeto
├── analysis/             # Análises do auditor-yard
│   ├── analysis-001/    # Primeira análise
│   └── analysis-002/    # Segunda análise
├── code-changes/        # Registro de tasks realizadas
├── pages/               # Páginas + APIs
│   ├── api/            # Rotas API
│   └── index.tsx       # Página principal
├── components/         # Componentes React
│   ├── Layout.tsx
│   └── ...
├── lib/                # Funcionalidades
│   ├── prisma.ts      # Cliente Prisma singleton
│   ├── auth.ts        # Autenticação JWT
│   ├── minio.ts       # Upload de arquivos
│   └── context/       # React Context
├── prisma/             # Banco de dados
│   ├── schema.prisma  # Schema completo
│   └── migrations/    # Migrações
├── types/              # TypeScript types
│   └── inventory.ts   # Tipos do projeto
├── styles/            # CSS
│   └── globals.css
├── public/            # Assets estáticos
│   ├── logo.svg
│   └── ...
├── analysis/          # Análises do auditor-yard
├── middleware.ts      # Next.js middleware (auth)
├── .env               # Variáveis de ambiente
├── tailwind.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── next.config.ts
├── package.json
└── AGENTS.md          # Instruções para agentes
```

---

## analysis/

Pasta com análises do **auditor-yard**. Cada análise é uma subpasta numerada.

### Estrutura

```
analysis/
└── analysis-001/
    └── ANALYSIS.md    # Relatório da análise 1
```

### Como usar

1. Escaneie esta pasta para encontrar análises
2. Identifique o número mais alto (última análise)
3. Leia o arquivo ANALYSIS.md

### Formato ANALYSIS.md

Ver [references/analysis-reader.md](./analysis-reader.md)

---

## code-changes/

Pasta com registro de todas as tasks realizadas no projeto.

### Estrutura

```
code-changes/
└── CHANGE-001.md      # Task 1
└── CHANGE-002.md      # Task 2
```

### Formato

Cada CHANGE-N.md contém:
- Número, nome, tipo (FEAT/FIX/REFACTOR/etc)
- Descrição
- Causa
- Dificuldade
- Processo de correção/criação

Ver [references/code-changes.md](./code-changes.md)

---

## pages/

Frontend + APIs do Next.js (Pages Router).

### Estrutura

```
pages/
├── index.tsx              # Homepage
├── _app.tsx              # App wrapper
├── _document.tsx         # Document
├── login/                # Rota /login
├── admin/                # Rota /admin
└── api/                  # APIs
    ├── auth/
    │   └── [...nextauth].ts
    ├── produtos/
    │   └── index.ts
    └── ...
```

---

## components/

Componentes React reutilizáveis.

### Estrutura

```
components/
├── Layout.tsx        # Layout principal
├── Header.tsx       # Header
├── Footer.tsx       # Footer
├── Button.tsx       # Componente Button
├── Input.tsx        # Componente Input
└── ...
```

### Padrões

- Functional components
- TypeScript com props tipadas
- Tailwind CSS para estilos
- Nomes em PascalCase

---

## lib/

Funcionalidades e configurações.

### Arquivos Principais

| Arquivo | Função |
|---------|--------|
| `lib/prisma.ts` | Cliente Prisma singleton |
| `lib/auth.ts` | Funções JWT e cookies |
| `lib/minio.ts` | Upload/storage de arquivos |
| `lib/context/` | React Context (estado global) |

### Prisma Client

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## prisma/

Schema e migrações do banco de dados.

### Estrutura

```
prisma/
├── schema.prisma    # Schema completo
└── migrations/      # Migrações (2024_...)
    ├── 20240101_init/
    └── ...
```

### Schema

Contém modelos:
- User
- Produto
- Categoria
- Estoque
- Movimentacao
- etc

---

## types/

TypeScript types do projeto.

### Arquivo Principal

```typescript
// types/inventory.ts
// Contains all project types
```

---

## middleware.ts

Next.js middleware para autenticação.

Protege rotas que requerem login.

---

## .env

Variáveis de ambiente.

```
DATABASE_URL="mysql://user:pass@host:3306/inventory"
JWT_SECRET="sua_chave_secreta"
MINIO_ENDPOINT="..."
MINIO_ACCESS_KEY="..."
MINIO_SECRET_KEY="..."
```

---

## Comandos do Projeto

Ver [references/commands.md](./commands.md)

| Comando | Função |
|---------|--------|
| yarn dev | Iniciar dev server |
| yarn build | Build produção |
| yarn lint | ESLint |
| npx prisma migrate dev | Nova migração |
| npx prisma generate | Gerar cliente |