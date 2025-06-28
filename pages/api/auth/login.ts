// pages/api/auth/login.ts (SameSite=None e Secure=true)

import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import prisma from '../../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_super_secreta_chave_jwt';
// MUITO IMPORTANTE: Esta variável DEVE ser a URL completa do seu aplicativo,
// INCLUINDO o protocolo (http ou https) e o domínio/IP.
// Para Ngrok, DEVE SER A URL HTTPS DO NGROK. Ex: https://fde4-179-124-29-242.ngrok-free.app
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );

    // --- CORREÇÃO FINAL PARA COOKIE: SameSite=None e Secure=true ---
    const url = new URL(NEXT_PUBLIC_BASE_URL);
    const isHttps = url.protocol === 'https:';

    res.setHeader('Set-Cookie', serialize('auth_token', token, {
      httpOnly: true,
      // 'secure' DEVE ser true se 'SameSite' for 'None'.
      // Será true se 'NEXT_PUBLIC_BASE_URL' for HTTPS ou em produção.
      secure: isHttps || process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hora
      path: '/', // Acessível em todas as rotas
      sameSite: 'none' as const, // Permite envio cross-site, MAS EXIGE 'secure: true'
      // 'domain' é omitido para que o navegador defina para o host da requisição (IP ou domínio Ngrok)
    }));
    // --- FIM DA CORREÇÃO ---

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

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
