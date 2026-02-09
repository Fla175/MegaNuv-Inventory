import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'User with this email already exists.' });

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: { name: name || null, email, password: hashedPassword, role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return res.status(201).json({ message: 'User registered successfully!', user: newUser });
  } catch (error) {
    const err = error as Error & { code?: string };
    console.error('ERRO:', err.message);

    if (err.code?.startsWith('P')) {
      return res.status(500).json({ message: 'Erro de banco de dados.', details: err.message });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}