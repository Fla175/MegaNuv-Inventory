// pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import * as jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies["auth_token"];

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    // 1. Decodificamos o token para saber QUEM é o usuário (pelo email)
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { email: string };

    if (!decoded.email) {
      throw new Error("Token sem email");
    }

    // 2. BUSCA NO BANCO
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        theme: true,
        defaultSort:true,
        lastLogin: true,
        createdAt: true,
        // Não incluímos o password por segurança
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado no banco" });
    }

    // 3. Retornamos o objeto 'user' completo que veio do Prisma
    return res.status(200).json({ user });

  } catch (err) {
    console.error("Erro ao verificar token ou buscar no banco:", err);
    return res.status(401).json({ message: "Sessão inválida" });
  }
}
