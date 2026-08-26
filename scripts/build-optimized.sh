#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "$ yarn install --frozen-lockfile"
yarn install --frozen-lockfile
echo "$ next build"
next build
echo "$ rm -rf .next/cache"
rm -rf .next/cache
if [ -f .env ]; then cp .env .next/standalone/.env; fi
echo "$ du -sh node_modules .next/standalone 2>/dev/null || true"
du -sh node_modules .next/standalone 2>/dev/null || true
echo "$ cp -r public .next/standalone/public"
cp -r public .next/standalone/public
echo "$ mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/"
mkdir -p .next/standalone/.next && cp -r .next/static .next/standalone/.next/
