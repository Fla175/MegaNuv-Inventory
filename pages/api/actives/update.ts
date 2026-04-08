// pages/api/actives/update.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jwt from "jsonwebtoken";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "PATCH") return res.status(405).end();

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Não autorizado" });

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Acesso negado" });

    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "ID obrigatório" });

    const updated = await db.active.update({
      where: { id },
      data: {
        name: data.name,
        categoryId: data.categoryId, // Uso direto de ID para FK
        sku: data.sku,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        fixedValue: data.fixedValue !== undefined ? Number(data.fixedValue) : undefined,
        tag: data.tag,
        notes: data.notes,
        fatherSpaceId: data.fatherSpaceId,
        parentId: data.parentId || null,
      },
    });

    await createLog(req, decoded.id, "UPDATE_ACTIVE", `Editou ativo ${id}`);
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}