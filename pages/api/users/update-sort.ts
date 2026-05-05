// pages/api/users/update-sort.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import * as jose from "jose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido" });

  const token = req.cookies["auth_token"];
  if (!token) return res.status(401).json({ message: "Não autorizado" });

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { email: string; [key: string]: unknown };
    const { defaultSort } = req.body;

    if (!defaultSort) {
      return res.status(400).json({ message: "O campo defaultSort é obrigatório" });
    }

    const updatedUser = await prisma.user.update({
      where: { email: decoded.email },
      data: { defaultSort },
    });

    return res.status(200).json({ 
      success: true, 
      defaultSort: updatedUser.defaultSort 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return res.status(500).json({
      message: "Erro ao salvar preferência de ordenação",
      error: message
    });
  }
}