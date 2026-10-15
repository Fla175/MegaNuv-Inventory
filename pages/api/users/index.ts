// pages/api/users/index.ts
import type { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthenticatedNextApiRequest } from '@/lib/middlewares/authMiddleware';

const saltRounds = 10;

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  // 1. Lógica para LISTAR usuários (GET)
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(users);
    } catch {
      res.status(500).json({ message: "Erro interno ao buscar usuários." });
    }
    return;
  }

  // 2. Lógica para CRIAR usuário (POST)
  if (req.method === 'POST') {
    try {
      // VIEWER não pode criar ninguém
      if (req.user?.role === 'VIEWER') {
        return res.status(403).json({ message: "Visualizadores não podem criar usuários." });
      }

      // MANAGER só pode criar VIEWER e MANAGER
      const data = req.body;
      if (req.user?.role === 'MANAGER' && data.role === 'ADMIN') {
        return res.status(403).json({ message: "Gerentes não podem criar administradores." });
      }

      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      const newUser = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: data.role || 'VIEWER',
          password: hashedPassword,
        }
      });

      res.status(201).json(newUser);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');

      if (err.message.includes('Unique constraint')) {
        res.status(409).json({ message: "Email já registrado." });
        return;
      }

      res.status(500).json({ message: "Erro ao criar usuário." });
    }
    return;
  }

  // 3. Se não for GET nem POST, retorna 405
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
};

export default authMiddleware(handler);
