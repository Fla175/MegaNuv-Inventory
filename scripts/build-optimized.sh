#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "> yarn install --frozen-lockfile"
yarn install --frozen-lockfile
# Usa `yarn next` (e não `next`): o binário vive em node_modules/.bin, que só
# entra no PATH quando o comando é executado pelo yarn. Invocar `next` direto
# falha com "command not found" fora do `yarn run`.
echo "> yarn next build"
yarn next build
echo "> rm -rf .next/cache"
rm -rf .next/cache
if [ -f .env ]; then cp .env .next/standalone/.env; fi
echo "> du -sh node_modules .next/standalone"
du -sh node_modules .next/standalone 2>/dev/null || true
echo "> cp -r public .next/standalone/public"
cp -r public .next/standalone/public
echo "> mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/"
mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/
