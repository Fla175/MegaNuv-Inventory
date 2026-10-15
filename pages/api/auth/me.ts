// pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import * as jose from "jose";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getSessionUser(req);

  if (!session) {
    return res.status(401).json({ message: "Sessão expirada ou não autenticado." });
  }

  try {
    if (!session.email) {
      return res.status(401).json({ message: "Token inválido ou corrompido." });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        theme: true,
        isCreator: true,
        lastLogin: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    let impersonation = null;
    const stashSecret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
    const stashToken = req.cookies["auth_token_creator"];
    if (stashToken) {
      try {
        const { payload: stashPayload } = await jose.jwtVerify(stashToken, stashSecret);
        if (stashPayload && typeof stashPayload === "object") {
          impersonation = {
            active: true,
            creatorName: (stashPayload.name as string) || (stashPayload.email as string) || "Criador",
          };
        }
      } catch {
        // Stash token inválido ou expirado - mantém impersonation null
      }
    }

    return res.status(200).json({ user, impersonation });

  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      return res.status(401).json({ message: "Sessão expirada. Faça login novamente." });
    }
    return res.status(401).json({ message: "Acesso negado." });
  }
}