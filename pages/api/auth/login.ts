// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
  }

  if (!JWT_SECRET) {
    console.error("ERRO CRÍTICO: JWT_SECRET não configurado no .env");
    return res.status(500).json({ message: 'Internal Server Error (Config)' });
  }

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Gerando o token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' } // Aumentei para 8h para melhor UX no dia de trabalho
    );

    // Configurando o Cookie
    res.setHeader('Set-Cookie', serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
      sameSite: 'lax',
    }));

    // Atualiza o último login
    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { lastLogin: new Date() } 
    });

    // SISTEMA DE LOGS: Registra o Login
    await prisma.log.create({
      data: {
        action: "LOGIN DE USUÁRIO",
        details: `Login realizado com sucesso pela conta: ${user.name}`,
        userId: user.id,
        ip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || "Desconhecido",
        userAgent: req.headers['user-agent'] || "Desconhecido"
      }
    });

    return res.status(200).json({
      message: 'Login bem-sucedido!',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
}