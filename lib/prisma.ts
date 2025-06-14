// lib/prisma.ts (ou .js)
import { PrismaClient } from '@prisma/client';

// Adiciona o Prisma Client ao objeto global em desenvolvimento
// para evitar instanciar muitos clientes durante hot-reloads
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;