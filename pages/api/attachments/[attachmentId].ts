// pages/api/attachments/[attachmentId].ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";
import { deleteFileFromMinio } from "@/lib/minio";

/**
 * PATCH /api/attachments/[attachmentId]
 * Updates the alias of an existing attachment
 */
async function handlerPatch(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Método não permitido. Use PATCH." });

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const { attachmentId } = req.query;

    if (!attachmentId || typeof attachmentId !== "string") {
      return res.status(400).json({ error: "ID do anexo é obrigatório." });
    }

    // Verify the attachment exists
    const existingAttachment = await db.attachment.findUnique({
      where: { id: attachmentId },
      include: { active: true },
    });

    if (!existingAttachment) {
      return res.status(404).json({ error: "Anexo não encontrado." });
    }

    const data = req.body;
    const aliasProvided = "alias" in data;

    if (!aliasProvided) {
      return res.status(400).json({ error: "Campo 'alias' é obrigatório para atualização." });
    }

    const updatedAttachment = await db.attachment.update({
      where: { id: attachmentId },
      data: {
        alias: data.alias.trim(),
      },
    });

    return res.status(200).json(updatedAttachment);
  } catch (error: unknown) {
    console.error("❌ Erro na atualização de anexo:", error);

    if (error instanceof Error && error.message.includes("P2025")) {
      return res.status(404).json({ error: "Anexo não encontrado." });
    }

    if (error instanceof Error && error.message.includes("P2003")) {
      return res.status(400).json({
        error: "Falha de vínculo!",
        details: "O relacionamento com o ativo não é válido.",
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    return res.status(500).json({
      error: "Erro interno ao atualizar o anexo.",
      details: errorMessage,
    });
  }
}

/**
 * DELETE /api/attachments/[attachmentId]
 * Deletes an attachment from the database and MinIO
 */
async function handlerDelete(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Método não permitido. Use DELETE." });

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const { attachmentId } = req.query;

    if (!attachmentId || typeof attachmentId !== "string") {
      return res.status(400).json({ error: "ID do anexo é obrigatório." });
    }

    // Verify the attachment exists
    const existingAttachment = await db.attachment.findUnique({
      where: { id: attachmentId },
      include: { active: true },
    });

    if (!existingAttachment) {
      return res.status(404).json({ error: "Anexo não encontrado." });
    }

    // Delete from MinIO if it has a fileUrl
    if (existingAttachment.fileUrl) {
      try {
        await deleteFileFromMinio(existingAttachment.fileUrl);
      } catch (minioErr) {
        console.error("⚠️ Erro ao deletar do MinIO:", minioErr);
        // Continue with DB deletion even if MinIO fails
      }
    }

    // Delete from database
    await db.attachment.delete({
      where: { id: attachmentId },
    });

    return res.status(200).json({ success: true, message: "Anexo removido com sucesso." });
  } catch (error: unknown) {
    console.error("❌ Erro ao deletar anexo:", error);

    if (error instanceof Error && error.message.includes("P2025")) {
      return res.status(404).json({ error: "Anexo não encontrado." });
    }

    if (error instanceof Error && error.message.includes("P2003")) {
      return res.status(400).json({
        error: "Falha de vínculo!",
        details: "Não é possível excluir: o anexo está em uso.",
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    return res.status(500).json({
      error: "Erro interno ao excluir o anexo.",
      details: errorMessage,
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") return handlerPatch(req, res);
  if (req.method === "DELETE") return handlerDelete(req, res);
  return res.status(405).json({ error: "Método não permitido" });
}