# Ler Análises do Auditor-yard

Como ler e apresentar análises do auditor-yard no MegaNuv Inventory.

---

## COMPORTAMENTO OBRIGATÓRIO

**Quando o usuário mencionar "análise" ou "auditor-yard" SEM especificar qual:**

**FAZER PERGUNTA CLARIFYING**:

> Deseja ler a análise do auditor-yard?
> 1. **Ler última análise** — mostro a análise mais recente (maior N)
> 2. **Ler análise específica** — qual número? (analysis-N)
> 3. **Não ler análise** — apenas continuar

---

## Como Detectar

Usuário diz:
- "Qual a última análise?"
- "Me mostra as análises"
- "Ler análise"
- "O que tem nas análises?"
- "Auditor-yard"
- Qualquer menção a análise sem especificar número

**AÇÃO**: fazer a pergunta das 3 opções.

---

## Como Ler Análise

### Passo 1: Escanear pasta analysis

```bash
ls -la /var/code/inventory/analysis/
```

Resultado:
```
analysis-001/
analysis-002/
```

### Passo 2: Identificar última análise

Pegar o número mais alto (N mais alto = última).

### Passo 3: Ler conteúdo

```bash
cat /var/code/inventory/analysis/analysis-N/ANALYSIS.md
```

### Passo 4: Apresentar resumo

```markdown
## Análise N — YYYY-MM-DD

### Resumo
| Métrica | Quantidade |
|---------|------------|
| Total | X |
| Críticos | X |
| Altos | X |
| Médios | X |
| Baixos | X |

### Bugs Encontrados
| # | Nome | Descrição | Criticidade | Dificuldade | Causa |
|---|------|-----------|-------------|-------------|-------|
| 1 | ... | ... | ... | ... | ... |
```

---

## Ler Análise Específica

Se usuário escolher opção 2:

1. Pedir número (ex: "qual análise?")
2. Ler `analysis/analysis-N/ANALYSIS.md`
3. Apresentar formato acima

---

## Fluxo Completo

```
1. Usuário menciona análise
2. ⛔ PARAR e perguntar:
   "Deseja ler a análise do auditor-yard?
   1. Ler última análise
   2. Ler análise específica
   3. Não ler"
3. Esperar resposta do usuário
4. Se 1 → Ler última (N mais alto)
5. Se 2 → Pedir número, ler específica
6. Se 3 → Continuar trabalho normalmente
7. Apresentar resumo em tabela
```

---

## Exemplo

**Usuário**: "Me mostra as análises"

**Você**:
> Deseja ler a análise do auditor-yard?
> 1. Ler última análise (analysis-002)
> 2. Ler análise específica
> 3. Não ler

**Usuário**: "1"

**Você**:
> [Lê analysis-002/ANALYSIS.md e apresenta]

---

## Não Ler Análise

Se usuário escolher opção 3, simplesmente continuar o trabalho normalmente sem ler análise.