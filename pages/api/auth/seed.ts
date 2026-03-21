// pages/api/auth/seed.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Apenas aceita GET (para verificação)
    if (req.method === "GET") {
      const user = await prisma.user.findFirst();

      if (user) {
        // Já existe um usuário → manda pro login
        return res.status(200).json({ redirectTo: "/login" });
      } else {
        // Não há usuário → manda pro signup
        return res.status(200).json({ redirectTo: "/initial-setup/register" });
      }
    }

    // POST → cria o usuário inicial (admin)
    if (req.method === "POST") {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: "Usuário já existe." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || "Administrador",
          role: "ADMIN",
        },
      });

      return res.status(201).json({
        message: "Usuário inicial criado com sucesso!",
        user: { id: newUser.id, email: newUser.email },
        redirectTo: "/login",
      });
    }

    return res.status(405).json({ message: "Método não permitido." });

  } catch (error) {
    console.error("Erro ao consultar/criar usuários:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
}
