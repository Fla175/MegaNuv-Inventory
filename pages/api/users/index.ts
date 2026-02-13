// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

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
    } catch (error) {
      const err = error as Error;
      console.error("Erro ao listar usuários:", err.message);
      res.status(500).json({ message: "Erro interno ao buscar usuários." });
    }
    return;
  }

  // 2. Lógica para CRIAR usuário (POST)
  if (req.method === 'POST') {
    try {
      const data = req.body;

      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      const newUser = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: data.role || 'USER',
          password: hashedPassword,
        }
      });

      res.status(201).json(newUser);
    } catch (error) {
      const err = error as Error;
      console.error("Erro ao criar usuário:", err.message);

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