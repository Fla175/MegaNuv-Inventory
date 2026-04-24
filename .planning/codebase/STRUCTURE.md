# MegaNuv Inventory — Estrutura do Projeto

## Raiz do Projeto

```
/var/code/inventory
├── .env                         # Variáveis de ambiente
├── .env.local                   # Variáveis locais (ignorado)
├── package.json                 # Dependências e scripts
├── tsconfig.json               # Configuração TypeScript
├── next.config.js             # Configuração Next.js
├── tailwind.config.js       # Configuração Tailwind CSS
├── .eslintrc.json          # Configuração ESLint
├── prisma/               # Schema e migrações do banco
├── pages/                # Rotas (Pages Router)
├── components/           # Componentes React
├── lib/                 # Utilitários e contexto
├── styles/              # CSS global
├── public/              # Arquivos estáticos
├── .planning/           # Documentação GSD
└── analysis/           # Análises do auditor
```

---

## Estrutura de Pastas — Detalhamento

### `/pages/` — Rotas do Next.js

```
pages/
├── _app.tsx                    # App wrapper (providers globais)
├── _document.tsx              # Documento HTML customizado
├── index.tsx                  # Página principal: Gestão de Ativos
├── login.tsx                  # Página de login
├── dashboard.tsx              # Dashboard com estatísticas
├── settings.tsx               # Configurações do usuário
├── initial-setup/
│   └── register.tsx           # Registro inicial (primeiro usuário)
├── qrcode/
│   └── view.tsx               # Visualização pública de QR
├── api/
│   ├── auth/
│   │   ├── login.ts           # POST: Autenticação
│   │   ├── signup.ts         # POST: Cadastro
│   │   ├── logout.ts        # POST: Logout
│   │   ├── me.ts            # GET: Dados do usuário
│   │   ├── seed.ts         # GET: Verifica setup inicial
│   │   └── (outros)         #
│   ├── actives/
│   │   ├── list.ts         # GET: Lista todos
│   │   ├── create.ts      # POST: Cria
│   │   ├── update.ts     # PUT: Atualiza
│   │   ├── delete.ts    # DELETE: Remove
│   │   ├── move.ts     # POST: Move entre espaços
│   │   └── (QR)        # /api/qrcode/public-get.ts
│   ├── categories/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── delete.ts
│   ├── father-spaces/
│   │   ├── list.ts
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── delete.ts
│   ├── users/
│   │   ├── index.ts            # GET: Lista usuários (ADMIN)
│   │   ├── [id].ts           # GET/PUT/DELETE: Gerencia usuário
│   │   ├── update-sort.ts     # PUT: Ordenação default
│   │   └── update-theme.ts    # PUT: Tema preference
│   ├── dashboard/
│   │   └── stats.ts          # GET: Estatísticas
│   ├── logs/
│   │   ├── list.ts           # GET: Lista logs
│   │   └── clear.ts         # DELETE: Limpa logs
│   ├── storage/
│   │   └── upload-url.ts    # POST: URL pré-assinada
│   ├── internal/
│   │   └── ensure-location-item.ts
│   ├── protected.ts
│   └── hello.ts
```

**Nota:** O Next.js Pages Router usa a estrutura de pastas para definir rotas:
- `/pages/index.tsx` → `https://dominio.com/`
- `/pages/dashboard.tsx` → `https://dominio.com/dashboard`
- `/pages/api/auth/login.ts` → `https://dominio.com/api/auth/login`

---

### `/components/` — Componentes React

```
components/
├── Layout.tsx                     # Layout principal com sidebar
├── HeaderSection.tsx               # Cabeçalho com título e ações
├── SearchSection.tsx               # Filtros de busca
├── ListSection.tsx                 # Lista de ativos rendered
├── ListSection.tsx                # (duplicado ou componente auxiliar)
├── AddLocationModal.tsx           # Modal para adicionar local
├── imageUpload.tsx                # Componente de upload de imagem
├── FileUpload.tsx                 # Upload genérico de arquivos
├── actives/
│   └── activeForm.tsx              # Formulário (criar/editar/clonar)
│   └── (sub-componentes)           #
└── ui/
    ├── Toast.tsx                   # Toast notification
    ├── ToastContainer.tsx         # Container de toasts
    └── ConfirmDialog.tsx          # Dialog de confirmação
```

**Organização:**
- Componentes funcionais na raiz
- Sub-componentes em pastas (`actives/`, `ui/`)
- Componentes grandes podem ter pasta própria

---

### `/lib/` — Utilitários

```
lib/
├── prisma.ts                     # PrismaClient com extensão de ID
├── auth.ts                      # JWT verify/sign
├── logger.ts                   # Utilitário de log
├── minio.ts                   # Configuração MinIO (upload)
├── version.ts                 # Versão do projeto
│
├── middlewares/
│   └── authMiddleware.ts      # Middleware de autenticação
│
├── context/
│   ├── UserContext.tsx       # Estado do usuário + tema
│   └── ToastContext.tsx       # Sistema de toasts
│
├── hooks/
│   ├── useEscapeKey.ts      # Hook para ESC
│   └── useMediaQuery.ts     # Hook para media query
│
└── constants/
    └── colors.ts             # Constantes de cores
```

