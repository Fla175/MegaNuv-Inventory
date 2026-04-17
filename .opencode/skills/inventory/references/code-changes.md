# Code Changes (Tasks)

Registrar todas as tasks realizadas em `code-changes/`.

---

## Estrutura

```
code-changes/
├── CHANGE-001.md    # Primeira task
├── CHANGE-002.md    # Segunda task
└── ...
```

---

## Formato do Arquivo

Cada `CHANGE-N.md` deve seguir este template:

```markdown
# Change N — YYYY-MM-DD

## Metadata

| Campo | Valor |
|-------|-------|
| Data | YYYY-MM-DD |
| Change | N |
| Tipo | FEAT/FIX/REFACTOR/etc |

## Task

**Nome:** <nome da task>

**Descrição:** <descrição do que foi feito>

**Causa:** <por que foi necessário>

## Classificação

| Campo | Valor |
|-------|-------|
| Dificuldade | FÁCIL/MÉDIO/DIFÍCIL |
| Nível | major/minor/patch |
| Tipo | FEAT/FIX/REFACTOR/CHORE/DOCS |

## Processo

<explicação passo a passo de como foi implementado>

## Resultado

<o que foi alcançado>
```

---

## Como Registrar

### Passo 1: Contar changes anteriores

```bash
ls /var/code/inventory/code-changes/
```

Se existem CHANGE-001.md até CHANGE-005.md, o próximo é CHANGE-006.md.

### Passo 2: Criar arquivo

Criar `code-changes/CHANGE-N.md` com o template acima.

### Passo 3: Preencher

- Nome: título da task
- Descrição: o que foi feito
- Causa: por que foi necessário
- Dificuldade: FÁCIL/MÉDIO/DIFÍCIL
- Nível: major/minor/patch
- Tipo: FEAT/FIX/REFACTOR/CHORE/DOCS
- Processo: como foi feito (passos)
- Resultado: o que foi alcançado

---

## Classificação

### Tipo (Conventional Commits)

| Tipo | Descrição |
|------|-----------|
| FEAT | Nova funcionalidade |
| FIX | Correção de bug |
| REFACTOR | Refatoração |
| CHORE | Tarefa de manutenção |
| DOCS | Documentação |
| STYLE | Estilos |
| TEST | Testes |

### Dificuldade

| Level | Definição |
|-------|-----------|
| FÁCIL | Minutos, correção direta |
| MÉDIO | Horas, refatoração necessária |
| DIFÍCIL | Dias, mudança arquitetural |

### Nível (SemVer)

| Level | Definição |
|-------|-----------|
| major | Quebra compatibilidade |
| minor | Nova funcionalidade |
| patch | Correção/Melhoria |

---

## Exemplo Completo

```markdown
# Change 001 — 2024-01-15

## Metadata

| Campo | Valor |
|-------|-------|
| Data | 2024-01-15 |
| Change | 001 |
| Tipo | FEAT |

## Task

**Nome:** Criar endpoint de produtos

**Descrição:** Implementar rota GET /api/produtos com listagem paginada

**Causa:** Necessidade de listar produtos no frontend

## Classificação

| Campo | Valor |
|-------|-------|
| Dificuldade | MÉDIO |
| Nível | minor |
| Tipo | FEAT |

## Processo

1. Identificar modelo Produto em prisma/schema.prisma
2. Criar rota em pages/api/produtos/index.ts
3. Usar prisma.produto.findMany com paginação
4. Adicionar tratamento de erros
5. Testar endpoint com curl

## Resultado

Endpoint funcional retornando lista paginada de produtos
```

---

## Regras

1. **Sempre registrar** toda task completada
2. **Formato completo** — nenhum campo pode estar vazio
3. **Sequencial** — continuar numeração anterior
4. **pt-BR** — tudo em português brasileiro