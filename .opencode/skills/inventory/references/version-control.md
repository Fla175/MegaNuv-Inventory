# Versionamento e Commits

Controlar versão e fazer commits automáticos no MegaNuv Inventory.

---

## Versionamento Semântico

### Níveis

| Nível | Quando usar |
|-------|-------------|
| **major** | Quebra de compatibilidade, mudança de API, remoção de funcionalidades |
| **minor** | Nova funcionalidade retrocompatível, melhoria significativa |
| **patch** | Correção de bug, refatoração, melhorias menores |

### Como Atualizar

```bash
# Atualizar patch (x.y.Z)
npm version patch

# Atualizar minor (x.Y.0)
npm version minor

# Atualizar major (X.0.0)
npm version major
```

O comando faz automaticamente:
1. Atualiza versão no `package.json`
2. Cria tag git (ex: `v1.2.0`)
3. Faz commit da versão

---

## Commits Automáticos

### Quando Fazer

Após completar qualquer task/correção, fazer commit automático.

### Formato

```
<tipo>(<escopo>): <descrição>

- Task: <descrição da task>
- Dificuldade: <baixa|média|alta>
- Nível: <major|minor|patch>
- Como: <resumo breve da implementação>
```

### Tipos

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração |
| `chore` | Tarefas de manutenção |
| `docs` | Documentação |
| `style` | Estilos |
| `test` | Testes |

### Escopo

- `api` — rotas/endpoints
- `ui` — componentes visuais
- `db` — banco de dados/Prisma
- `auth` — autenticação
- `config` — configurações
- `types` — TypeScript

---

## Exemplos

### Nova Feature

```bash
git commit -m "feat(api): adicionar endpoint de produtos

- Task: Criar rota GET /api/produtos com paginação
- Dificuldade: média
- Nível: minor
- Como: Usar prisma.produto.findMany com take/skip"
```

### Bug Fix

```bash
git commit -m "fix(auth): corrigir token expirando antes do esperado

- Task: Token JWT expirando em 1h ao invés de 24h
- Dificuldade: baixa
- Nível: patch
- Como: Ajustar expiresIn de 1h para 24h em lib/auth.ts"
```

### Refatoração

```bash
git commit -m "refactor(db): mover queries para service

- Task: Extrair queries do controller para service
- Dificuldade: média
- Nível: patch
- Como: Criar produto.service.ts com métodos"
```

---

## Fluxo Completo

1. Analisar requisição do usuário
2. Determinar nível (major/minor/patch)
3. Implementar solução
4. Executar `yarn lint` se disponível
5. Commitar com formato correto
6. Atualizar versão se aplicável
7. Registrar em code-changes

---

## Tabela Resumo

Após completar tasks, sempre mostrar:

```
| Task | Dificuldade | Nível | Descrição | Como |
|------|------------|-------|-----------|------|
| <task> | <baixa/média/alta> | <major/minor/patch> | <descrição> | <resumo> |
```