---

### `/prisma/` — Banco de Dados

```
prisma/
├── schema.prisma              # Schema completo
├── migrations/               # Migrações aplicadas
│   ├── 20260112193816_inventorys_first_migration/
│   ├── 20260113144400_fix_alteracoes_.../
│   └── ...
└── migrations.lock           # Controle de migração (para SQLite)
```

**Schema File:** `schema.prisma` contém todos os modelos:
- `User`
- `Category`
- `Active`
- `FatherSpace`
- `Log`

---

### `/styles/` — CSS

```
styles/
└── globals.css              # CSS global + Tailwind directives
```

**Nota:** Tailwind v4 usa `@import "tailwindcss";` no globals.css.

---

### `/public/` — Arquivos Estáticos

```
public/
├── favicon.svg               # Favicon
├── logo-inventory.svg       # Logo
└── (outros)               # Imagens, ícones, etc.
```

---

## Convenções de Nomenclatura

### Arquivos de Código

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes React | PascalCase + .tsx | `HeaderSection.tsx` |
| Hooks | camelCase + .ts | `useEscapeKey.ts` |
| Utilitários | camelCase + .ts | `auth.ts`, `prisma.ts` |
| Contextos | PascalCase + Context.tsx | `UserContext.tsx` |
| Páginas | kebab-case | `initial-setup/register.tsx` |
| APIs | kebab-case | `actives/create.ts` |
| CSS | kebab-case | `globals.css` |

### Pastas

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Pastas de rotas | kebab-case | `initial-setup/` |
| Pastas de features | camelCase | `actives/`, `context/` |
| Pastas utilitárias | camelCase | `hooks/`, `middlewares/` |

### Variáveis e Funções

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Funções | camelCase | `verifyAuthToken()` |
| Constantes | SCREAMING_SKEW | `JWT_SECRET` |
| Componentes funcionais | PascalCase | `export default function Layout()` |
| Hooks customizados | camelCase | `useEscapeKey` (sem use em文件名, mas use no código) |

---

## Arquivos的重要性

### `_app.tsx` — Entry Point

**Localização:** `/pages/_app.tsx`

**Função:**
- Wraps toda a aplicação com providers
- Este é o primeiro componente renderizado

```tsx
export default function App({ Component, pageProps }) {
  return (
    <ToastProvider>
      <UserProvider>
        <Component {...pageProps} />
        <ToastContainer />
      </UserProvider>
    </ToastProvider>
  );
}
```

### `_document.tsx` — Documento HTML

**Localização:** `/pages/_document.tsx`

**Função:**
- Customização do HTML base
- lang, meta tags, etc.

### `schema.prisma` — Fonte da Verdade

**Localização:** `/prisma/schema.prisma`

**Função:**
- Define TODOS os modelos de dados
- Gera o PrismaClient automaticamente
- Documentação viva do banco

### `prisma.ts` — Cliente do Banco

**Localização:** `/lib/prisma.ts`

**Função:**
- Singelton do PrismaClient
- Extensões para geração automática de IDs

---

## Fluxo de Navegação

```
/login
   │
   ├─[sem usuários]──→ /initial-setup/register
   │
   └─[logado]──────→ /
                        │
                        ├─→ /dashboard
                        │    (estatísticas)
                        │
                        ├─→ / (principal)
                        │    (gestão de ativos)
                        │
                        └─→ /settings
                             (preferências)
```

---

## Padrões de Importação

### Alias `@/`

O projeto usa alias de importação:

```typescript
// Ao invés de '../../lib/prisma'
import prisma from '@/lib/prisma';

// Ao invés de '../components/Layout'
import Layout from '@/components/Layout';
```

**Configuração no `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Estrutura deuma Página Típica

```tsx
// pages/exemplo.tsx
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/context/UserContext";

export default function ExemploPage() {
  const [data, setData] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    // Carrega dados
  }, []);

  return (
    <Layout title="Título da Página">
      {/* conteúdo */}
    </Layout>
  );
}
```

---

## Estrutura deuma API Route Típica

```typescript
// pages/api/resource/action.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/authMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // lógica
  } else if (req.method === 'POST') {
    // lógica
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default authMiddleware(handler, ['ADMIN', 'MANAGER']);
```

---

## Resumo Visual

```
var/code/inventory
├── .env                 # DATABASE_URL, JWT_SECRET
├── package.json        # next, react, prisma, tailwind
├── prisma/
│   └── schema.prisma  # MODELOS
├── pages/            # ROTAS
│   ├── _app.tsx    # PROVIDERS
│   ├── api/        # API REST
│   └── *.tsx      # PÁGINAS
├── components/     # UI
├── lib/          # LÓGICA
│   ├── auth.ts   # JWT
│   ├── prisma.ts# DB
│   └── context/  # ESTADO
├── styles/       # CSS
└── public/      # ESTÁTICOS
```