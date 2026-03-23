// pages/api/actives/create.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    const userId = decoded.id || decoded.userId || decoded.sub;

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores criam espaços pai." });
    }

    const data = req.body;
    
    if (!data.name || data.name.trim().length < 2) {
      return res.status(400).json({ error: "O nome do espaço é obrigatório e deve ter ao menos 2 caracteres." });
    }

    // Lógica de ID único baseada no seu actives/create
    let finalId = "";
    let isUnique = false;
    while (!isUnique) {
      finalId = randomBytes(2).toString('hex').toUpperCase();
      const exists = await db.fatherSpace.findUnique({ where: { id: finalId } });
      if (!exists) isUnique = true;
    }

    const newSpace = await db.fatherSpace.create({
      data: {
        id: finalId, // Passando o ID manualmente para satisfazer o TS e seguir seu padrão
        name: data.name.trim(),
        notes: data.notes || null,
        parentId: data.parentId || null,
        createdById: userId,
      },
    });

    // Auditoria
    await createLog(
      req,
      userId,
      "CREATE_SPACE",
      `Criou o espaço pai: ${data.name} (ID: ${finalId})`
    );

    return res.status(201).json(newSpace);

  } catch (error: any) {
    console.error("ERRO father-spaces/create:", error.message);
    if (error.code === 'P2002') return res.status(409).json({ error: "Já existe um espaço com este nome." });
    return res.status(500).json({ error: "Erro interno.", details: error.message });
  }
}