// pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies["auth_token"];

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { name?: string; email?: string };
    return res.status(200).json({
      user: {
        name: decoded.name || "Usuário",
        email: decoded.email || undefined,
      },
    });
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    return res.status(401).json({ message: "Token inválido" });
  }
}
