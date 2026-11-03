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
import { generateAuthToken, verifyAuthToken, tokenLifetimeSeconds } from '@/lib/auth';
import { createLog } from '@/lib/logger';

/** Vida do token de impersonação (2 h) — o cookie nunca pode durar mais que isso. */
const IMPERSONATION_TTL_SECONDS = 2 * 60 * 60;

/**
 * `maxAge` seguro para um cookie que guarda `token`: o tempo de vida do próprio
 * JWT, ou `null` quando ele não pode ser lido (aí quem chama decide o default).
 */
function stashMaxAge(token: string): number | null {
  const [, encodedPayload] = token.split('.');
  if (!encodedPayload) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return tokenLifetimeSeconds({
      exp: typeof payload?.exp === 'number' ? payload.exp : undefined,
      iat: typeof payload?.iat === 'number' ? payload.iat : undefined,
    });
  } catch {
    return null;
  }
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

    // Um stash vivo bloqueia uma segunda entrada. Um stash **morto** (token
    // expirado/adulterado) não é sessão: antes esta checagem só olhava a
    // presença do cookie, então um `auth_token_creator` vencido — sobrevivente
    // de um `auth_token` de 2 h que expirou — travava o criador em 409 até o
    // cookie de 8 h caducar. Stash inválido é ignorado e sobrescrito abaixo.
    const existingStash = req.cookies.auth_token_creator;
    if (existingStash && (await verifyAuthToken(existingStash))) {
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
      `Entrou na conta de ${targetUser.name || targetUser.email} (${targetUser.id})${reason ? `. Motivo: ${reason}` : ''}`
    );

    res.setHeader('Set-Cookie', [
      serialize('auth_token', tokenAlvo, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: IMPERSONATION_TTL_SECONDS,
        sameSite: 'lax',
      }),
      // `maxAge` derivado do `exp` do stash, nunca um valor fixo maior que ele:
      // cookie mais duradouro que o token é cookie que expira na cara do
      // usuário (401) ou que o restore aceita sem prova.
      serialize('auth_token_creator', tokenCriador, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        maxAge: stashMaxAge(tokenCriador) ?? IMPERSONATION_TTL_SECONDS,
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

    // Restaurar a sessão do criador **devolve o maior privilégio do sistema**
    // (`isCreator` habilita semear DIRECTOR e transferir o título). Portanto
    // exige, como o POST, a senha do criador: antes bastava o cookie, e um
    // stash sobrevivente de um login anterior — ou de outra pessoa na mesma
    // máquina — era trocado por `auth_token` sem nenhuma prova.
    const stashPayload = await verifyAuthToken(stashToken);
    if (!stashPayload) {
      // Stash expirado/adulterado: não é sessão. Apaga para não deixar o
      // usuário preso no banner de impersonação nem em 409 no POST.
      res.setHeader('Set-Cookie', [
        serialize('auth_token_creator', '', {
          httpOnly: true,
          secure: isSecure,
          path: '/',
          maxAge: -1,
          sameSite: 'lax',
        }),
      ]);
      return res.status(401).json({ error: 'Sessão do criador expirada. Faça login novamente.' });
    }

    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }

    const creator = await prisma.user.findUnique({ where: { id: stashPayload.userId } });
    if (!creator || !creator.isCreator) {
      return res.status(403).json({ error: 'Acesso restrito ao criador.' });
    }

    const isPasswordValid = await bcrypt.compare(password, creator.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const currentToken = extractToken(req);
    const currentPayload = currentToken ? await verifyAuthToken(currentToken) : null;
    const effectiveUserId = currentPayload?.userId || null;

    await createLog(
      req,
      creator.id,
      'CREATOR_ACCESS_RESTORE',
      `Restaurou a sessão do criador${effectiveUserId ? ` (saindo de ${effectiveUserId})` : ''}`
    );

    res.setHeader('Set-Cookie', [
      serialize('auth_token', stashToken, {
        httpOnly: true,
        secure: isSecure,
        path: '/',
        // Renova até o `exp` do stash, não 8 h fixas: o stash foi verificado
        // acima, então este `maxAge` nunca ultrapassa a validade do token.
        maxAge: stashMaxAge(stashToken) ?? IMPERSONATION_TTL_SECONDS,
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
