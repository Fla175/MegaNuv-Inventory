// pages/api/actives/move.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end();

  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token!, JWT_SECRET!) as any;

    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Negado" });

    const { id, newFatherSpaceId, newParentId } = req.body;

    if (id === newParentId) return res.status(400).json({ error: "Loop hierárquico proibido" });

    const moved = await db.active.update({
      where: { id },
      data: {
        fatherSpaceId: newFatherSpaceId,
        parentId: newParentId || null, // Se for vazio/null, remove da hierarquia
      },
    });

    return res.status(200).json(moved);
  } catch (error) {
     error = "Falha na movimentação";
    return res.status(500).json({ error:error });
  }
}