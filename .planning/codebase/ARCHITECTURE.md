# MegaNuv Inventory — Arquitetura do Sistema

## Visão Geral

**Stack Tecnológico:**
- Next.js 15 (Pages Router)
- TypeScript (Strict Mode)
- Prisma 6 + MariaDB
- Tailwind CSS v4
- JWT + bcryptjs para autenticação
- Lucide React para ícones

**Arquitetura Geral:** Monólito server-side renderizado com API REST integrada.

---

## 1. Autenticação e Autorização

### Fluxo de Autenticação (JWT)

```
┌──────────────┐    POST /api/auth/login     ┌──────────────┐
│   Login      │ ────────────────────────→│   API       │
│   Page      │                         │   Route     │
└──────────────┘                         └──────────────┘
       │                                         │
       │         Cookie (httpOnly, secure)         │
       │←───────────────────────────────────────│
       │                                         ▼
       │         Bearer Token no Header         ┌──────────────┐
       │←──────────────────────────────────────│  JWT Verify  │
       │                                         │  (8h expiry) │
       │                                         └──────────────┘
```

**Arquivos:**
- `/pages/api/auth/login.ts` — Gera token JWT (expiresIn: 8h)
- `/pages/api/auth/signup.ts` — Criação de usuário
- `/pages/api/auth/logout.ts` — Invalidação de cookie
- `/pages/api/auth/me.ts` — Retorna dados do usuário atual
- `/pages/api/auth/seed.ts` — Verifica se precisa de setup inicial
- `/lib/auth.ts` — `verifyAuthToken()`, `generateAuthToken()`
- `/lib/middlewares/authMiddleware.ts` — Protege rotas de API

**Modelo de Roles:**
```prisma
enum UserRole {
  ADMIN   // Acesso total
  MANAGER // Gestión de activos
  VIEWER  // Apenas visualização
}
```

**Proteção de Rotas API:**
```typescript
authMiddleware(handler, ['ADMIN', 'MANAGER'])
```

### Contexto de Usuário (React Context)

**Localização:** `/lib/context/UserContext.tsx`

**Responsabilidades:**
- Estado global do usuário logado (`user`, `loading`)
- Refresco de dados após login
- Aplicação de tema (DARK/LIGHT/SISTEM)

**Provedor:** `<UserProvider>` em `_app.tsx`

---

## 2. Estrutura de Dados (Prisma Schema)

### Modelos do Banco

```
User ─────────┬─────────→ Active (createdBy)
            ├─────────→ FatherSpace (createdBy)
            └─────────→ Log (userId)

Category ──────────────→ Active (categoryId)

FatherSpace (parentId) ─┬─────────→ Active (fatherSpaceId)
                       └─────────→ FatherSpace (children)

Active (parentId) ────────→ Active (children)
```

### Entidades Principais

| Modelo | Descrição | ID Unique |
|--------|-----------|----------|
| `User` | Usuários do sistema | UUID |
| `Category` | Categorias de ativos | UUID |
| `Active` | Ativos patrimoniais | Hex 4 caracteres |
| `FatherSpace` | Locais/Espaços pai | Hex 4 caracteres |
| `Log` | Logs de auditoria | UUID |

### Geração Automática de IDs

**Localização:** `/lib/prisma.ts`

O PrismaClient é estendido para gerar IDs hexadecimais de 4 caracteres automaticamente:

```typescript
// Active → ex: "A1B2"
// FatherSpace → ex: "0001"
randomBytes(2).toString('hex').toUpperCase()
```

---

## 3. rotas de API REST

### prefixo `/api/`

