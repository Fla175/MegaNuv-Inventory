# CONCERNS.md — Concerns e Issues do Projeto

## Metadata

| Campo | Valor |
|-------|-------|
| Projeto | MegaNuv Inventory |
| Versão | 2.10.0 |
| Stack | Next.js 15 + TypeScript + Prisma 6 + MariaDB + Tailwind CSS v4 |

---

## Resumo Executivo

Este documento consolida todas as concerns, issues técnicos, divididas em categorias de criticidade.

| Categoria | Quantidade |
|-----------|------------|
| **Críticos** | 0 |
| **Altos** | 3 |
| **Médios** | 12 |
| **Baixos** | 8 |

---

## Seção 1: Issues de Tipagem TypeScript

### 1.1 TypeScript `any` Implícito (ALTO)

**Descrição:** Uso extensivo de tipos `any` implícitos em catches, parâmetros e retornos. Viola strict mode.

**Arquivos Afetados:**
- `pages/api/*` — 11+ arquivos com `catch (error)` sem tipagem
- `lib/prisma.ts` — Parámetro `model: any`
- `pages/api/dashboard/stats.ts` — `acc: any` em reduce

**Recomendação:** Aplicar `catch (error: unknown)` + type narrowing com `instanceof Error`

---

### 1.2 eslint-disable em Excesso (MÉDIO)

**Descrição:** Oito usos de `eslint-disable` para suprimir erros de `any` em APIs.

**Arquivos:**
- `pages/api/categories/create.ts` (linha 62)
- `pages/api/categories/update.ts` (linha 55)
- `pages/api/actives/move.ts` (linha 13)
- `pages/api/dashboard/stats.ts` (linha 43)
- `lib/prisma.ts` (linha 8)
- `pages/api/users/[id].ts` (linha 60)
- `pages/api/users/update-sort.ts` (linha 30)
- `middleware.ts` (linha 80)

**Recomendação:** Remover supressões e tipar corretamente os tipos.

---

### 1.3 Props Any em Componentes (MÉDIO)

**Descrição:** Componentes principais têm props tipadas como `any`.

**Arquivos:**
- `components/ListSection.tsx` — Props genéricas
- `components/actives/activeForm.tsx` — Props sem interface definida
- `components/Layout.tsx` — Props implícitas

**Recomendação:** Criar interfaces de props (`ListSectionProps`, `ActiveFormProps`).

---

## Seção 2: Padrões de Código

### 2.1 useEffect sem Array de Dependências (MÉDIO)

**Descrição:** 12+ useEffects sem dependências podem causar stale state ou loops infinitos.

**Arquivos:**
| Arquivo | Linha |
|--------|-------|
| `pages/index.tsx` | 38, 91 |
| `pages/settings.tsx` | 45 |
| `components/actives/activeForm.tsx` | 45, 72 |
| `components/ListSection.tsx` | 49, 67 |
| `pages/dashboard.tsx` | 49 |
| `components/Layout.tsx` | 64, 67 |
| `pages/qrcode/view.tsx` | 70 |
| `lib/context/UserContext.tsx` | 29 |
| `pages/login.tsx` | 16, 65 |

**Recomendação:** Adicionar array de dependências vazio `[]` ou listar todas dependências corretamente.

---

### 2.2 Estados Não Resetados Entre Navegações (MÉDIO)

**Descrição:** States de componentes podem não ser limpos entre navegações, causando dados stale.

**Arquivos:**
- `components/actives/activeForm.tsx` — Estados de formulário
- `pages/index.tsx` — Múltiplos states

**Recomendação:** Implementar cleanup em `useEffect` com return cleanup function.

---

### 2.3 Funções Inline em JSX (BAIXO)

**Descrição:** Funções anônimas criadas diretamente no JSX criam novas referências a cada render.

**Recomendação:** Usar `useCallback` para funções em listas.

---

### 2.4 Código Duplicado (BAIXO)

**Descrição:** Lógica de cores duplicada em múltiplos arquivos.

**Arquivos:** Múltiplos componentes

**Recomendação:** Centralizar em `/lib/constants/colors.ts`.

---

## Seção 3: Performance

### 3.1 Queries Sem Projeção Select (MÉDIO)

**Descrição:** APIs retornam objetos completos ao invés de apenas campos necessários.

**Arquivos:**
- `pages/api/logs/list.ts` — `findMany()` sem select
- `pages/api/categories/list.ts` — `findMany()` sem select
- `pages/api/dashboard/stats.ts` — Múltiplas queries sem projeção

**Recomendação:** Usar `select: { id: true, name: true, ... }` para campos específicos.

---

### 3.2 Potencial N+1 Queries (MÉDIO)

**Descrição:** O uso de `include` pode causar queries N+1 se não usado corretamente.

**Arquivos:**
- `pages/api/qrcode/public-get.ts` — `include: { createdBy: { select: ... } }`

**Recomendação:** Revisar queries com `Promise.all()` para múltiplas relações.

---

### 3.3 Falta de Memoização (MÉDIO)

**Descrição:** Componentes podem rerenderizar desnecessariamente.

**Arquivos:**
- `components/ListSection.tsx` — useMemo presente mas não aplicado corretamente
- `components/actives/activeForm.tsx` — Cálculos pesados não memoizados

