# UI-SPEC.md — Fase 3: Polish & UX

## Metadata

| Campo | Valor |
|-------|-------|
| Fase | 3 |
| Nome | Polish & UX |
| Tipo | UI/UX |
| Versão | 1.0 |

---

## Visão Geral

Melhorar a experiência do usuário com empty states, indicadores visuais e feedback de ações.

---

## 1. Layout

### Estrutura de Página

| Componente | Posição | Descrição |
|-----------|--------|----------|
| EmptyState | Centro da lista | Mostrado quando lista vazia |
| DepthIndicator | Esquerdo do item | Indicador visual de profundidade |
| ActionFeedback | Toast/ToastContainer | Feedback de ações do usuário |

### Responsividade

- **Desktop (≥1024px)**: Layout completo com sidebar
- **Tablet (768-1023px)**: Sidebar colapsável
- **Mobile (<768px)**: Stack vertical, hamburger menu

---

## 2. Cores

### Sistema de Cores

| Nome | Valor | Uso |
|------|-------|-----|
| `bg-empty` | `#1e293b` (slate-800) | Fundo do empty state |
| `text-empty` | `#94a3b8` (slate-400) | Texto do empty state |
| `border-depth` | `#3b82f6` (blue-500) | Indicador de profundidade |
| `success` | `#22c55e` (green-500) | Feedback de sucesso |
| `warning` | `#f59e0b` (amber-500) | Feedback de warning |
| `error` | `#ef4444` (red-500) | Feedback de erro |

---

## 3. Tipografia

| Uso | Tamanho | Peso | Line-height |
|-----|---------|------|-------------|
| Empty Title | 24px | 600 | 1.2 |
| Empty Subtitle | 16px | 400 | 1.5 |
| Depth Label | 12px | 500 | 1.0 |
| Toast Message | 14px | 500 | 1.4 |

---

## 4. Espaçamento

| Uso | Valor |
|-----|-------|
| Padding do EmptyState | `p-8` (32px) |
| Gap interno | `gap-4` (16px) |
| Margem do DepthIndicator | `ml-2` → `ml-${depth * 2}` |
|Border radius do DepthIndicator| `rounded-full` |

---

## 5. Componentes

### 5.1 EmptyState

```
┌─────────────────────────────────┐
│         [ícone 64px]             │
│                                 │
│    Nenhum ativo encontrado      │
│                                 │
│  Clique em "Novo Ativo" para    │
│  adicionar o primeiro ativo    │
│                                 │
│      [Botão: Novo Ativo]        │
└─────────────────────────────────┘
```

#### Props

| Prop | Tipo | Obrigatório | Padrão |
|------|------|------------|--------|
| title | string | Sim | — |
| subtitle | string | Não | — |
| icon | LucideIcon | Não | `Package` |
| actionLabel | string | Não | — |
| onAction | () => void | Se actionLabel | — |

### 5.2 DepthIndicator

```
┌────────┐
│  ●  │
└────────┘
  ou
┌────────────┐
│  ├──  │
└────────────┘
```

| Profundidade | Indicador |
|--------------|-----------|
| 0 | Nenhum |
| 1 | `ml-2` + `w-2 h-2` |
| 2 | `ml-4` + `w-2 h-2` |
| 3 | `ml-6` + `w-2 h-2` |
| N | `ml-${N*2}` + animação pulse |

### 5.3 ActionFeedback (Toast)

| Tipo | Cor | Ícone |
|------|-----|-------|
| sucesso | green-500 | `CheckCircle` |
| erro | red-500 | `XCircle` |
| warning | amber-500 | `AlertTriangle` |

---

## 6. Interações

| Componente | Evento | Comportamento |
|------------|-------|----------------|
| EmptyState | Click no botão | Abre o formulário de criação |
| DepthIndicator | Hover | Show tooltip com caminho completo |
| Toast | auto-dismiss | 3 segundos |

---

## 7. Animações

| Componente | Animação | Duração |
|------------|----------|---------|
| EmptyState | fade-in + scale | 300ms ease-out |
| DepthIndicator | pulse | 2s infinite (se ativo) |
| Toast | slide-in-right | 200ms ease-out |

---

## 8. Implementação

### Diretório de Componentes

```
/components/ui/
├── EmptyState.tsx       # novo
├── DepthIndicator.tsx   # novo
└── ActionFeedback.tsx   # usar existente Toast
```

### Integração

| Componente | Página | Inserir Após |
|------------|--------|--------------|
| EmptyState | `/pages/index.tsx` | SearchSection, se lista vazia |
| EmptyState | `/pages/dashboard.tsx` | StatsCards, se sem dados |
| DepthIndicator | `/components/ListSection.tsx` | Cada item da lista |
| ActionFeedback | `/components/actives/activeForm.tsx` | Após submit |

---

## 9. Critérios de Verificação

- [ ] EmptyState aparece quando lista de ativos está vazia
- [ ] DepthIndicator mostra nível de profundidade correto
- [ ] Toast aparece após criar/editar/deletar ativo
- [ ] Animações suaves (sem jank)
- [ ] Responsivo em todas as breakpoints

---

*Última atualização: 2026-04-24*