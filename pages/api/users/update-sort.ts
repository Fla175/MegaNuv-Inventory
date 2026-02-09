// pages/api/users/update-sort.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido" });

  const token = req.cookies["auth_token"];
  if (!token) return res.status(401).json({ message: "Não autorizado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
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
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      message: "Erro ao salvar preferência de ordenação",
      error: error.message
    });
  }
}