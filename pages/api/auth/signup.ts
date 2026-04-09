// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
  }

  const { email, password, name, role } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Já existe um usuário com este email.' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Evita que passem ADMIN pela requisição a menos que você construa uma trava futuramente
    const userRole = role === "MANAGER" || role === "VIEWER" || role === "ADMIN" ? role : "VIEWER";

    const newUser = await prisma.user.create({
      data: { 
        name: name || null, 
        email, 
        password: hashedPassword, 
        role: userRole 
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    // SISTEMA DE LOGS: Registro de novo cadastro
    await prisma.log.create({
      data: {
        action: "REGISTRO DE USUÁRIO",
        details: `Novo usuário registrado: ${name} com nível ${userRole}.`,
        userId: newUser.id, // Quem sofreu a ação / Quem fez
        ip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || "Desconhecido",
        userAgent: req.headers['user-agent'] || "Desconhecido"
      }
    });

    return res.status(201).json({ message: 'Usuário registrado com sucesso!', user: newUser });

  } catch (error) {
    const err = error as Error & { code?: string };
    console.error('ERRO NO REGISTER:', err.message);

    if (err.code?.startsWith('P')) {
      return res.status(500).json({ message: 'Erro de banco de dados.', details: err.message });
    }
    return res.status(500).json({ message: 'Erro interno de servidor.' });
  }
}