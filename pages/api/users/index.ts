// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as jose from "jose";

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

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
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json(users);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      res.status(500).json({ message: "Erro interno ao buscar usuários." });
    }
    return;
  }

  // 2. Lógica para CRIAR usuário (POST)
  if (req.method === 'POST') {
    try {
      // Autenticação
      const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ message: "Sessão expirada." });

      const secret = new TextEncoder().encode(JWT_SECRET!);
      const { payload } = await jose.jwtVerify(token, secret);
      const decoded = payload as { role: string };

      // VIEWER não pode criar ninguém
      if (decoded.role === 'VIEWER') {
        return res.status(403).json({ message: "Visualizadores não podem criar usuários." });
      }

      // MANAGER só pode criar VIEWER e MANAGER
      const data = req.body;
      if (decoded.role === 'MANAGER' && data.role === 'ADMIN') {
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
         res.status(409).json({ message: "Email já cadastrado." });
         return;
      }

      res.status(500).json({ message: "Erro ao criar usuário." });
    }
    return;
  }

  // 3. Se não for GET nem POST, retorna 405
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}