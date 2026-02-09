// pages/api/users/update-theme.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const token = req.cookies["auth_token"];
    if (!token) return res.status(401).json({ error: "Não autorizado" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    const { theme } = req.body;

    // Validação básica do valor do tema
    if (!['LIGHT', 'DARK', 'SISTEM'].includes(theme)) {
      return res.status(400).json({ error: "Tema inválido" });
    }

    const updatedUser = await prisma.user.update({
      where: { email: decoded.email },
      data: { theme }
    });

    return res.status(200).json({ success: true, theme: updatedUser.theme });
  } catch (error) {
    console.error("Erro ao atualizar tema:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}