// pages/api/actives/create.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // Sincronizado com o nome definido no login.ts (auth_token)
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Sessão expirada. Token não encontrado." });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as any;

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Acesso negado para nível Viewer." });
    }

    const data = req.body;
    const quantity = Math.max(1, Number(data.quantity) || 1);
    const createdItems = [];

    for (let i = 0; i < quantity; i++) {
      const item = await prisma.active.create({
        data: {
          name: data.name,
          area: data.area,
          isPhysicalSpace: Boolean(data.isPhysicalSpace),
          sku: data.sku || null,
          manufacturer: data.manufacturer || null,
          model: data.model || null,
          serialNumber: data.serialNumbers?.[i] || null,
          fixedValue: Number(data.fixedValue) || 0,
          tag: data.tag || "IN-STOCK",
          notes: data.notes || null,
          fatherSpaceId: data.fatherSpaceId || null,
          parentId: data.parentId || null,
          createdById: decoded.userId,
        },
      });
      createdItems.push(item);
    }

    return res.status(201).json(createdItems);

  } catch (error: any) {
    if (error.name === "JsonWebTokenError") return res.status(401).json({ error: "Token inválido." });
    return res.status(500).json({ error: "Erro interno." });
  }
}