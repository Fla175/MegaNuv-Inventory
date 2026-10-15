// pages/api/users/check-director.ts
import { NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { authMiddleware, AuthenticatedNextApiRequest } from "@/lib/middlewares/authMiddleware";

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
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
};

export default authMiddleware(handler);
