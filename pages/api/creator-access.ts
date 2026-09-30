// pages/api/creator-access.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { generateAuthToken, verifyAuthToken } from '@/lib/auth';
import { createLog } from '@/lib/logger';

function extractToken(req: NextApiRequest): string | null {
  if (req.cookies.auth_token) {
    return req.cookies.auth_token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.CREATOR_ACCESS_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Creator access desabilitado.' });
  }

  const isSecure = process.env.COOKIE_SECURE === 'true';

  if (req.method === 'POST') {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const creator = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!creator || !creator.isCreator) {
      return res.status(403).json({ error: 'Acesso restrito ao criador.' });
    }

    const { targetUserId, reason, password } = req.body || {};

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({ error: 'targetUserId é obrigatório.' });
    }

    if (reason !== undefined && reason !== null && reason !== '') {
      if (typeof reason !== 'string' || reason.length < 8) {
        return res.status(400).json({ error: 'O motivo deve ter pelo menos 8 caracteres.' });
      }
    }

    if (targetUserId === creator.id) {
      return res.status(400).json({ error: 'Não é possível entrar na própria conta.' });
    }

    if (req.cookies.auth_token_creator) {
      return res.status(409).json({ error: 'Restaure sua conta antes de entrar em outra.' });
    }

    if (process.env.CREATOR_ACCESS_REQUIRE_PASSWORD === 'true') {
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Senha é obrigatória.' });
      }
      const isPasswordValid = await bcrypt.compare(password, creator.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const tokenAlvo = await generateAuthToken(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        name: targetUser.name ?? undefined,
      },
      { expiresIn: '2h' }
    );

    const tokenCriador = token;

    await createLog(
      req,
      creator.id,
      'CREATOR_ACCESS_ENTER',
      `Entrou na conta de ${targetUser.name || targetUser.email} (${targetUser.id})${reason ? `. Motivo: ${reason}` : ''}`
    );

    res.setHeader('Set-Cookie', [
      serialize('auth_token', tokenAlvo, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: 2 * 60 * 60,
        sameSite: 'lax',
      }),
      serialize('auth_token_creator', tokenCriador, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: 8 * 60 * 60,
        sameSite: 'lax',
      }),
    ]);

    return res.status(200).json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      impersonated: true,
    });
  }

  if (req.method === 'DELETE') {
    const stashToken = req.cookies.auth_token_creator;
    if (!stashToken) {
      return res.status(400).json({ error: 'Nenhuma sessão de criador para restaurar.' });
    }

    const currentToken = extractToken(req);
    const currentPayload = currentToken ? await verifyAuthToken(currentToken) : null;
    const effectiveUserId = currentPayload?.userId || null;

    await createLog(
      req,
      effectiveUserId,
      'CREATOR_ACCESS_RESTORE',
      'Restaurou a sessão do criador'
    );

    res.setHeader('Set-Cookie', [
      serialize('auth_token', stashToken, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: 8 * 60 * 60,
        sameSite: 'lax',
      }),
      serialize('auth_token_creator', '', {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: -1,
        sameSite: 'lax',
      }),
    ]);

    return res.status(200).json({ restored: true });
  }

  if (req.method === 'PATCH') {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const creator = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!creator || !creator.isCreator) {
      return res.status(403).json({ error: 'Acesso restrito ao criador.' });
    }

    const { newCreatorId } = req.body || {};
    if (!newCreatorId || typeof newCreatorId !== 'string') {
      return res.status(400).json({ error: 'newCreatorId é obrigatório.' });
    }

    if (newCreatorId === creator.id) {
      return res.status(400).json({ error: 'Novo criador deve ser diferente do atual.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: newCreatorId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário destinatário não encontrado.' });
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.user.updateMany({
          where: { isCreator: true },
          data: { isCreator: false },
        });

        const promotedRole =
          targetUser.role === UserRole.VIEWER || targetUser.role === UserRole.MANAGER
            ? UserRole.ADMIN
            : targetUser.role;

        await tx.user.update({
          where: { id: newCreatorId },
          data: {
            isCreator: true,
            role: promotedRole,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    await createLog(
      req,
      creator.id,
      'CREATOR_ACCESS_TRANSFER',
      `Transferiu o título de criador para ${targetUser.name || targetUser.email} (${targetUser.id})`
    );

    return res.status(200).json({ success: true, newCreatorId });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
