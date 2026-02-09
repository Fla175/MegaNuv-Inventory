// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

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

    return res.status(200).json(users);
  } catch (error) {
    const err = error as Error;
    console.error("Erro ao listar usuários:", err.message);
    return res.status(500).json({ message: "Erro interno ao buscar usuários." });
  }
}