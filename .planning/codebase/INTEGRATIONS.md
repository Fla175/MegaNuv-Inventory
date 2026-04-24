# Integrações e Serviços Externos

Descrição das integrações com serviços externos, APIs de terceiros e configurações de sistema.

---

## Banco de Dados

### MySQL / MariaDB

| Configuração | Valor |
|--------------|-------|
| **Provider** | MySQL (via Prisma) |
| **Host** | 127.0.0.1 |
| **Porta** | 3306 |
| **Usuário** | mariadb |
| **Database** | banco |
| **Variável** | DATABASE_URL |

**Modelo de dados (Prisma Schema):**

- **User** — Usuários do sistema (admin, manager, viewer)
- **Category** — Categorias de ativos
- **Active** — Itens do inventário
- **FatherSpace** — Locais/espaços físicos
- **Log** — Logs de auditoria

---

## Object Storage (MinIO)

### Configuração

| Configuração | Valor |
|--------------|-------|
| **Provider** | MinIO (S3-compatible) |
| **Endpoint** | min.io2.meganuv.com |
| **Porta** | 9000 |
| **Bucket** | inventory-images |
| **SSL** | Desabilitado |

### Funcionamento

- Upload de imagens para ativos e espaços
- Cliente JavaScript: `minio` ^8.0.6
- Helper: `/lib/minio.ts` — `deleteFileFromMinio()`

---

## Autenticação JWT

### Configuração

| Configuração | Valor |
|--------------|-------|
| **Secret** | Configurado via JWT_SECRET (.env) |
| **Algoritmo** | HMAC (jsonwebtoken) |
| **Expiração** | 1 hora |
| **Payload** | userId, email, role, name |

### Arquivos Relacionados

- `/lib/auth.ts` — `verifyAuthToken()`, `generateAuthToken()`
- `/lib/middlewares/authMiddleware.ts` — Middleware de autenticação

---

## APIs Internas (Next.js Pages Router)

### Rotas Disponíveis

#### Autenticação
- `POST /api/auth/login` — Login
- `POST /api/auth/signup` — Cadastro
- `POST /api/auth/logout` — Logout
- `GET  /api/auth/me` — Dados do usuário logado
- `POST /api/auth/seed` — Seed inicial

#### Usuários
- `GET    /api/users` — Listar usuários
- `GET    /api/users/[id]` — Detalhar usuário
- `PUT    /api/users/update-sort` — Atualizar ordenação
- `PUT    /api/users/update-theme` — Atualizar tema

#### Ativos
- `GET  /api/actives/list` — Listar ativos
- `POST /api/actives/create` — Criar ativo
- `PUT  /api/actives/update` — Atualizar ativo
- `DELETE /api/actives/delete` — Deletar ativo
- `POST /api/actives/move` — Mover ativo

#### Categorias
- `GET    /api/categories/list` — Listar categorias
- `POST   /api/categories/create` — Criar categoria
- `PUT    /api/categories/update` — Atualizar categoria
- `DELETE /api/categories/delete` — Deletar categoria

#### Espaços (FatherSpace)
- `GET    /api/father-spaces/list` — Listar espaços
- `POST   /api/father-spaces/create` — Criar espaço
- `PUT    /api/father-spaces/update` — Atualizar espaço
- `DELETE /api/father-spaces/delete` — Deletar espaço

#### Storage
- `POST /api/storage/upload-url` — Gerar URL para upload

#### QR Codes
- `GET /api/qrcode/public-get` — QR code público

#### Logs
- `GET  /api/logs/list` — Listar logs
- `POST /api/logs/clear` — Limpar logs

#### Dashboard
- `GET /api/dashboard/stats` — Estatísticas

---

## Configurações de Ambiente (.env)

```env
# Banco de Dados
DATABASE_URL="mysql://mariadb:1gysr542ubej6@127.0.0.1:3306/banco"

# JWT
JWT_SECRET="59YOkc5YQMIynoUB2XI6CmNsVQSZg349x7aM2ZrhQ/g="
DEBUG_ALLOW_JWT=true

# Next.js
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# MinIO
MINIO_ENDPOINT="min.io2.meganuv.com"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minio"
MINIO_SECRET_KEY="123asd!@#"
```

---

## Funcionalidades de Terceiros

### UI/UX

- **@headlessui/react** — Componentes acessíveis (dropdowns, modais)
- **framer-motion** — Animações e transições
- **lucide-react** — Ícones vetoriais
- **recharts** — Gráficos e visualizações
- **react-rnd** — Componentes redimensionáveis

### QR Codes

- **qrcode.react** — Geração de QR codes
- **react-qr-code** — Renderização de QR codes

### Utilities

- **axios** — Requests HTTP
- **bcryptjs** — Hash de senhas
- **cookie** — Gerenciamento de cookies HTTP
- **formidable** — Parsing de multipart forms
- **js-cookie** — Cookies no browser
- **uuid** — Geração de IDs únicos
- **eruda** — Console de debug mobile

---

## Resumo de Integrações

| Serviço | Tipo | Status |
|---------|------|--------|
| MariaDB | MySQL | Local (127.0.0.1:3306) |
| MinIO | S3 Storage | Externo (min.io2.meganuv.com) |
| JWT | Autenticação | Local (cookie-based) |

---

## Variáveis de Ambiente Obrigatórias

Para o projeto funcionar:

1. `DATABASE_URL` — String de conexão MySQL
2. `JWT_SECRET` — Chave secreta para JWT
3. `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` — Configuração MinIO