| Rota | Método | Descrição | Autenticada |
|------|--------|----------|-------------|
| `/api/auth/login` | POST | Login | Não |
| `/api/auth/signup` | POST | Cadastro | Não |
| `/api/auth/logout` | POST | Logout | Sim |
| `/api/auth/me` | GET | Dados do usuário | Sim |
| `/api/auth/seed` | GET | Check inicial | Não |
| `/api/actives/list` | GET | Lista ativos | Sim |
| `/api/actives/create` | POST | Cria ativo | Sim |
| `/api/actives/update` | PUT | Atualiza ativo | Sim |
| `/api/actives/delete` | DELETE | Remove ativo | Sim |
| `/api/actives/move` | POST | Move ativo | Sim |
| `/api/categories/list` | GET | Lista categorias | Sim |
| `/api/categories/create` | POST | Cria categoria | Sim |
| `/api/categories/update` | PUT | Atualiza categoria | Sim |
| `/api/categories/delete` | DELETE | Remove categoria | Sim |
| `/api/father-spaces/list` | GET | Lista espaços | Sim |
| `/api/father-spaces/create` | POST | Cria espaço | Sim |
| `/api/father-spaces/update` | PUT | Atualiza espaço | Sim |
| `/api/father-spaces/delete` | DELETE | Remove espaço | Sim |
| `/api/users/index` | GET | Lista usuários | ADMIN |
| `/api/users/[id]` | GET/PUT | Gerencia usuário | ADMIN |
| `/api/users/update-sort` | PUT | Atualiza ordenação | Sim |
| `/api/users/update-theme` | PUT | Atualiza tema | Sim |
| `/api/dashboard/stats` | GET | Estatísticas | Sim |
| `/api/logs/list` | GET | Lista logs | ADMIN |
| `/api/logs/clear` | DELETE | Limpa logs | ADMIN |
| `/api/storage/upload-url` | POST | URL para upload | Sim |

### respostapadrao

Todas as APIs retornam JSON:
```typescript
// Sucesso (200)
{ data: [...] }
// ou
{ message: "..." }

// Erro (401/403/500)
{ message: "Descrição do erro" }
```

---

## 4. Frontend — Páginas e Componentes

### Páginas (`/pages/`)

```
/pages
├── _app.tsx           # Provedor global (UserProvider, ToastProvider)
├── _document.tsx     # Documento HTML customizado
├── index.tsx          # Gestão de Ativos (main)
├── login.tsx          # Login
├── dashboard.tsx      # Dashboard com estatísticas
├── settings.tsx      # Configurações do usuário
├── initial-setup/
│   └── register.tsx   # Registro inicial (setup)
├── qrcode/
│   └── view.tsx       # Visualização QR (público)
└── api/              # Rotas de API (server-side)
```

### Componentes (`/components/`)

```
/components
├── Layout.tsx              # Layout principal (sidebar, header)
├── HeaderSection.tsx        # Cabeçalho da página
├── SearchSection.tsx        # Filtros de busca
├── ListSection.tsx           # Lista de ativos
├── ListSection.tsx         # Seção com lista
├── AddLocationModal.tsx    # Modal de adicionar local
├── imageUpload.tsx         # Upload de imagem
├── FileUpload.tsx          # Upload de arquivo
├── actives/
│   └── activeForm.tsx      # Formulário de ativo (criar/editar/clonar)
└── ui/
    ├── Toast.tsx           # Toast notification
    ├── ToastContainer.tsx # Container de toasts
    └── ConfirmDialog.tsx  # Dialog de confirmação
```

### Contextos (`/lib/context/`)

```
/lib/context
├── UserContext.tsx     # Estado do usuário + tema
└── ToastContext.tsx  # Sistema de notificações
```

---

## 5. Fluxo de Dados (Data Flow)

### Carregamento Inicial

```
1. UserProvider monta (_app.tsx)
2. useEffect → fetch /api/auth/me
3. Cookie httpOnly enviado automaticamente
4. API retorna { user: {...} }
5. user setado no Context
```

### Criação de Ativo

```
1. User abre ActiveForm (mode: "create")
2. Preenche dados → submit
3. fetch('/api/actives/create', POST, body)
4. API valida token
5. prisma.active.create({ data })
6. Retorna { message: "Ativo criado" }
7. onClose → loadData()
8. Lista atualizada
```

### Dashboard

```
1. useEffect → fetch /api/dashboard/stats
2. API agrega:
   - totalValue: SUM(fixedValue)
   - totalActives: COUNT
   - categories: GROUP BY category
   - recentActives: ORDER BY createdAt DESC
   - recentMovements: ORDER BY updatedAt DESC
3. Renderiza KPIs + Grids
```

