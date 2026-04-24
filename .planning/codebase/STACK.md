# Stack de Technologias

Versões exatas e frameworks utilizados no projeto MegaNuv Inventory.

## Runtime e Framework Principal

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Next.js** | 15.3.3 | Framework React com Pages Router |
| **React** | 19.0.0 | Biblioteca de UI |
| **TypeScript** | 5.9.3 | Superset tipado (strict mode) |
| **Node.js** | 25.6.0 | Runtime JavaScript |

## Banco de Dados

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Prisma** | 6.18.0 | ORM (Object-Relational Mapper) |
| **@prisma/client** | 6.18.0 | Cliente gerado do Prisma |
| **MySQL / MariaDB** | - | Banco de dados relacional |

### Configuração do Banco

- **Provider**: MySQL (compatible com MariaDB)
- **Host**: 127.0.0.1:3306
- **Schema**: Define modelos: User, Category, Active, FatherSpace, Log

## Styling e UI

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Tailwind CSS** | ^4 | Framework CSS utility-first |
| **@tailwindcss/postcss** | ^4 | Integração PostCSS |
| **@tailwindcss/container-queries** | 0.1.1 | Container queries plugin |
| **@headlessui/react** | 2.2.9 | Componentes UI acessíveis |
| **lucide-react** | 0.525.0 | Ícones SVG |

## Autenticação e Segurança

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **jsonwebtoken** | 9.0.2 | JWT signing/verification |
| **jose** | 6.1.0 | JWT additional operations |
| **jwt-decode** | 4.0.0 | Decode JWT tokens |
| **bcryptjs** | 3.0.3 | Hash de senhas |
| **cookie** | 1.0.2 | Gerenciamento de cookies |

## API e Networking

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **axios** | 1.10.0 | HTTP client |
| **Next.js API** | 15.3.3 | Rotas em pages/api/ |

## Funcionalidades

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **framer-motion** | 12.38.0 | Animações React |
| **recharts** | 3.3.0 | Gráficos React |
| **qrcode.react** | 4.2.0 | Componente QR Code |
| **react-qr-code** | 2.0.18 | QR Code rendering |
| **react-rnd** | 10.5.2 | Draggable/resizable components |
| **js-cookie** | 3.0.5 | Cookies no browser |
| **formidable** | 3.5.4 | Parsing de formulários |
| **uuid** | 13.0.0 | Geração de UUIDs |
| **eruda** | 3.4.3 | Debug mobile |

## Storage (Object Storage)

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **minio** | 8.0.6 | Cliente S3-compatible (MinIO) |

## Desenvolvimento

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **eslint** | ^9 | Linter |
| **eslint-config-next** | 15.3.3 | Config ESLint Next.js |
| **prisma** | ^6.18.0 | CLI Prisma |
| **typescript** | ^5.9.3 | Compilador TypeScript |

## Scripts Disponíveis

```bash
yarn dev          # Inicia dev server (limpa .next antes)
yarn build        # Build de produção
yarn start        # Inicia produção
yarn lint         # ESLint
yarn seed         # Executa seed
```

## Estrutura de Pastas

- `/pages/api/` — Rotas da API (Next.js Pages Router)
- `/lib/` — Utilitários e contextos React
- `/prisma/` — Schema e migrações
- `/components/` — Componentes reutilizáveis