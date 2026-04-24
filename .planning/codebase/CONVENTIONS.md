# Convenções de Código - MegaNuv Inventory

## Visão Geral

Este documento define as convenções e padrões de código utilizados no projeto MegaNuv Inventory.

## Stack Técnica

| Tecnologia | Versão |
|------------|--------|
| Next.js | 15.3.3 (Pages Router) |
| TypeScript | 5.9.3 |
| React | 19.0.0 |
| Prisma | 6.18.0 |
| Tailwind CSS | 4 |
| ESLint | 9 |

## TypeScript

### Strict Mode

O projeto utiliza **TypeScript Strict Mode** ativo:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Padrões de Tipagem

- **Interfaces** para tipos de objetos (PascalCase)
- **Types** para unions, aliases e tipos primitivos
- **Type exports** centralizados em `/types/`

```typescript
// Exemplo de interface
interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
}

// Exemplo de type
export type Role = 'ADMIN' | 'MANAGER' | 'VIEWER';
export type Theme = 'DARK' | 'LIGHT' | 'SISTEM';
```

### Type Assertion

Evitar `any`. Quando necessário, usar `as` com comentário:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = response.data;
```

## Estrutura de Pastas

```
/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes de UI (Toast, Dialog)
│   └── actives/         # Componentes específicos de ativos
├── lib/
│   ├── context/         # React Context (UserContext, ToastContext)
│   ├── hooks/           # Custom hooks (useEscapeKey, useMediaQuery)
│   ├── middlewares/     # Middlewares Next.js
│   └── prisma.ts        # Instância do cliente Prisma
├── pages/
│   ├── api/             # Rotas da API (Pages Router)
│   └── *.tsx            # Páginas da aplicação
├── prisma/
│   └── schema.prisma    # Schema do banco de dados
└── types/               # Definições de tipos globais
```

## Componentes

### Estrutura de Componentes Funcionais

```tsx
// components/ExampleComponent.tsx
import React from 'react';

interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export default function ExampleComponent({ title, onAction }: ComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

### Padrões Observados

1. **Componentes nomeados**: PascalCase (ex: `Layout.tsx`, `Toast.tsx`)
2. **Arquivo único**: Um componente por arquivo
3. **Default exports** para componentes de página
4. **Named exports** para hooks e utilities
5. **Props interfaces**: Sempre definir explicitamente

### Componentes de UI

Localização: `/components/ui/`

- **ConfirmDialog.tsx**: Diálogo de confirmação
- **Toast.tsx**: Notificações toast
- **ToastContainer.tsx**: Container para múltiplos toasts

## Hooks Personalizados

Localização: `/lib/hooks/`

### Convenção de Nomenclatura

- Prefixo `use` para hooks (obrigatório)
- Arquivo único por hook
- Export nomeado

```typescript
// lib/hooks/useEscapeKey.ts
export function useEscapeKey(callback: () => void, enabled: boolean = true) {
  // implementação
}
```

## Context API

Localização: `/lib/context/`

### Padrão Estabelecido

```typescript
// Context com typed provider e hook
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // provider implementation
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de <UserProvider>");
  }
  return context;
}
```

## API Routes

Localização: `/pages/api/`

### Padrão de Handler

```typescript
// pages/api/resource/endpoint.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // lógica
    return res.status(200).json(data);
  } catch (error) {
    console.error("ERRO endpoint:", error);
    return res.status(500).json({ error: "Mensagem de erro" });
  }
}
```

### Convenções

- Verificar método HTTP no início
- Usar JWT para autenticação em endpoints protegidos
- Retornar status code apropriado (200, 401, 403, 405, 500)
- Logging de erros no catch

## CSS / Tailwind CSS

### Versão

Tailwind CSS v4 com PostCSS

### Dark Mode

Configurado via seletor:

```javascript
// tailwind.config.mjs
const config = {
  darkMode: 'selector',
};
```

### Padrões de Classes

- Usar classes utilitárias do Tailwind
-dark: prefix para modo escuro
- Animações via classes nativas do Tailwind (`animate-in`, `slide-in-from-right-4`)

## ESLint

### Configuração

```javascript
// eslint.config.mjs
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
```

### Regras Ativas

- `next/core-web-vitals`: Regras do Next.js
- `next/typescript`: Regras TypeScript do Next.js

### Comentários de ESLint

Usar comentários inline quando necessário:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

## Autenticação

### JWT

- Cookie: `auth_token`
- Secret via `process.env.JWT_SECRET`
- Roles: ADMIN, MANAGER, VIEWER

### Padrão de Proteção

```typescript
const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
if (!token) return res.status(401).json({ error: "Sessão expirada." });

const decoded = jwt.verify(token, JWT_SECRET!) as { role: string };
if (decoded.role === "VIEWER") return res.status(403).json({ error: "Acesso negado." });
```

## Banco de Dados

### Prisma 6

- ORM com MariaDB
- Schema em `/prisma/schema.prisma`
- Cliente instanciado em `/lib/prisma.ts`

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const db = globalForPrisma.prisma || new PrismaClient();

export default db;
```

## Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos de componente | PascalCase | `Layout.tsx`, `Toast.tsx` |
| Arquivos de utilidade | kebab-case | `useEscapeKey.ts` |
| Interfaces | PascalCase | `UserContextType` |
| Types | PascalCase | `Role`, `Theme` |
| Hooks | camelCase com prefixo use | `useUser`, `useEscapeKey` |
| Variáveis | camelCase | `isSidebarOpen`, `projectVersion` |
| Constantes | SCREAMING_SNAKE_CASE | `JWT_SECRET` |

## Comentários

### Padrões Observados

- Comentários em português (idioma do projeto)
- Documentar decisões de arquitetura
- Explicar "por que" não "o que"

```typescript
/**
 * AJUSTE DE ESTRUTURA:
 * Sua API retorna { user: { ... } }. 
 * Verificamos se data.user existe para não salvar o objeto pai errado.
 */
```

## Imports

### Alias Path

```json
// tsconfig.json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

### Ordem de Imports

1. React/Next imports
2. Bibliotecas externas
3. Componentes internos
4. Hooks/Context
5. Utilitários

```typescript
import React, { ReactNode, useState } from "react";
import Head from "next/head";
import { LineChart, Box, Settings } from "lucide-react";
import Layout from "@/components/Layout";
import { useUser } from "@/lib/context/UserContext";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
```

## Configuração de Ambiente

Ver `.env` para variáveis necessárias:

```
DATABASE_URL=mysql://user:pass@host:3306/db
JWT_SECRET=secret_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MINIO_ENDPOINT=...
MINIO_PORT=...
```

## Scripts Disponíveis

```bash
yarn dev          # Inicia dev server
yarn build        # Build de produção
yarn lint         # ESLint
yarn seed         # Executa build
npx prisma migrate dev  # Criar migração
npx prisma generate     # Gerar cliente
```

## Recursos

- [Next.js 15](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)