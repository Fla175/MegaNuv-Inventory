// pages/api/users/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';

const saltRounds = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const token = req.cookies["auth_token"];
  
  if (!token) return res.status(401).json({ message: "Não autorizado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
    const requester = await prisma.user.findUnique({ where: { email: decoded.email } });
    
    if (!requester) return res.status(401).json({ message: "Usuário não encontrado" });

    const targetUser = await prisma.user.findUnique({ where: { id: String(id) } });
    if (!targetUser) return res.status(404).json({ message: "Usuário alvo não encontrado" });

    const isOwner = requester.id === targetUser.id;
    const isAdmin = requester.role === "ADMIN";
    const isManager = requester.role === "MANAGER";
    const targetIsViewer = targetUser.role === "VIEWER";

    if (req.method === "DELETE") {
      const canDelete = isOwner || isAdmin || (isManager && targetIsViewer);

      if (!canDelete) {
        return res.status(403).json({ 
          message: "Você não tem permissão para excluir este nível de usuário." 
        });
      }

      await prisma.user.delete({ where: { id: String(id) } });
      return res.status(200).json({ message: "Excluído com sucesso" });
    }

    if (req.method === "PATCH") {
      const canEdit = isOwner || isAdmin || (isManager && targetIsViewer);
      
      if (!canEdit) return res.status(403).json({ message: "Sem permissão para editar" });

      const { name, email, role, password } = req.body;

      const finalRole = isAdmin ? role : targetUser.role;

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const updated = await prisma.user.update({
        where: { id: String(id) },
        data: { name, email, role: finalRole, password: hashedPassword }
      });
      return res.status(200).json(updated);
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return res.status(500).json({ message: "Erro interno", error: message });
  }
}