// pages/api/auth/login.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs'; // Para comparar a senha
import jwt from 'jsonwebtoken'; // Para gerar o JWT
import prisma from '../../../lib/prisma'; // Instância do Prisma Client

// Chave secreta para assinar o JWT.
// MUITO IMPORTANTE: Em produção, NUNCA deixe isso hardcoded ou em um .env publicamente acessível.
// Use uma variável de ambiente FORTEMENTE segura (ex: process.env.JWT_SECRET)
// e gere uma string aleatória e complexa para isso.
const JWT_SECRET = process.env.JWT_SECRET || 'sua_super_secreta_chave_jwt'; // Mude esta chave!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // A rota de login deve aceitar apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  // 1. Validação básica de entrada
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 2. Encontrar o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Se o usuário não for encontrado, ou se a senha estiver incorreta,
    // retorne uma mensagem genérica para não dar dicas sobre a existência do e-mail.
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Comparar a senha fornecida com a senha hashada no banco de dados
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 4. Se as senhas combinarem, gerar um JWT
    // Incluímos informações relevantes do usuário no payload do token,
    // mas evite informações sensíveis como a senha.
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role, // Adiciona o papel do usuário ao token para autorização
      },
      JWT_SECRET,
      {
        expiresIn: '1h', // O token expira em 1 hora (ajuste conforme a necessidade)
      }
    );

    // Opcional: Atualizar a data do último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // 5. Retornar o token JWT e algumas informações básicas do usuário
    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Error during user login:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
