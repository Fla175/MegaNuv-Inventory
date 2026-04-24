# MegaNuv Inventory — Projeto

## Metadata

| Campo | Valor |
|-------|-------|
| Projeto | MegaNuv Inventory |
| Código | INVENTORY |
| Versão | 2.10.0 |
| Stack | Next.js 15 + TypeScript + Prisma 6 + MariaDB |
| Inicializado | 2026-04-24 |

---

## O Que É

**MegaNuv Inventory** é um sistema de gestão de ativos patrimoniais com as seguintes funcionalidades:

- **Gestão de Ativos** — Cadastro, edição, movimentação e rastreamento de ativos patrimoniais
- **Categorização** — Organización por categorias personalizáveis
- **Locais/Espaços** — Hierarquia de locais para controle físico
- **Dashboard** — Estatísticas e overview do patrimônio
- **QR Codes** — Visualização pública via QR code
- **Autenticação** — Login seguro com JWT e roles (ADMIN/MANAGER/VIEWER)
- **Upload de Imagens** — Armazenamento de fotos de ativos via MinIO
- **Tema Dark/Light** — Suporte a múltiplos temas

---

## Contexto Técnico

### Stack

| Tecnologia | Versão |
|------------|-------|
| Next.js | 15.3.3 |
| React | 19.0.0 |
| TypeScript | 5.9.3 (strict) |
| Prisma | 6.18.0 |
| MariaDB | 10.x |
| Tailwind CSS | v4 |
| JWT | jsonwebtoken 9.0.2 |

### Estrutura

```
/pages          — Rotas do Next.js (Pages Router)
/components   — Componentes React
/lib           — Utilitários, context, middlewares
/prisma        — Schema do banco
/api           — 34 rotas de API REST
```

---

## Requirements

### Validados

- ✓ Autenticação JWT com cookies seguros
- ✓ CRUD completo de ativos (create, read, update, delete)
- ✓ CRUD de categorias
- ✓ CRUD de locais (FatherSpaces)
- ✓ Hierarquia de movimentação de ativos
- ✓ Dashboard com estatísticas
- ✓ Sistema de temas (dark/light/sistem)
- ✓ Upload de imagens (MinIO)
- ✓QR code viewer público
- ✓ Sistema de logs de auditoria
- ✓ Roles e permissões (ADMIN/MANAGER/VIEWER)

### Ativos (não implementados ainda)

- [ ] Correção de tipagem TypeScript (any implícitos)
- [ ] Implementação de testes automatizados
- [ ] Rate limiting em APIs
- [ ] Validação de força de senha
- [ ] Empty states em componentes
- [ ] Memoização de componentes

### Out of Scope

- [ ]API GraphQL — REST é suficiente
- [ ]Websockets — Não requerido
- [ ]Notificações push — Não requerido
- [ ]Multi-idioma — Apenas pt-BR

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pages Router vs App Router | Projeto já existem em Pages Router | Mantido |
| Prisma 6 | Schema já existe | Mantido |
| Tailwind v4 | CSS já configurado | Mantido |
| JWT em cookies | HttpOnly cookies = mais seguro | Mantido |

---

## Architecture Notes

- Monólito server-side renderizado
- API REST em `/pages/api/`
- Autenticação via middleware
- Estado global via React Context (UserContext, ToastContext)
- IDs de ativo gerados automaticamente (hex 4 chars)

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-04-24 after initialization*