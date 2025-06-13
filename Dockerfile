# --- BUILDER STAGE ---
FROM node:22-alpine AS builder
WORKDIR /builder

COPY . .

RUN yarn install && yarn build

FROM node:22-alpine AS runner

WORKDIR /app 

COPY --from=builder /builder/package.json ./package.json
COPY --from=builder /builder/yarn.lock ./yarn.lock

COPY --from=builder /builder/node_modules ./node_modules

COPY --from=builder /builder/.next ./.next
COPY --from=builder /builder/public ./public

COPY --from=builder /builder/prisma ./prisma 

EXPOSE 3000

CMD ["yarn", "start"]