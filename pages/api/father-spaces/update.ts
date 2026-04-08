// pages/api/father-spaces/update.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    const userId = decoded.id || decoded.userId;

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas admins editam espaços." });
    }

    const { id, name, notes, parentId } = req.body;
    if (!id) return res.status(400).json({ error: "ID obrigatório." });

    const updatedFatherSpace = await db.fatherSpace.update({
      where: { id },
      data: {
        name,
        notes,
        parentId
      },
    });

    await createLog(
      req,
      userId,
      "EDIÇÃO DE ESPAÇO PAI",
      `Editou o espaço pai: ${updatedFatherSpace.name} (ID: ${id})`
    );

    return res.status(200).json(updatedFatherSpace);

  } catch (error: any) {
    console.error("ERRO father-spaces/update:", error);
    return res.status(500).json({ error: "Erro ao atualizar o espaço pai." });
  }
}