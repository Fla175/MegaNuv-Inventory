# Análise 003 — 2026-05-05

## Metadata

| Campo | Valor |
|-------|-------|
| Data | 2026-05-05 |
| Análise | 003 |
| Projeto | MegaNuv Inventory |
| Método | Systematic Debugging (superpowers) |

## Resumo

| Métrica | Quantidade |
|---------|------------|
| Total de Issues | 6 |
| Críticos | 2 |
| Altos | 1 |
| Médios | 2 |
| Baixos | 1 |

## Bugs Encontrados e Corrigidos

| # | Nome | Descrição | Criticidade | Dificuldade | Causa |
|---|------|-----------|-------------|-------------|-------|
| 1 | Múltiplas instâncias PrismaClient | 8 arquivos criando `new PrismaClient()` separadas em vez de usar singleton | CRÍTICO | FÁCIL | Conexões duplicadas, risco de esgotamento de pool |
| 2 | Inconsistência JWT (jsonwebtoken vs jose) | APIs usam `jsonwebtoken`, middleware usa `jose` | CRÍTICO | MÉDIO | Falha na padronização de libs JWT |
| 3 | Middleware bloqueando rota pública | `/api/hello` não estava em PUBLIC_PATHS | ALTO | FÁCIL | Esquecimento na configuração do middleware |
| 4 | .next corrompido | Diretório `.next` incompleto (faltando `_document.js`) | MÉDIO | FÁCIL | Build anterior interrompido ou corrompido |
| 5 | Processos zumbis Next.js | Processos antigos `next-server` defunct persistindo | MÉDIO | FÁCIL | Servidor não encerrado corretamente |
| 6 | Build/lint warnings | 78 usos de `any`, logs de debug em produção | BAIXO | FÁCIL | Falta de rigor na tipagem |

---

## Detalhamento

### 1. Múltiplas instâncias PrismaClient (CRÍTICO)

**Descrição:**
Oito arquivos em `pages/api/` criavam suas próprias instâncias do `PrismaClient` com `new PrismaClient()`, em vez de usar a instância singleton exportada por `lib/prisma.ts`. Isso pode causar esgotamento da pool de conexões do banco de dados.

**Arquivos afetados:**
- `pages/api/categories/list.ts`
- `pages/api/categories/create.ts`
- `pages/api/categories/delete.ts`
- `pages/api/categories/update.ts`
- `pages/api/father-spaces/list.ts`
- `pages/api/father-spaces/create.ts`
- `pages/api/father-spaces/delete.ts`
- `pages/api/father-spaces/update.ts`
- `pages/api/logs/list.ts`
- `pages/api/logs/clear.ts`
- `lib/logger.ts`

**Causa:** Copia de templates sem ajuste para o padrão do projeto.

**Correção:** 
- Removido `new PrismaClient()` de todos os arquivos
- Importado `prisma` ou `db` de `@/lib/prisma`
- Removido `prisma.$disconnect()` (não necessário com singleton)
- `lib/logger.ts` corrigido para usar `"./prisma"` (caminho relativo correto)

---

### 2. Inconsistência JWT: jsonwebtoken vs jose (CRÍTICO)

**Descrição:**
O projeto tinha uma inconsistência crítica de bibliotecas JWT:
- `middleware.ts` usava `jose` para verificar tokens
- `pages/api/auth/login.ts` usava `jsonwebtoken` para criar tokens
- Todas as outras APIs usavam `jsonwebtoken` para verificar tokens

Embora tecnicamente compatíveis (quando o JWT_SECRET é tratado corretamente), a inconsistência viola o princípio de padronização e pode causar problemas em Edge Runtime.

**Arquivos afetados:** 20+ arquivos usando `jsonwebtoken`

**Causa:** Evolução do projeto sem padronização de libs.

**Correção:**
Padronizado tudo para `jose` (biblioteca mais moderna, compatível com Edge Runtime):
- `lib/auth.ts` — reescrito para usar `jose.jwtVerify()` e `jose.SignJWT()`
- `pages/api/auth/login.ts` — usa `jose.SignJWT()` para gerar tokens
- `pages/api/auth/signup.ts` — usa `jose.jwtVerify()`
- `pages/api/auth/me.ts` — usa `jose.jwtVerify()`
- Todas as APIs em `pages/api/` — convertidas para `jose.jwtVerify()`
- `middleware.ts` — já usava `jose` (mantido)

---

### 3. Middleware bloqueando rota pública (ALTO)

**Descrição:**
O endpoint `/api/hello` (usado para testes) estava retornando 401 porque não estava incluído em `PUBLIC_PATHS` no middleware.

**Arquivo:** `middleware.ts`

**Linha:** 5-16

**Correção:** Adicionado `/api/hello` ao array `PUBLIC_PATHS`.

---