---

## 6. Sistema de Tema (Dark/Light)

**Localização:** `/lib/context/UserContext.tsx`

```typescript
// Aplicação baseada no theme do usuário
useEffect(() => {
  const isDark = user?.theme === 'DARK' || 
    (user?.theme === 'SISTEM' && mediaQuery.matches);
  
  root.classList.toggle('dark', isDark);
}, [user?.theme]);
```

**Opções:**
- `DARK` — Forçar tema escuro
- `LIGHT` — Forçar tema claro
- `SISTEM` — Seguir preferência do sistema

**CSS:** Tailwind CSS v4 usa `dark:` variants.

---

## 7. Upload de Arquivos (MinIO/S3)

**Localização:** `/lib/minio.ts`

- Endpoint: `/api/storage/upload-url`
- Retorna URL pré-assinada para upload direto
- Armazenamento de imagens de ativos

---

## 8. Middlewares

### authMiddleware

**Arquivo:** `/lib/middlewares/authMiddleware.ts`

```typescript
export const authMiddleware = (handler, requiredRoles?) => {
  return async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const user = verifyAuthToken(token);
    
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    req.user = user;
    return handler(req, res);
  };
};
```

---

## 9. Estrutura de Arquivos — Convenções

### Padrões de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `HeaderSection.tsx` |
| Páginas | kebab-case | `initial-setup/register.tsx` |
| APIs | kebab-case | `actives/create.ts` |
| Utilitários | camelCase | `useEscapeKey.ts` |
| Contextos | PascalCase | `UserContext.tsx` |

### Estrutura de Pastas

- `/pages/` — Rotas do Next.js (Pages Router)
- `/components/` — Componentes React
- `/lib/` — Utilitários, context, middlewares
- `/prisma/` — Schema e migrações
- `/styles/` — CSS global (Tailwind)

---

## 10. Fluxo de Autenticação (Detalhado)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE LOGIN                          │
└─────────────────────────────────────────────────────────────┘

1. Usuário acessa /login
2. useEffect → fetch /api/auth/seed
   └─ Se não há usuários → redireciona para /initial-setup/register
   
3. Usuário preenche email + senha
4. Submit → POST /api/auth/login
   ├─ bcrypt.compare(password, hash)
   ├─ jwt.sign({ userId, email, role, name }, JWT_SECRET, { expiresIn: '8h' })
   └─ res.setHeader('Set-Cookie', serialize('auth_token', token, { httpOnly, secure }))

5. Cookie armazenado no browser
6. Redireciona para / (dashboard)
7. UserProvider.useEffect → fetch /api/auth/me
   └─ Cookie enviado automaticamente
   └─ API retorna dados do usuário
   └─ user setado no Context

8. useEffect [user?.theme] → aplica tema CSS
```

---

## 11. Resumo — Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Login    │  │ Dashboard │  │ Ativos   │                │
│  │ Page     │  │ Page      │  │ Page     │                │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                │
│       │             │             │                       │
│       └─────────────┼─────────────┘                       │
│                     │                                     │
│              ┌──────▼──────┐                              │
│              │  _app.tsx   │                              │
│              │ (Providers) │                              │
│              └──────┬──────┘                              │
│                     │                                     │
└─────────────────────┼─────────────────────────────────────┘
                      │ HTTP + Cookie
┌─────────────────────▼─────────────────────────────────────┐
│                    NEXT.JS SERVER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Auth        │  │ Actives      │  │ Categories  │    │
│  │ Middleware  │  │ Handlers    │  │ Handlers   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │   PRISMA    │                         │
│                    │   CLIENT   │                         │
│                    └──────┬──────┘                         │
└──────────────────────────────┼───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                      MARIADB                               │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│  │ User   │  │Active │  │Category│  │Father │         │
│  │        │  │       │  │        │  │Space  │         │
│  └────────┘  └────────┘  └────────┘  └────────┘         │
└─────────────────────────────────────────────────────────────┘
```