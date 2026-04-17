// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const basePrisma = new PrismaClient();

// Função auxiliar para gerar ID Hex de 4 dígitos único
async function generateUniqueHexId(model: { findUnique: (args: { where: { id: string } }) => Promise<unknown> }): Promise<string> {
  let isUnique = false;
  let newId = "";

  while (!isUnique) {
    // Gera 2 bytes (4 caracteres hexadecimais)
    newId = randomBytes(2).toString('hex').toUpperCase();
    
    // Verifica se já existe no modelo específico
    const exists = await model.findUnique({
      where: { id: newId },
    });

    if (!exists) isUnique = true;
  }
  return newId;
}

// Criando a Extensão
export const prisma = basePrisma.$extends({
  query: {
    active: {
      async create({ args, query }) {
        // Se o ID não for passado manualmente, gera o hex de 4 dígitos
        args.data.id = args.data.id || await generateUniqueHexId(basePrisma.active);
        return query(args);
      },
    },
    fatherSpace: {
      async create({ args, query }) {
        args.data.id = args.data.id || await generateUniqueHexId(basePrisma.fatherSpace);
        return query(args);
      },
    },
  },
});

// Configuração para Next.js (Hot Reload)
declare global {
  var prismaGlobal: typeof prisma | undefined;
}

const db = global.prismaGlobal || prisma;

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = db;
}

export default db;