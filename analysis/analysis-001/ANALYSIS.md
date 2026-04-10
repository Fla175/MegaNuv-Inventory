# Análise 001 — 2026-04-10

## Metadata

| Campo | Valor |
|-------|-------|
| Data | 2026-04-10 |
| Análise | 001 |
| Projeto | MegaNuv Inventory |

## Resumo

| Métrica | Quantidade |
|---------|------------|
| Total de Issues | 13 |
| Críticos | 0 |
| Altos | 1 |
| Médios | 8 |
| Baixos | 4 |

## Bugs Encontrados

| # | Nome | Descrição | Criticidade | Dificuldade | Causa |
|---|------|-----------|-------------|-------------|-------|
| 1 | TypeScript any implícito | 11 usos de `error: any` em catches de APIs | MÉDIO | FÁCIL | Tipagem ausente no tratamento de erros |
| 2 | console.log em produção | 1 console.log em pages/qrcode/view.tsx para debug | BAIXO | FÁCIL | Console de debug esquecido |
| 3 | console.log em produção | 1 console.log em pages/api/protected.ts | BAIXO | FÁCIL | Log de debug em API |
| 4 | eslint-disable explícito | 8 usos de eslint-disable para any | MÉDIO | FÁCIL | Supressão de warnings necessários |
| 5 | useEffect sem dep array | 12 useEffects sem array de dependências | MÉDIO | MÉDIO | Potencial stale state |
| 6 | Query sem projeção (select) | APIs buscam dados sem necessidade | MÉDIO | FÁCIL | Retorno de dados desnecessários |
| 7 | Tipo any em reduce | reduce com acc: any em dashboard/stats.ts | MÉDIO | FÁCIL | Tipagem ausente |
| 8 | Variável any implícita | generateUniqueHexId com param model: any | MÉDIO | FÁCIL | Tipagem ausente |
| 9 | Seção any implícita | sections: any[] em qrcode/public-get.ts | MÉDIO | FÁCIL | Tipagem ausente |
| 10 | TypeScript strict mode desabilitado | // @ts-nocheck ou any implícito | ALTO | MÉDIO | Falta de tipagem rigorosa |
| 11 | Missing key em map | Potencial missing key em listagens | BAIXO | FÁCIL | Key não especificada |
| 12 | State nunca resetado | Estados podem não ser resetados entre navegação | MÉDIO | MÉDIO | Falta de cleanup |
| 13 | Variáveis não utilizadas | Potenciais variáveis não utilizadas | BAIXO | FÁCIL | Código morto |

---

## Detalhamento

### 1. TypeScript any implícito em tratamento de erros

**Descrição:**
Onze arquivos de API usam `catch (error: any)` sem tipagem adequada do erro.

**Arquivo:** `pages/api/father-spaces/update.ts`, `pages/api/father-spaces/delete.ts`, `pages/api/father-spaces/create.ts`, `pages/api/actives/update.ts`, `pages/api/actives/delete.ts`, `pages/api/actives/create.ts`, `pages/api/users/[id].ts`, `pages/api/users/update-sort.ts`

**Linha:** 47, 42, 59, 47, 40, 74, 61, 31

**Criticidade:** MÉDIO

**Dificuldade:** FÁCIL

**Causa:** Tipagem automática não aplicada no catch block

**Recomendação:** Usar `catch (error: unknown)` e verificar tipo com `instanceof Error`

---

### 2. console.log para debug em produção

**Descrição:**
Console.log deixado em código de produção para debug.

**Arquivo:** `pages/qrcode/view.tsx`

**Linha:** 74

**Criticidade:** BAIXO

**Dificuldade:** FÁCIL

**Causa:** Log de debug esquecido durante desenvolvimento

**Recomendação:** Remover console.log ou usar ambiente de desenvolvimento

---

### 3. console.log em API

**Descrição:**
Console.log em endpoint de API mostrando dados do usuário.

**Arquivo:** `pages/api/protected.ts`

**Linha:** 11

**Criticidade:** BAIXO

**Dificuldade:** FÁCIL

**Causa:** Log de debug esquecido

**Recomendação:** Remover console.log ou usar logger estruturado

---

### 4. eslint-disable para TypeScript any

**Descrição:**
Oito usos de eslint-disable para suprimir erros de `any` explícito.

**Arquivo:** `pages/api/categories/create.ts`, `pages/api/categories/update.ts`, `pages/api/actives/move.ts`, `pages/api/dashboard/stats.ts`, `lib/prisma.ts`, `pages/api/users/[id].ts`, `pages/api/users/update-sort.ts`, `middleware.ts`

**Linha:** 62, 55, 13, 43, 8, 60, 30, 80

