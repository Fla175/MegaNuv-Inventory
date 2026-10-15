# syntax=docker/dockerfile:1
# Build e runtime da imagem MegaNuv Inventory.
#
# O projeto usa `output: "standalone"` (next.config.ts), então o runner NÃO
# precisa do `node_modules` completo: o bundle standalone já traz as dependências
# de produção em `.next/standalone/node_modules`. Copiar o `node_modules` inteiro
# (1.1G) só para o mesmo resultado, e tornava a imagem muito maior.

# --- BUILDER STAGE ---
FROM node:22-alpine AS builder
WORKDIR /builder

# Dependências primeiro, em camada própria, para reaproveitar o cache do Docker
# quando apenas o código muda.
COPY package.json yarn.lock ./
# O cache do yarn é montado como cache do BuildKit, fora da layer: ele persiste
# entre builds (build rápido) mas nunca entra na imagem. Sem isso a layer de
# instalação carrega o cache multi-GB do yarn (binários do rolldown para ~13
# plataformas) junto com o node_modules, o que estoura o disco do host.
# `--frozen-lockfile` garante que a imagem nunca altere o yarn.lock (SPECS.md §5.3).
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

COPY . .

# `yarn install` roda ANTES deste COPY (a layer de dependências vem primeiro para
# reaproveitar cache), então o postinstall do @prisma/client roda sem o
# prisma/schema.prisma na imagem e não gera nada. O build quebra com
# "Module '@prisma/client' has no exported member 'UserRole'" — por isso o
# generate explícito aqui, depois que o schema está no contexto.
RUN npx prisma generate

# `node:22-alpine` não traz bash, e `yarn build:opt` executa
# `bash scripts/build-optimized.sh` (`/bin/sh: bash: not found` sem isto).
RUN apk add --no-cache bash

# `yarn build` não existe no package.json — o script de build é `build:opt`
# (scripts/build-optimized.sh). O build não exige JWT_SECRET nem MINIO_*: as
# rotas de API só são avaliadas em runtime, não em tempo de build.
RUN yarn build:opt

# --- RUNNER STAGE ---
FROM node:22-alpine AS runner
WORKDIR /app

# O start script do package.json (`cd .next/standalone && node server.js`) espera
# a raiz do standalone em /app, então copiamos o conteúdo dele para /app.
COPY --from=builder /builder/.next/standalone ./
COPY --from=builder /builder/.next/static ./.next/static
COPY --from=builder /builder/public ./public
COPY --from=builder /builder/prisma ./prisma
COPY --from=builder /builder/package.json ./package.json

# 'node' (uid 1000) já existe na imagem base; garantir ownership do /app.
RUN chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

# `node server.js` direto, porque o start script assume o cwd em .next/standalone
# mas no runner o server.js está na raiz de /app.
CMD ["node", "server.js"]