**Recomendação:** Aplicar `React.memo` em componentes e `useMemo` em cálculos pesados.

---

### 3.4 Sem Transações Prisma (MÉDIO)

**Descrição:** Operações complexas não usam `$transaction` do Prisma para garantir atomicidade.

**Exemplo:** `pages/api/actives/delete.ts` — DeleteMany separado de logs.

**Recomendação:** Usar `prisma.$transaction` para operações relacionadas.

---

## Seção 4: Segurança

### 4.1 Falta de Validação de Input (ALTO)

**Descrição:** Não há validação de schema (ex: Zod) para req.body.

**Arquivos:** Todas as APIs

**Recomendação:** Implementar validação com Zod ou similar.

---

### 4.2-console.log em Produção (BAIXO)

**Descrição:** Logs de debug deixados em código de produção.

**Arquivos:**
- `pages/qrcode/view.tsx` — console.log (linha 74)
- `pages/api/protected.ts` — console.log (linha 11)
- `components/ListSection.tsx` — console.error
- `components/Layout.tsx` — console.error

**Recomendação:** Remover console.log ou usar logger estruturado.

---

### 4.3 Logs de Debug em lib/auth.ts (BAIXO)

**Descrição:** Múltiplos console.log deixados em função de autenticação.

**Arquivo:** `lib/auth.ts` (linhas 21, 22, 26, 38-39, 42-43, 46-47, 50-51, 63-67)

**Recomendação:** Remover logs de debug antes de Produção.

---

### 4.4 Hardcoded Secrets (ALTO)

**Descrição:** Secrets hardcoded no código-fonte.

**Arquivos:**
- `pages/api/storage/upload-url.ts` — `secretKey: '123asd!@#'` (linha 14)
- `lib/minio.ts` — Default fallback keys

**Recomendação:** Remover defaults e forçar configuração via .env.

---

## Seção 5: Design/UX

### 5.1 Hierarquia Visual sem Diferenciação (MÉDIO)

**Descrição:** Lista hierárquica usa `ml-6` fixo para todos os níveis.

**Arquivo:** `components/ListSection.tsx` (linhas 216, 226)

**Recomendação:** Usar cálculo dinâmico `ml-${level * 6}` para progressão visual.

---

### 5.2 Console.error em Componentes (BAIXO)

**Descrição:** 4+ console.error em componentes React.

**Arquivos:**
- `components/ListSection.tsx` (linha 59)
- `components/actives/activeForm.tsx` (linha 183)
- `components/Layout.tsx` (linha 62)
- `components/imageUpload.tsx` (linha 127)

**Recomendação:** Usar sistema de Toast para erros.

---

## Seção 6: Technical Debt

### 6.1 Variáveis Não Utilizadas (BAIXO)

**Descrição:** Possíveis variáveis declaradas mas não utilizadas.

---

### 6.2 Código Morto em middleware.ts (BAIXO)

**Descrição:** Blocos comentado (linhas 40-56) para checagem de setup.

**Arquivo:** `middleware.ts`

---

### 6.3 Falta de Índices (MÉDIO)

**Descrição:** Modelo Log precisa de índice adicional.

**Recomendação:** Adicionar `@@index([createdAt])` em Log para queries por período.

---

### 6.4 Falta de Tratamento de Erros Global (MÉDIO)

**Descrição:** Sem wrapper global para tratamento de erros em APIs.

**Recomendação:** Criar middleware de erro ou wrapper helper.

---

## Seção 7: Histórico de Análises

### 7.1 Analysis 001 — 2026-04-10

13 issues identificados: TypeScript any, console.log, eslint-disable, useEffects sem deps, queries sem projeção.

### 7.2 Analysis 002 — 2026-04-10

8 issues identificados: Hierarquia visual, console.error, eslint-disable, memoização ausente, props any, useEffect sem deps, código duplicado, funções inline.

---

## Ações Recomendadas Priorizadas

### Críticos (0)
N/A

### Altos (3)
1. Implementar validação de input com Zod
2. Remover hardcoded secrets
3. Aplicar tipagem rigorosa (strict mode)

### Médios (12)
1. Corrigir useEffects com arrays de dependências
2. Remover eslint-disable e tipar corretamente
3. Implementar $transaction para operações
4. Aplicar memoização em componentes
5. Queries com select específico
6. Implementar índices adicionais no schema
7. Resetar estados entre navegações
8. Criar interfaces de props
9. Tratar N+1 queries com Promise.all
10. Implementar wrapper de erro global
11. Implementar espaçamento progressivo por nível
12. Centralizar lógica de cores

### Baixos (8)
1. Remover console.log de debug
2. Remover logs de lib/auth.ts
3. Usar useCallback para funções em listas
4. Centralizar lógica de cores
5. Limpar código morto
6. Remover variáveis não utilizadas
7. Usar Toast para erros de componentes
8. Adicionar índice createdAt em Log

---

## Referências

- [analysis/analysis-001/ANALYSIS.md](../analysis/analysis-001/ANALYSIS.md)
- [analysis/analysis-002/ANALYSIS.md](../analysis/analysis-002/ANALYSIS.md)
- [prisma/schema.prisma](../prisma/schema.prisma)
- [package.json](../package.json)