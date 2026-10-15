// pages/api/father-spaces/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import { randomBytes } from "crypto";
import { createLog } from "@/lib/logger";
import { getSessionUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const userId = session.userId;

    if (session.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas admins criam espaços pai." });
    }

    const { name, notes, parentId, imageUrl, address, responsible, phone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Nome muito curto." });
    }

    // SENSO COMUM: Gerar o ID manualmente para evitar erro de tipagem e garantir unicidade
    let finalId = "";
    let isUnique = false;
    while (!isUnique) {
      finalId = randomBytes(2).toString('hex').toUpperCase();
      const exists = await db.fatherSpace.findUnique({ where: { id: finalId } });
      if (!exists) isUnique = true;
    }

    const newSpace = await db.fatherSpace.create({
      data: {
        id: finalId, // Enviando o ID explicitamente
        name: name.trim(),
        notes: notes || null,
        parentId: parentId || null,
        createdById: userId,
        imageUrl: imageUrl || null,
        address: address || null,
        responsible: responsible || null,
        phone: phone || null,
      }
    });

    await createLog(
      req,
      userId,
      "CRIAÇÃO DE ESPAÇO PAI",
      `Criou o espaço pai: ${name} (ID: ${finalId})`
    );

    return res.status(201).json(newSpace);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return res.status(500).json({ error: "Erro interno.", details: message });
  }
}