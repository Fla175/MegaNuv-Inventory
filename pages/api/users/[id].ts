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
    const isViewer = requester.role === "VIEWER";
    const targetIsAdmin = targetUser.role === "ADMIN";

    if (req.method === "DELETE") {
      // ADMIN: pode excluir qualquer um (exceto si mesmo se for o único admin)
      // MANAGER: pode excluir VIEWER e MANAGER, mas NÃO pode excluir ADMIN
      // VIEWER: não pode excluir ninguém
      // Owner: pode excluir a si mesmo
      if (isViewer) {
        return res.status(403).json({ message: "Visualizadores não podem excluir usuários." });
      }
      if (isManager && targetIsAdmin) {
        return res.status(403).json({ message: "Gerentes não podem excluir administradores." });
      }
      if (!isOwner && !isAdmin && !isManager) {
        return res.status(403).json({ message: "Você não tem permissão para excluir este usuário." });
      }

      await prisma.user.delete({ where: { id: String(id) } });
      return res.status(200).json({ message: "Excluído com sucesso" });
    }

    if (req.method === "PATCH") {
      // ADMIN: pode editar qualquer um
      // MANAGER: pode editar si mesmo e VIEWER, mas NÃO pode editar ADMIN
      // VIEWER: pode editar apenas si mesmo (nome, senha)
      if (isViewer && !isOwner) {
        return res.status(403).json({ message: "Visualizadores não podem editar outros usuários." });
      }
      if (isManager && targetIsAdmin) {
        return res.status(403).json({ message: "Gerentes não podem editar administradores." });
      }
      if (!isOwner && !isAdmin && !isManager) {
        return res.status(403).json({ message: "Você não tem permissão para editar este usuário." });
      }

      const { name, email, role, password } = req.body;

      // ADMIN pode alterar role; MANAGER/VIEWER não podem
      let finalRole = targetUser.role;
      if (isAdmin && role) {
        finalRole = role;
      }
      
      // MANAGER não pode promover VIEWER para MANAGER ou ADMIN
      if (isManager && role && (role === 'ADMIN' || role === 'MANAGER')) {
        return res.status(403).json({ message: "Gerentes não podem promover usuários." });
      }

      const hashedPassword = password ? await bcrypt.hash(password, saltRounds) : undefined;

      const updated = await prisma.user.update({
        where: { id: String(id) },
        data: { 
          name, 
          email, 
          role: finalRole, 
          ...(hashedPassword ? { password: hashedPassword } : {})
        }
      });
      return res.status(200).json(updated);
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return res.status(500).json({ message: "Erro interno", error: message });
  }
}