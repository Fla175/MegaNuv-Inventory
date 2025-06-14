// pages/api/auth/signup.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs'; // Importa a biblioteca bcryptjs para hash de senhas
import prisma from '../../../lib/prisma'; // Importa a instância do Prisma Client

// Número de "salt rounds" para o bcrypt. Quanto maior, mais seguro (e mais lento).
// 10-12 é um bom ponto de partida para a maioria das aplicações.
const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // A rota de registro deve aceitar apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password, name } = req.body;

  // 1. Validação básica de entrada
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Opcional: Adicionar validação de formato de email e complexidade da senha

  try {
    // 2. Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // 3. Hashear a senha
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Criar o novo usuário no banco de dados
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null, // 'name' é opcional no schema, então pode ser null
        // role e status terão os valores padrão definidos no schema.prisma
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

    // 5. Retornar uma resposta de sucesso
    return res.status(201).json({ message: 'User registered successfully!', user: newUser });

  } catch (error) {
    console.error('Error during user registration:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}