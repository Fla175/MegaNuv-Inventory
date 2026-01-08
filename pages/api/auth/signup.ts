// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Importa a instância do Prisma Client

// Usa require para garantir que a dependência bcryptjs seja carregada corretamente
// em diferentes ambientes de execução do Next.js (como Edge ou serverless functions)
const bcrypt = require('bcryptjs'); 

// Número de "salt rounds" para o bcrypt.
const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // 2. Hashear a senha
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Criar o novo usuário no banco de dados
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // 4. Retornar resposta de sucesso
    return res.status(201).json({ message: 'User registered successfully!', user: newUser });

  } catch (error: any) {
    // LOG DETALHADO: Imprime a stack trace completa para debugging
    console.error('#####################################################');
    console.error('ERRO DETALHADO DURANTE O REGISTRO DE USUÁRIO:');
    console.error(error.message);
    console.error(error.stack);
    console.error('#####################################################');

    // Se o erro for do Prisma (ex: falha de conexão/tipagem), ele terá o código 'P2002' etc.
    if (error.code && error.code.startsWith('P')) {
      return res.status(500).json({ message: 'Erro de banco de dados do Prisma.', details: error.message });
    }
    
    return res.status(500).json({ message: 'Internal Server Error', details: 'Verifique o log do servidor para o stack trace.' });
  }
}