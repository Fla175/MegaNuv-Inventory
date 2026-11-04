// pages/api/creator-access.ts
//
// O acesso do criador é SEMPRE ativo e SEMPRE exige a senha do criador.
// Antes havia flags de ambiente (`CREATOR_ACCESS_ENABLED`,
// `CREATOR_ACCESS_REQUIRE_PASSWORD`) que se comportavam como kill switch e como
// confirmation opcional: quem configurou omitiu a linha e o recurso degradou em
// silêncio, respondendo 403 sem sinalizar o motivo. Não reintroduzir flags aqui.
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { generateAuthToken, verifyAuthToken } from '@/lib/auth';
import { createLog } from '@/lib/logger';

// Rate limiting simples por IP + token JWT
const rateLimitStore = new Map<string, { count: number; reset: number }>();

export { rateLimitStore };

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, { count: 1, reset: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 4 };
  }

  if (now > entry.reset) {
    rateLimitStore.set(key, { count: 1, reset: now + 15 * 60 * 1000 });
    return { allowed: true, remaining: 4 };
  }

  if (entry.count >= 5) {
    return { allowed: false, remaining: 0 };
  }

  rateLimitStore.set(key, { count: entry.count + 1, reset: entry.reset });
  return { allowed: true, remaining: 5 - entry.count };
}

function rateLimitKey(req: NextApiRequest): string {
  const token = (req.cookies.auth_token
    || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1] : null));
  return token ? `creator-access:${token}` : `creator-access:ip:${req.socket.remoteAddress || 'unknown'}`;
}

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

    // Rate limiting
    const rlKey = rateLimitKey(req);
    const rlCheck = checkRateLimit(rlKey);
    if (!rlCheck.allowed) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
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

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }

    const isPasswordValid = await bcrypt.compare(password, creator.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta.' });
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
      `Entrou na conta de ${targetUser.name || targetUser.email} (${targetUser.id})${reason ? `. Motivo: ${reason}` : ''}`,
      { action: 'enter', success: true, targetUserId: targetUser.id }
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
        maxAge: 60 * 60, // 1 hora (reduzido de 8 horas por ADR-005)
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
    // Verifica se o stash cookie existe
    const stashCookie = req.cookies.auth_token_creator;
    if (!stashCookie) {
      return res.status(400).json({ error: 'Nenhuma sessão de criador para restaurar.' });
    }

    // Stash existe - atualiza a janela de validade do token principal
    // e remove o stash cookie. Isso é o "sistema automatizado que atualiza
    // a janela quando o cookie for invalidado".
    // Gera um novo token auth_token com a mesma sessão do usuário,
    // mas sem o stash de impersonação ativo.
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies.auth_token;

    const token = bearerToken || req.cookies.auth_token;
    const payload = token ? await verifyAuthToken(token) : null;
    const userId = payload?.userId;

    if (userId) {
      // Gera novo token principal sem stash
      const newToken = await generateAuthToken({ userId, email: '', role: 'VIEWER' });

      const cookieOpts = {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: 2 * 60 * 60, // 2 horas
        sameSite: 'lax' as const,
      };

      // Define novo token principal
      res.setHeader('Set-Cookie', [
        serialize('auth_token', newToken, cookieOpts),
      ]);

      // Remove o stash cookie
      res.setHeader('Set-Cookie', [
        serialize('auth_token_creator', '', {
          httpOnly: true,
          secure: isSecure,
          path: '/',
          maxAge: -1,
          sameSite: 'lax' as const,
        }),
      ]);
    } else {
      // Não conseguiu extrair userId - limpa ambos os cookies
      res.setHeader('Set-Cookie', [
        serialize('auth_token', '', {
          httpOnly: true,
          secure: isSecure,
          path: '/',
          maxAge: -1,
          sameSite: 'lax' as const,
        }),
        serialize('auth_token_creator', '', {
          httpOnly: true,
          secure: isSecure,
          path: '/',
          maxAge: -1,
          sameSite: 'lax' as const,
        }),
      ]);
    }

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
      `Transferiu o título de criador para ${targetUser.name || targetUser.email} (${targetUser.id})`,
      { action: 'transfer', success: true, targetUserId: targetUser.id }
    );

    return res.status(200).json({ success: true, newCreatorId });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
