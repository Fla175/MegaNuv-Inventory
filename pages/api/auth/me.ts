// pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import * as jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.cookies["auth_token"] || req.headers.authorization?.replace("Bearer ", "");

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Sessão expirada ou não autenticado." });
  }

  try {
    // Decodifica garantindo os tipos que setamos no login
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { email: string, userId: string };

    if (!decoded.email) {
      return res.status(401).json({ message: "Token inválido ou corrompido." });
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        theme: true,
        defaultSort: true,
        lastLogin: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json({ user });

  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Sessão expirada. Faça login novamente." });
    }
    console.error("Erro na validação do token /me:", err);
    return res.status(401).json({ message: "Acesso negado." });
  }
}