### 4. Diretório .next corrompido (MÉDIO)

**Descrição:**
O diretório `.next` estava incompleto, contendo apenas um arquivo `trace`, faltando arquivos críticos como `_document.js`. Isso causava erro 500 em todas as páginas.

**Causa:** Build anterior interrompido ou corrupção de cache.

**Correção:** Removido diretório `.next` e feito rebuild completo com `rm -rf .next && yarn dev`.

---

### 5. Processos zumbis Next.js (MÉDIO)

**Descrição:**
Processos antigos do Next.js (`next-server`) estavam persistindo como zumbis (`defunct`), possivelmente interferindo em novas inicializações.

**Correção:** Eliminados com `pkill -f "next dev"` e `pkill -f "next-server"`.

---

### 6. TypeScript any e logs de debug (BAIXO)

**Descrição:**
- 78 usos de `any` em todo o projeto
- Logs de `console.log/error` em código de produção
- `eslint-disable` para suprimir warnings

**Status:** Identificado mas NÃO corrigido nesta sessão (escopo focado em bugs críticos).

---

## Testes Realizados

### Teste de Compilação
```bash
cd /var/code/inventory && npx tsc --noEmit
# Resultado: SUCESSO (sem erros após correções)
```

### Teste de Build
```bash
yarn build
# Resultado: SUCESSO - Build completo em 20.32s
```

### Teste de Lint
```bash
yarn lint
# Resultado: SUCESSO - Nenhum warning ou erro
```

### Teste de APIs (com token válido)
- `/api/hello` → HTTP 200 ✅
- `/api/actives/list` → HTTP 200 ✅
- `/api/categories/list` → HTTP 200 ✅
- `/api/father-spaces/list` → HTTP 200 ✅
- `/api/dashboard/stats` → HTTP 200 ✅
- `/api/users` → HTTP 200 ✅

### Teste de Autenticação
- Login com credenciais corretas → Token JWT gerado ✅
- Verificação de token com `jose` → Sucesso ✅
- Middleware autorização → Funcionando ✅

---

## Ações Recomendadas (Pendentes)

1. **Críticos** — N/A (todos corrigidos nesta sessão)
2. **Médios** — Remover usos de `any` e adicionar tipagem rigorosa
3. **Baixos** — Remover todos os `console.log/error` de debug em produção
4. **Melhoria** — Adicionar array de dependências em `useEffect`s sem deps

---

## Arquivos Modificados

### Correção de PrismaClient (11 arquivos)
1. `/var/code/inventory/lib/logger.ts`
2. `/var/code/inventory/pages/api/categories/list.ts`
3. `/var/code/inventory/pages/api/categories/create.ts`
4. `/var/code/inventory/pages/api/categories/delete.ts`
5. `/var/code/inventory/pages/api/categories/update.ts`
6. `/var/code/inventory/pages/api/father-spaces/list.ts`
7. `/var/code/inventory/pages/api/father-spaces/create.ts`
8. `/var/code/inventory/pages/api/father-spaces/delete.ts`
9. `/var/code/inventory/pages/api/father-spaces/update.ts`
10. `/var/code/inventory/pages/api/logs/list.ts`
11. `/var/code/inventory/pages/api/logs/clear.ts`

### Padronização JWT jose (20+ arquivos)
1. `/var/code/inventory/lib/auth.ts` (reescrita completa)
2. `/var/code/inventory/pages/api/auth/login.ts`
3. `/var/code/inventory/pages/api/auth/signup.ts`
4. `/var/code/inventory/pages/api/auth/me.ts`
5. `/var/code/inventory/pages/api/actives/list.ts`
6. `/var/code/inventory/pages/api/actives/create.ts`
7. `/var/code/inventory/pages/api/actives/delete.ts`
8. `/var/code/inventory/pages/api/actives/update.ts`
9. `/var/code/inventory/pages/api/actives/move.ts`
10. `/var/code/inventory/pages/api/categories/list.ts`
11. `/var/code/inventory/pages/api/categories/create.ts`
12. `/var/code/inventory/pages/api/categories/delete.ts`
13. `/var/code/inventory/pages/api/categories/update.ts`
14. `/var/code/inventory/pages/api/father-spaces/list.ts`
15. `/var/code/inventory/pages/api/father-spaces/create.ts`
16. `/var/code/inventory/pages/api/father-spaces/delete.ts`
17. `/var/code/inventory/pages/api/father-spaces/update.ts`
18. `/var/code/inventory/pages/api/dashboard/stats.ts`
19. `/var/code/inventory/pages/api/logs/list.ts`
20. `/var/code/inventory/pages/api/logs/clear.ts`

### Middleware
1. `/var/code/inventory/middleware.ts` (adição de `/api/hello` em PUBLIC_PATHS)

---

*Relatório gerado por systematic-debugging (superpowers skill)*
