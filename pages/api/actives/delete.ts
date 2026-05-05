// pages/api/actives/delete.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jose from "jose";
import { createLog } from "@/lib/logger";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Use DELETE." });

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });

    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { role: string; userId: string; [key: string]: unknown };
    const userId = String(decoded.id || decoded.userId);

    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Acesso negado." });

    const isBatch = Array.isArray(req.body.ids);
    const id = req.body.id;
    let ids: string[] | undefined = req.body.ids;
    
    if (isBatch) {
      ids = req.body.ids;
    } else {
      if (!id && !ids) return res.status(400).json({ error: "ID ou IDs obrigatório." });
      if (typeof id === "string") ids = [id];
    }

    if (!ids || (Array.isArray(ids) && ids.length === 0)) {
      return res.status(400).json({ error: "ID ou IDs obrigatório." });
    }

    const actives = await db.active.findMany({ 
      where: { id: { in: ids } },
      select: { id: true, name: true }
    });
    
    if (actives.length === 0) return res.status(404).json({ error: "Ativo(s) não encontrado(s)." });

    await db.active.deleteMany({ where: { id: { in: ids } } });

    const count = actives.length;
    await createLog(
      req,
      userId,
      "DELEÇÃO DE ATIVO",
      `Excluiu ${count} ativo${count > 1 ? 's' : ''}: ${actives.map(a => a.name).join(', ')}`
    );

    return res.status(200).json({ message: `${count} ativo${count > 1 ? 's' : ''} removido${count > 1 ? 's' : ''} com sucesso.` });

  } catch (error: unknown) {
    return res.status(500).json({ error: "Erro ao excluir ativo." });
  }
}