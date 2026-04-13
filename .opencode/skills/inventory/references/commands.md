# Comandos do Projeto

Lista de comandos disponíveis no MegaNuv Inventory.

---

## Desenvolvimento

```bash
# Iniciar dev server (limpa .next antes)
yarn dev

# Build de produção
yarn build

# Lint ESLint
yarn lint
```

---

## Prisma

```bash
# Criar migração
npx prisma migrate dev --name <nome>

# Gerar cliente Prisma
npx prisma generate

# Resetar banco (cuidado!)
npx prisma migrate reset

# Ver status
npx prisma migrate status
```

---

## Banco de Dados

### Conexão

O banco é MariaDB. Configure em `.env`:

```env
DATABASE_URL="mysql://user:pass@host:3306/inventory"
```

### Schema

Modelo em `prisma/schema.prisma`. Contém:
- User (usuários)
- Produto (produtos)
- Categoria (categorias)
- Estoque (estoque)
- Movimentacao (movimentações)
- etc

---

## Build e Deploy

```bash
# Build produção
yarn build

# Gerar output em .next/
```

---

## MinIO (Storage)

Arquivos em `lib/minio.ts`. Configurar:

```env
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="inventory"
```

---

## Autenticação

JWT com cookies seguros. Ver `lib/auth.ts`.

```env
JWT_SECRET="sua_chave_secreta"
```

---

## Scripts Disponíveis

Ver `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

---

## Tailwind CSS

Versão 4. Configuração em `tailwind.config.mjs`.

Styles globais em `styles/globals.css`.