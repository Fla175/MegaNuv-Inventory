// pages/api/actives/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import * as jose from "jose";
import { randomBytes } from "crypto";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

async function checkExistingSerialNumbers(serialNumbers: string[]): Promise<string[]> {
  const validSerials = serialNumbers
    .map((sn) => sn?.trim())
    .filter((sn) => sn && sn !== "");

  if (validSerials.length === 0) return [];

  const existingActives = await db.active.findMany({
    where: {
      serialNumber: {
        in: validSerials,
      },
    },
    select: {
      serialNumber: true,
    },
  });

  return existingActives
    .map((active) => active.serialNumber)
    .filter((sn): sn is string => sn !== null);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { role: string; id?: string; userId?: string; sub?: string; [key: string]: unknown };
    
    const userId = decoded.id || decoded.userId || decoded.sub;

    if (!userId || userId === "undefined") {
      return res.status(401).json({ error: "Usuário não identificado no token de autenticação." });
    }

    if (decoded.role === "VIEWER") {
      return res.status(403).json({ error: "Visualizadores não podem criar ativos." });
    }

    const data = req.body;
    const isPhysicalSpace = !!data.isPhysicalSpace;
    
    if (!data.name || !data.fatherSpaceId || (!isPhysicalSpace && !data.categoryId)) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes (Nome, Espaço Pai ou Categoria)." });
    }

    const serialNumbersToCheck = Array.isArray(data.serialNumbers) ? data.serialNumbers : [];
    if (serialNumbersToCheck.length > 0) {
      const conflictingSerials = await checkExistingSerialNumbers(serialNumbersToCheck);
      
      if (conflictingSerials.length > 0) {
        return res.status(409).json({
          error: "Número de série já cadastrado.",
          details: `Os seguintes números de série já estão em uso no sistema: ${conflictingSerials.join(", ")}`
        });
      }
    }

    const quantity = Math.max(1, parseInt(data.quantity) || 1);
    const createdActives = [];

    let normalizedFileUrl = data.fileUrl;
    if (Array.isArray(data.fileUrl)) {
      normalizedFileUrl = data.fileUrl.length > 0 ? data.fileUrl.join(",") : null;
    }

    for (let i = 0; i < quantity; i++) {
      let finalId = "";
      let isUnique = false;
      
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
          sku: data.sku || null,
          tag: data.tag || "IN-STOCK",
          manufacturer: data.manufacturer || null,
          model: data.model || null,
          serialNumber: serialNumber.trim() || null,
          fixedValue: parseFloat(data.fixedValue) || 0,
          notes: data.notes || null,
          imageUrl: data.imageUrl || null,
          fileUrl: normalizedFileUrl || null, 
          fatherSpaceId: data.fatherSpaceId, 
          parentId: data.parentId || null,   
          isPhysicalSpace: isPhysicalSpace,
          createdById: String(userId),
        },
      });
      createdActives.push(newActive);
    }

    await createLog(req, String(userId), "CRIAÇÃO DE ATIVO", `Criou ${quantity} ativo(s): ${data.name}`);
    return res.status(201).json(createdActives);

  } catch (error: unknown) {
    console.error("❌ Erro na criação de ativo:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({ 
          error: "Dados duplicados!", 
          details: `Já existe um ativo usando o mesmo SKU ou Número de Série (${error.meta?.target || 'campo único'}).` 
        });
      }
      if (error.code === "P2003") {
        return res.status(400).json({ 
          error: "Falha de vínculo (Chave Estrangeira)!", 
          details: "O Espaço Pai ou a Categoria informada não existem ou foram removidos." 
        });
      }
    };

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no banco de dados.";

    return res.status(500).json({ 
      error: "Erro interno no servidor ao salvar ativo.", 
      details: errorMessage
    });
  }
}