// pages/api/users/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";
import { canActOnUser, canAssignRole, isUserRole } from "@/lib/rbac";
import bcrypt from 'bcryptjs';

const saltRounds = 10;

/** Fields safe to return; the hash must never leave the server. */
const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  lastLogin: true,
  createdAt: true,
} as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const session = await getSessionUser(req);

  if (!session) return res.status(401).json({ message: "Não autorizado" });

  try {
    const requester = await prisma.user.findUnique({
      where: { email: session.email },
      select: { id: true, role: true, isCreator: true },
    });

    if (!requester) return res.status(401).json({ message: "Usuário não encontrado" });

    const targetUser = await prisma.user.findUnique({ where: { id: String(id) } });
    if (!targetUser) return res.status(404).json({ message: "Usuário alvo não encontrado" });

    const isOwner = requester.id === targetUser.id;

    if (req.method === "DELETE") {
      // The matrix is about the target's current role: a MANAGER may delete a
      // VIEWER, an ADMIN may delete anyone but a DIRECTOR, and the DIRECTOR
      // may delete anyone. Self-deletion is not exposed by the UI.
      if (!canActOnUser(requester, targetUser.role)) {
        return res.status(403).json({ message: "Você não tem permissão para excluir este usuário." });
      }

      await prisma.user.delete({ where: { id: String(id) } });
      return res.status(200).json({ message: "Excluído com sucesso" });
    }

    if (req.method === "PATCH") {
      // Everyone may edit their own profile (name/password); editing someone
      // else follows the same rule as deletion.
      if (!isOwner && !canActOnUser(requester, targetUser.role)) {
        return res.status(403).json({ message: "Você não tem permissão para editar este usuário." });
      }

      const { name, email, role, password } = req.body;

      let finalRole = targetUser.role;

      if (role !== undefined && role !== null && role !== "") {
        if (!isUserRole(role)) {
          return res.status(400).json({ message: "Papel inválido." });
        }

        if (role !== targetUser.role) {
          // Changing your own role can lock the last administrator out; the
          // UI does not expose it (self is not in the list).
          if (isOwner) {
            return res.status(403).json({ message: "Você não pode alterar o seu próprio papel." });
          }

          const directorExists =
            role === "DIRECTOR"
              ? (await prisma.user.findFirst({
                  where: { role: "DIRECTOR" },
                  select: { id: true },
                })) !== null
              : false;

          if (!canAssignRole(requester, role, { directorExists })) {
            return res.status(403).json({
              message: "Você não tem permissão para atribuir este papel.",
            });
          }

          finalRole = role;
        }
      }

      const hashedPassword = password ? await bcrypt.hash(password, saltRounds) : undefined;

      const updated = await prisma.user.update({
        where: { id: String(id) },
        data: {
          name,
          email,
          role: finalRole,
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
        select: PUBLIC_USER_FIELDS,
      });
      return res.status(200).json(updated);
    }

    res.setHeader("Allow", ["PATCH", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return res.status(500).json({ message: "Erro interno", error: message });
  }
}