**Criticidade:** MÉDIO

**Dificuldade:** FÁCIL

**Causa:** Supressão de warnings ao invés de tipagem adequada

**Recomendação:** Remover eslint-disable e tipar corretamente os erros

---

### 5. useEffect sem array de dependências

**Descrição:**
Doze useEffects sem array de dependências podem causar stale state ou loops infinitos.

**Arquivo:** `pages/index.tsx`, `pages/settings.tsx`, `components/actives/activeForm.tsx`, `components/ListSection.tsx`, `pages/dashboard.tsx`, `components/Layout.tsx`, `pages/qrcode/view.tsx`, `lib/context/UserContext.tsx`, `pages/login.tsx`

**Linha:** 38, 91, 45, 72, 49, 67, 64, 29, 65, 70, 16

**Criticidade:** MÉDIO

**Dificuldade:** MÉDIO

**Causa:** Dependências não especificadas corretamente

**Recomendação:** Adicionar array de dependências vazio `[]` ou listar todas as dependências

---

### 6. Query sem projeção selective

**Descrição:**
APIs retornam objetos completos ao invés de apenas campos necessários (potential N+1 e dados desnecessários).

**Arquivo:** `pages/api/logs/list.ts`, `pages/api/categories/list.ts`

**Linha:** 36-48, 22-31

**Criticidade:** MÉDIO

**Dificuldade:** FÁCIL

**Causa:** Select não especifica campos necessários

**Recomendação:** Usar `select: { id: true, name: true }` para campos específicos

---

### 7. Tipo any em reduce

**Descrição:**
Reduce com acumulador tipado como any, perdendo benefícios do TypeScript.

**Arquivo:** `pages/api/dashboard/stats.ts`

**Linha:** 44

**Criticidade:** MÉDIO

**Dificuldade:** FÁCIL

**Causa:** Acumulador sem tipagem adecuada

**Recomendação:** Tipar o acumulador como `Record<string, number>`

---

### 8. Função com parâmetro any

**Descrição:**
Função generateUniqueHexId com parâmetro `model: any` para uso genérico.

**Arquivo:** `lib/prisma.ts`

**Linha:** 9

**Criticidade:** MÉDIO

**Dificuldade:** FÁCIL

**Causa:** Função genérica sem tipagem de modelo

**Recomendação:** Tipar com `Prisma.ModelName` ou generics

---

### 9. Array any implícito

**Descrição:**
Array sections tipado como any[].

**Arquivo:** `pages/api/qrcode/public-get.ts`

**Linha:** 20

**Criticidade:** MÉDIO

**Dificuldade:** FÁCIL

**Causa:** Tipagem não especificada

**Recomendação:** Tipar corretamente o array

---

### 10. TypeScript strict mode não aplicado

**Descrição:**
Uso extensivo de any implícito viola strict mode e compromete type safety.

**Arquivo:** Múltiplos arquivos

**Linha:** N/A

**Criticidade:** ALTO

**Dificuldade:** MÉDIO

**Causa:** Falta de tipagem rigorosa no projeto

**Recomendação:** Aplicar tipagem em todos os parâmetros e retornos

---

### 11. Missing key em map

**Descrição:**
Possível missing key property em mapeamentos de listas.

**Arquivo:** Múltiplos componentes

**Linha:** N/A

**Criticidade:** BAIXO

**Dificuldade:** FÁCIL

**Causa:** key não especificada em map

**Recomendação:** Garantir que toda lista tenha key única

---

### 12. Estados não resetados

**Descrição:**
States de componentes podem não ser limpos entre navegações, causando dados stale.

**Arquivo:** `components/actives/activeForm.tsx`, `pages/index.tsx`

**Linha:** 23-30, múltiplas states

**Criticidade:** MÉDIO

**Dificuldade:** MÉDIO

**Causa:** Cleanup não implementado

**Recomendação:** Implementar cleanup em useEffect ou useMemo

---

### 13. Variáveis não utilizadas

**Descrição:**
Possíveis variáveis declaradas mas não utilizadas.

**Arquivo:** Múltiplos arquivos

**Linha:** N/A

**Criticidade:** BAIXO

**Dificuldade:** FÁCIL

**Causa:** Código morto ou refatoração incompleta

**Recomendação:** Remover variáveis não utilizadas

---

## Ações Recomendadas

1. **Altos** — Aplicar tipagem rigorosa em todo o projeto (strict mode)
2. **Médios** — Corrigir useEffects com arrays de dependências corretos
3. **Médios** — Remover eslint-disable e tipar corretamente
4. **Baixos** — Remover todos os console.log de debug

---

*Relatório gerado por auditor-yard skill*