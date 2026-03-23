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

    const data = req.body;
    
    // Validações básicas para Ativo
    if (!data.name || !data.areaId) {
      return res.status(400).json({ error: "Nome e Área de Foco são obrigatórios." });
    }

    const quantity = Math.max(1, parseInt(data.quantity) || 1);
    const createdActives = [];

    // Loop para suportar a criação de múltiplos ativos (Quantidade)
    for (let i = 0; i < quantity; i++) {
      // Gerador de ID Único de 4 caracteres (padrão Hex) para o Ativo
      let finalId = "";
      let isUnique = false;
      while (!isUnique) {
        finalId = randomBytes(2).toString('hex').toUpperCase();
        const exists = await db.active.findUnique({ where: { id: finalId } });
        if (!exists) isUnique = true;
      }

      // Pega o serial correspondente ao índice ou deixa vazio
      const serialNumber = data.serialNumbers && data.serialNumbers[i] ? data.serialNumbers[i] : "";

      const newActive = await db.active.create({
        data: {
          id: finalId,
          name: data.name.trim(),
          areaId: data.areaId,
          tag: data.tag || "IN-STOCK",
          manufacturer: data.manufacturer || null,
          model: data.model || null,
          serialNumber: serialNumber,
          fixedValue: parseFloat(data.fixedValue) || 0,
          notes: data.notes || null,
          imageUrl: data.imageUrl || null,
          fileUrl: data.fileUrl || null,
          // Hierarquia: Pode estar dentro de um Espaço Pai ou de outro Ativo
          fatherSpaceId: data.fatherSpaceId || null,
          parentId: data.parentId || null,
          isPhysicalSpace: !!data.isPhysicalSpace,
          createdById: userId,
        },
      });
      createdActives.push(newActive);
    }

    // Auditoria (Registra o primeiro ou um resumo)
    await createLog(
      req,
      userId,
      "CREATE_ACTIVE",
      `Criou ${quantity} ativo(s): ${data.name} (Início ID: ${createdActives[0].id})`
    );

    return res.status(201).json(createdActives);

  } catch (error: any) {
    console.error("ERRO actives/create:", error.message);
    return res.status(500).json({ error: "Erro interno ao criar ativo.", details: error.message });
  }
}