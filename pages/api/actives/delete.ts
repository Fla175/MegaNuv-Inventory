// pages/api/actives/delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jose from "jose";
import { createLog } from "@/lib/logger";
import { deleteFileFromMinio } from "@/lib/minio";

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
    
    if (!isBatch) {
      if (!id && !ids) return res.status(400).json({ error: "ID ou IDs obrigatório." });
      if (typeof id === "string") ids = [id];
    }

    if (!ids || (Array.isArray(ids) && ids.length === 0)) {
      return res.status(400).json({ error: "ID ou IDs obrigatório." });
    }

    const actives = await db.active.findMany({ 
      where: { id: { in: ids } },
      select: { id: true, name: true, imageUrl: true }
    });
    
    if (actives.length === 0) return res.status(404).json({ error: "Ativo(s) não encontrado(s)." });

    // EXECUÇÃO EM TRANSAÇÃO
    await db.$transaction(async (tx) => {
      // 1. Remove o vínculo parentId de qualquer ativo filho apontando para os IDs que serão deletados
      await tx.active.updateMany({
        where: { parentId: { in: ids } },
        data: { parentId: null }
      });

      // 2. Remove os registros dos ativos
      await tx.active.deleteMany({
        where: { id: { in: ids } }
      });
    });

    // 3. Remove os arquivos do MinIO após garantir a deleção do banco
    for (const active of actives) {
      if (active.imageUrl) {
        try {
          await deleteFileFromMinio(active.imageUrl);
        } catch (minioErr) {
          console.error(`Erro ao deletar imagem no MinIO (${active.imageUrl}):`, minioErr);
        }
      }
    }

    const count = actives.length;
    await createLog(
      req,
      userId,
      "DELEÇÃO DE ATIVO",
      `Excluiu ${count} ativo${count > 1 ? 's' : ''}: ${actives.map(a => a.name).join(', ')}`
    );

    return res.status(200).json({ message: `${count} ativo${count > 1 ? 's' : ''} removido${count > 1 ? 's' : ''} com sucesso.` });

  } catch (error) {
    console.error("❌ Erro ao deletar ativo:", error);
    return res.status(500).json({ error: "Erro ao excluir ativo." });
  }
}