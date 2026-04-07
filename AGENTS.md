# MegaNuv Inventory — Instruções para Agentes

## Comandos de Desenvolvimento

```bash
yarn dev          # Inicia dev server (limpa .next antes)
yarn build        # Build de produção
yarn lint         # Lint ESLint
yarn seed         # Executa build (verificar se é o comando correto)
npx prisma migrate dev --name <nome>   # Criar migração
npx prisma generate                       # Gerar cliente
```

## Stack do Projeto

- **Next.js 15** — Pages Router (não App Router)
- **TypeScript** strict mode
- **Prisma 6** + MariaDB
- **Tailwind CSS v4**
- **JWT** para autenticação com cookies seguros

## Configuração de Ambiente

`.env` requer:
```
DATABASE_URL="mysql://user:pass@host:3306/inventory"
JWT_SECRET="sua_chave_secreta"
```

## Estrutura de Pastas

- `/pages/api/` — Rotas da API
- `/lib/context/` — React Context (estado global)
- `/prisma/` — Schema e migrações
- `/components/` — Componentes reutilizáveis e Layout

## Fluxo de Trabalho

1. `yarn dev` para desenvolvimento local
2. `npx prisma migrate dev` após mudanças no schema
3. `npx prisma generate` após migração
4. `yarn lint` antes de finalizar

## Referências

- `gear7.md` na raiz — Skill principal com convenções de código
