// pages/api/father-spaces/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import { createLog } from "@/lib/logger";
import { getSessionUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const userId = session.userId;

    if (session.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas admins editam espaços." });
    }

    const { id, name, notes, parentId, imageUrl, address, responsible, phone } = req.body;
    if (!id) return res.status(400).json({ error: "ID obrigatório." });

    const updatedFatherSpace = await db.fatherSpace.update({
      where: { id },
      data: {
        name,
        notes,
        parentId,
        imageUrl: imageUrl || null,
        address: address || null,
        responsible: responsible || null,
        phone: phone || null,
      },
    });

    await createLog(
      req,
      userId,
      "EDIÇÃO DE ESPAÇO PAI",
      `Editou o espaço pai: ${updatedFatherSpace.name} (ID: ${id})`
    );

    return res.status(200).json(updatedFatherSpace);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return res.status(500).json({ error: message || "Erro ao atualizar o espaço pai." });
  }
}