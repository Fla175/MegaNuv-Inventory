// pages/api/father-spaces/delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import { createLog } from "@/lib/logger";
import { deleteFileFromMinio } from "@/lib/minio";
import { getSessionUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Use DELETE." });

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const userId = session.userId;

    if (session.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado. Apenas admins excluem espaços." });
    }

    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ error: "ID inválido." });

    const space = await db.fatherSpace.findUnique({ where: { id } });
    if (!space) return res.status(404).json({ error: "Espaço não encontrado." });

    const activesToDelete = await db.active.findMany({
      where: { fatherSpaceId: id },
      select: { imageUrl: true } 
    });

    for (const active of activesToDelete) {
      if (active.imageUrl) {
        await deleteFileFromMinio(active.imageUrl);
      }
    }

    if ((space).imageUrl) { 
      await deleteFileFromMinio((space).imageUrl);
    }

    await db.active.deleteMany({
      where: { fatherSpaceId: id }
    });

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

  } catch {
    return res.status(500).json({ error: "Erro ao excluir. Verifique se há ativos vinculados a este espaço." });
  }
}