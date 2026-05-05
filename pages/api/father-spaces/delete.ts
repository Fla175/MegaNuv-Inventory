// pages/api/father-spaces/delete.ts
// pages/api/father-spaces/delete.ts
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
    const decoded = payload as { role: string; userId?: string; id?: string; [key: string]: unknown };
    const userId = (decoded.id || decoded.userId) ?? null;

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas admins excluem espaços." });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "ID inválido." });

    // Busca o nome para o log antes de apagar
    const space = await db.fatherSpace.findUnique({ where: { id } });
    if (!space) return res.status(404).json({ error: "Espaço não encontrado." });

    // Deleção em cascata: remove todos os ativos pertencentes a este espaço pai
    await db.active.deleteMany({
      where: { fatherSpaceId: id }
    });

    // Remove também todos os espaços físicos (ativos com isPhysicalSpace) deste espaço pai
    await db.active.deleteMany({
      where: {
        isPhysicalSpace: true,
        fatherSpaceId: id,
      }
    });

    await db.fatherSpace.delete({ where: { id } });

    await createLog(
      req,
      userId,
      "DELEÇÃO DE ESPAÇO PAI",
      `Removeu o espaço pai: ${space.name} (ID: ${id})`
    );

    return res.status(200).json({ message: "Espaço excluído com sucesso." });

  } catch (error: unknown) {
    return res.status(500).json({ error: "Erro ao excluir. Verifique se há ativos vinculados a este espaço." });
  }
}