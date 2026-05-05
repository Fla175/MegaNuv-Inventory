// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed. Use POST.' });
  }

  const { email, password, name, role } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    // 1. Verificar se existe algum usuário ADMIN no sistema
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    // 2. Se NÃO existe ADMIN, permitir registro (primeiro ADMIN do sistema)
    // 3. Se JÁ existe ADMIN, exigir token de ADMIN autenticado
    if (adminCount > 0) {
      const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: 'Sessão expirada. Faça login.' });
      }

      try {
        const secret = new TextEncoder().encode(JWT_SECRET!);
        const { payload } = await jose.jwtVerify(token, secret);
        if (payload.role !== 'ADMIN') {
          return res.status(403).json({ message: 'Apenas administradores podem criar novos usuários.' });
        }
      } catch {
        return res.status(401).json({ message: 'Token inválido.' });
      }
    }

    // 4. Verificar se email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Já existe um usuário com este email.' });
    }

    // 5. Se é primeiro ADMIN, o role deve ser ADMIN
    // Se já existe ADMIN, o role solicitado deve ser válido
    const requestedRole = role === "MANAGER" || role === "VIEWER" || role === "ADMIN" ? role : "VIEWER";
    const userRole = adminCount === 0 ? "ADMIN" : requestedRole;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

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
        userId: newUser.id,
        ip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || "Desconhecido",
        userAgent: req.headers['user-agent'] || "Desconhecido"
      }
    });

    return res.status(201).json({ message: 'Usuário registrado com sucesso!', user: newUser });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Erro ao registrar usuário');

    if (err.message.includes('Unique constraint')) {
      return res.status(500).json({ message: 'Erro de banco de dados.', details: err.message });
    }
    return res.status(500).json({ message: 'Erro interno de servidor.' });
  }
}