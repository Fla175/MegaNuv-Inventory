// pages/api/auth/seed.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: Verifica se o sistema precisa de configuração inicial
    if (req.method === "GET") {
      const user = await prisma.user.findFirst();

      if (user) {
        return res.status(200).json({ redirectTo: "/login", isConfigured: true });
      } else {
        return res.status(200).json({ redirectTo: "/initial-setup/register", isConfigured: false });
      }
    }

    // POST: Cria o primeiro usuário (Admin master)
    if (req.method === "POST") {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
      }

      // Trava de segurança: Garante que só funcione se a base estiver realmente vazia
      const count = await prisma.user.count();
      if (count > 0) {
         return res.status(403).json({ message: "O sistema já possui usuários. Seed bloqueado." });
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

      // SISTEMA DE LOGS: Registro de inicialização do sistema
      await prisma.log.create({
        data: {
          action: "SYSTEM_INITIALIZED",
          details: `Sistema iniciado. Admin master criado: ${email}.`,
          userId: newUser.id,
          ip: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || "Desconhecido",
          userAgent: req.headers['user-agent'] || "Desconhecido"
        }
      });

      return res.status(201).json({
        message: "Administrador inicial criado com sucesso!",
        user: { id: newUser.id, email: newUser.email },
        redirectTo: "/login",
      });
    }

    return res.status(405).json({ message: "Método não permitido." });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno no servidor.';
    return res.status(500).json({ message });
  }
}