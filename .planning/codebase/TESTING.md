# Testing - MegaNuv Inventory

## Visão Geral

Este documento aborda a abordagem de testes do projeto MegaNuv Inventory.

## Estado Atual dos Testes

**Status**: O projeto **NÃO possui testes automatizados** no momento.

### Estrutura Testada

Nenhuma das seguintes estruturas de teste foi encontrada:

- Arquivos `*.test.{ts,tsx,js}`
- Arquivos `*.spec.{ts,tsx,js}`
- Diretórios `__tests__/`
- Configuração de Jest, Vitest ou Cypress

## Stack de Testes Instalada

Nenhum framework de testes está instalado como dependência do projeto.

### Dependências atuais (package.json)

```json
{
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "15.3.3",
    "prisma": "^6.18.0",
    "tailwindcss": "^4",
    "typescript": "^5.9.3"
  }
}
```

## Verificação Estática de Código

### ESLint

O projeto utiliza ESLint para verificação estática:

```bash
yarn lint
```

Configuração em `eslint.config.mjs`:
- `next/core-web-vitals`: Regras do Next.js
- `next/typescript`: Regras TypeScript

### TypeScript Strict Mode

Verificação de tipos aktivada via `strict: true` em `tsconfig.json`.

## Recomendações para Implementação de Testes

### 1. Framework Recomendado

Para este projeto (Next.js 15 + React 19), as opções recomendadas são:

#### Option A: Vitest + React Testing Library

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

#### Option B: Jest + React Testing Library

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### 2. Estrutura Sugerida

```
/
├── components/
│   ├── __tests__/
│   │   └── Layout.test.tsx
│   └── ui/
│       └── __tests__/
│           └── Toast.test.tsx
├── lib/
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useEscapeKey.test.ts
│   └── context/
│       └── __tests__/
│           └── UserContext.test.tsx
└── pages/
    └── __tests__/
        └── index.test.tsx
```

### 3. Prioridades de Teste

1. **Alta prioridade**:
   - Hooks customizados (`useEscapeKey`, `useMediaQuery`)
   - Context providers (`UserContext`)
   - Funções de API em `/pages/api/`

2. **Média prioridade**:
   - Componentes de UI (`Toast`, `ConfirmDialog`)
   - Lógica de autenticação em `/lib/auth.ts`

3. **Baixa prioridade**:
   - Páginas completas (testar via E2E)
   - Componentes de layout

### 4. Testes de API

Para testar endpoints em `/pages/api/`:

```typescript
// Exemplo de teste de API com handler
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/actives/list';

// Mock doPrisma
jest.mock('@/lib/prisma', () => ({
  active: {
    findMany: jest.fn().mockResolvedValue([]),
  },
}));

describe('API: /api/actives/list', () => {
  it('retorna 401 sem token', async () => {
    const req = { method: 'GET', cookies: {} } as NextApiRequest;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as NextApiResponse;

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

### 5. Testes de Componentes

```typescript
// Exemplo de teste de componente
import { render, screen, fireEvent } from '@testing-library/react';
import Toast from '@/components/ui/Toast';

describe('Toast', () => {
  it('renderiza mensagem corretamente', () => {
    render(
      <Toast 
        id="1" 
        message="Mensagem de teste" 
        type="success" 
        onClose={() => {}} 
      />
    );
    
    expect(screen.getByText('Mensagem de teste')).toBeInTheDocument();
  });
});
```

### 6. Testes E2E (Opcional)

Para testes end-to-end, considerar:

- **Playwright**: Moderno, bom suporte a Next.js
- **Cypress**: Mais maduro, curva de aprendizado menor

## Cobertura Atual

| Tipo | Cobertura |
|------|-----------|
| Unit tests | 0% |
| Integration tests | 0% |
| E2E tests | 0% |
| ESLint | 100% |
| TypeScript | 100% |

## Action Items

1. [ ] Selecionar framework de testes (Vitest vs Jest)
2. [ ] Configurar ambiente de testes
3. [ ] Adicionar scripts de teste no package.json
4. [ ] Criar testes para hooks em `/lib/hooks/`
5. [ ] Criar testes para Context providers
6. [ ] Criar testes para componentes de UI
7. [ ] Configurar CI/CD para rodar testes

## Scripts Sugeridos

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

## Referências

- [Vitest](https://vitest.dev/)
- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)