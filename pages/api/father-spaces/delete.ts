// pages/api/father-spaces/delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import { createLog } from "@/lib/logger";
import { deleteFileFromMinio } from "@/lib/minio";
import { getSessionUser } from "@/lib/apiAuth";
import { collectSpaceSubtreeIds } from "@/lib/spaceTree";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Etapa 2 da ADR-001 (2.5): `GET` é a prévia da cascata — a mesma rota, o
  // mesmo gate e a mesma subárvore do `DELETE`, para que o aviso da tela não
  // possa divergir da exclusão real.
  if (req.method !== "DELETE" && req.method !== "GET") {
    return res.status(405).json({ error: "Use GET (prévia) ou DELETE." });
  }

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

    // A subárvore inclui o próprio espaço e os filhos (cascade de FatherSpace
    // em `parentId`) — e os ativos de todos eles, já que `Active.fatherSpace`
    // não é cascade: sem apagá-los explicitamente, a exclusão de qualquer
    // espaço-filho com ativo morria em Restrict e caía no 500 genérico.
    const spaces = await db.fatherSpace.findMany({
      select: { id: true, parentId: true },
    });
    const subtreeIds = collectSpaceSubtreeIds(spaces, id);

    if (req.method === "GET") {
      const actives = await db.active.count({
        where: { fatherSpaceId: { in: subtreeIds } },
      });

      return res.status(200).json({
        spaceId: id,
        spaceName: space.name,
        spaces: subtreeIds.length,
        actives,
      });
    }

    const activesToDelete = await db.active.findMany({
      where: { fatherSpaceId: { in: subtreeIds } },
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

    // Ativos diretos de todos os espaços da subárvore. Os ativos aninhados por
    // `parentId` são removidos pelo cascade da auto-relação de `Active`.
    const { count: deletedActives } = await db.active.deleteMany({
      where: { fatherSpaceId: { in: subtreeIds } }
    });

    // Remove o espaço pai; os filhos caem pelo cascade de `FatherSpace`.
    await db.fatherSpace.delete({ where: { id } });

    await createLog(
      req,
      userId,
      "DELEÇÃO DE ESPAÇO PAI",
      `Removeu o espaço pai: ${space.name} (ID: ${id}) — ${deletedActives} ativo(s) em ${subtreeIds.length} espaço(s).`
    );

    return res.status(200).json({ message: "Espaço excluído com sucesso." });

  } catch {
    return res.status(500).json({ error: "Erro ao excluir. Verifique se há ativos vinculados a este espaço." });
  }
}
