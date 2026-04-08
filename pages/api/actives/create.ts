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
    const userId = decoded.id || decoded.userId;

    const data = req.body;
    
    // Validação de integridade do Schema
    if (!data.name || !data.categoryId || !data.fatherSpaceId) {
      return res.status(400).json({ error: "Nome, Categoria e Espaço Pai são obrigatórios." });
    }

    const quantity = Math.max(1, parseInt(data.quantity) || 1);
    const createdActives = [];

    for (let i = 0; i < quantity; i++) {
      let finalId = "";
      let isUnique = false;
      
      // Garantia de ID manual único (4 hex chars)
      while (!isUnique) {
        finalId = randomBytes(2).toString('hex').toLowerCase();
        const exists = await db.active.findUnique({ where: { id: finalId } });
        if (!exists) isUnique = true;
      }

      const serialNumber = data.serialNumbers?.[i] || "";

      const newActive = await db.active.create({
        data: {
          id: finalId,
          name: data.name.trim(),
          categoryId: data.categoryId,
          tag: data.tag || "IN-STOCK",
          manufacturer: data.manufacturer || null,
          model: data.model || null,
          serialNumber: serialNumber,
          fixedValue: parseFloat(data.fixedValue) || 0,
          notes: data.notes || null,
          imageUrl: data.imageUrl || null,
          fileUrl: data.fileUrl || null,
          fatherSpaceId: data.fatherSpaceId, // Obrigatório
          parentId: data.parentId || null,   // Opcional (Hierarquia)
          isPhysicalSpace: !!data.isPhysicalSpace,
          createdById: userId,
        },
      });
      createdActives.push(newActive);
    }

    await createLog(req, userId, "CREATE_ACTIVE", `Criou ${quantity} ativo(s): ${data.name}`);

    return res.status(201).json(createdActives);
  } catch (error: any) {
    console.error("ERRO actives/create:", error.message);
    return res.status(500).json({ error: "Erro interno ao criar ativo." });
  }
}