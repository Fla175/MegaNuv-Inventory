// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSessionUser, isPrivileged } from '@/lib/apiAuth';
import { canAssignRole, isUserRole } from '@/lib/rbac';
import type { UserRole } from '@prisma/client';

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
    // 1. Verificar se existe algum usuário ADMIN no sistema
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    // 2. Se NÃO existe ADMIN, permitir registro (primeiro ADMIN do sistema)
    // 3. Se JÁ existe ADMIN, exigir sessão de ADMIN **ou DIRECTOR**.
    //    A tabela de RBAC (SPECS.md §4.2) dá a DIRECTOR "todos" em Gerencia
    //    usuários, e o ADMIN é quem tem o papel oposto (exceto DIRECTOR).
    let requester: { id: string; role: UserRole; isCreator: boolean } | null = null;

    if (adminCount > 0) {
      const session = await getSessionUser(req);
      if (!session) {
        return res.status(401).json({ message: 'Sessão expirada. Faça login.' });
      }

      if (!isPrivileged(session)) {
        return res.status(403).json({ message: 'Apenas ADMIN e DIRECTOR podem criar novos usuários.' });
      }

      // `isCreator` não está no token: é o banco que decide se este ADMIN
      // pode semear o único DIRECTOR.
      requester = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, role: true, isCreator: true },
      });

      if (!requester) {
        return res.status(401).json({ message: 'Usuário não encontrado.' });
      }
    }

    // 4. Verificar se email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Já existe um usuário com este email.' });
    }

    // 5. Validar o papel pedido. Papel desconhecido é erro do cliente — o
    //    default silencioso de antes escondia payload inválido.
    if (role !== undefined && role !== null && role !== '' && !isUserRole(role)) {
      return res.status(400).json({ message: 'Papel inválido.' });
    }
    const requestedRole: UserRole = isUserRole(role) ? role : 'VIEWER';

    if (adminCount > 0) {
      // DIRECTOR é singleton: só o criador pode semear o primeiro, e só
      // enquanto não existir outro. ADMIN comum não cria DIRECTOR.
      const directorExists =
        requestedRole === 'DIRECTOR'
          ? (await prisma.user.findFirst({
              where: { role: 'DIRECTOR' },
              select: { id: true },
            })) !== null
          : false;

      if (requestedRole === 'DIRECTOR' && directorExists) {
        return res.status(409).json({ message: 'Já existe um usuário com a role DIRECTOR no sistema.' });
      }

      if (!requester || !canAssignRole(requester, requestedRole, { directorExists })) {
        return res.status(403).json({
          message: 'Você não tem permissão para criar um usuário com este papel.',
        });
      }
    }

    const userRole = adminCount === 0 ? "ADMIN" : requestedRole;
    const userIsCreator = adminCount === 0;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: { 
        name: name || null, 
        email, 
        password: hashedPassword, 
        role: userRole,
        isCreator: userIsCreator,
      },
      select: { id: true, email: true, name: true, role: true, isCreator: true, createdAt: true },
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