// pages/api/users/index.ts
import type { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthenticatedNextApiRequest } from '@/lib/middlewares/authMiddleware';
import { canAssignRole, isUserRole, type RbacActor } from '@/lib/rbac';

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
      const data = req.body ?? {};

      // An unknown role used to reach Prisma and fail as a 500. Reject it
      // explicitly; an absent/empty field defaults to VIEWER (the form starts
      // with no role selected).
      if (data.role !== undefined && data.role !== null && data.role !== '' && !isUserRole(data.role)) {
        return res.status(400).json({ message: "Papel inválido." });
      }
      const targetRole = isUserRole(data.role) ? data.role : 'VIEWER';

      // For a DIRECTOR target the creator flag decides, and it is not in the
      // token: read the requester. Every other role is decided by the token
      // role alone, so the common path stays a single query (the INSERT).
      let actor: RbacActor = { role: req.user!.role };
      let directorExists = false;

      if (targetRole === 'DIRECTOR') {
        const requester = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { id: true, role: true, isCreator: true },
        });
        if (!requester) {
          return res.status(401).json({ message: "Usuário não encontrado." });
        }
        actor = requester;

        directorExists =
          (await prisma.user.findFirst({
            where: { role: 'DIRECTOR' },
            select: { id: true },
          })) !== null;

        if (directorExists) {
          return res.status(409).json({ message: "Já existe um usuário DIRECTOR." });
        }
      }

      if (!canAssignRole(actor, targetRole, { directorExists })) {
        return res.status(403).json({
          message: "Você não tem permissão para criar um usuário com este papel.",
        });
      }

      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      const newUser = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          role: targetRole,
          password: hashedPassword,
        },
        // Never echo the password hash back to the client.
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLogin: true,
          createdAt: true,
        },
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
