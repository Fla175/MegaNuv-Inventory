// pages/api/actives/move.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end();

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { role: string; userId: string; [key: string]: unknown };

    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Negado" });

    const isBatch = Array.isArray(req.body.ids);
    const { id, ids, newFatherSpaceId, newParentId } = req.body;

    if (!newFatherSpaceId) return res.status(400).json({ error: "Espaço físico de destino é obrigatório" });
    if (id === newParentId) return res.status(400).json({ error: "Loop hierárquico proibido" });

    let results;
    if (isBatch) {
      if (ids.includes(newParentId)) return res.status(400).json({ error: "Loop hierárquico proibido" });
      
      results = await db.active.updateMany({
        where: { id: { in: ids } },
        data: {
          fatherSpaceId: newFatherSpaceId,
          parentId: newParentId || null,
        },
      });
    } else {
      const moved = await db.active.update({
        where: { id },
        data: {
          fatherSpaceId: newFatherSpaceId,
          parentId: newParentId || null,
        },
      });
      results = { count: 1, moved };
    }

    return res.status(200).json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha na movimentação';
    return res.status(500).json({ error: message });
  }
}