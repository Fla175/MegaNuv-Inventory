// pages/api/users/update-theme.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import * as jose from "jose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const token = req.cookies["auth_token"];
    if (!token) return res.status(401).json({ error: "Não autorizado" });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { email: string };
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    return res.status(500).json({ error: message });
  }
}