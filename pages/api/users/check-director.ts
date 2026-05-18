// pages/api/users/check-director.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const existingDirector = await prisma.user.findFirst({
      where: { role: "DIRECTOR" },
    });

    return res.status(200).json({ exists: !!existingDirector });
  } catch {
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}