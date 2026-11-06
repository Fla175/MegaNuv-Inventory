import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";

/**
 * GET /api/actives/[activeId]/attachments
 * List all attachments with aliases for an active
 * Also includes the active's existing fileUrl for backward compatibility
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return handlerGet(req, res);
  }
  if (req.method === "POST") {
    return handlerPost(req, res);
  }
  return res.status(405).json({ error: "Método não permitido" });
}

async function handlerGet(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const { activeId } = req.query;

    if (!activeId || typeof activeId !== "string") {
      return res.status(400).json({ error: "ID do ativo é obrigatório." });
    }

    // Verify the active exists
    const active = await db.active.findUnique({
      where: { id: activeId },
    });

    if (!active) {
      return res.status(404).json({ error: "Ativo não encontrado." });
    }

    const attachments = await db.attachment.findMany({
      where: { activeId },
      orderBy: { createdAt: "desc" },
    });

    // Also include the active's existing fileUrl for backward compatibility
    return res.status(200).json({
      activeId: active.id,
      activeName: active.name,
      fileUrl: active.fileUrl,
      attachments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao listar anexos";
    return res.status(500).json({ error: message });
  }
}

async function handlerPost(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const userId = session.userId;

    if (!userId || userId === "undefined") {
      return res.status(401).json({ error: "Usuário não identificado no token de autenticação." });
    }

    if (session.role === "VIEWER") {
      return res.status(403).json({ error: "Visualizadores não podem criar anexos." });
    }

    const data = req.body;

    if (!data.alias || !data.fileUrl) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes (alias, fileUrl)." });
    }

    // Normalize fileUrl: if it's an array, join as CSV
    let normalizedFileUrl = data.fileUrl;
    if (Array.isArray(data.fileUrl)) {
      normalizedFileUrl =
        data.fileUrl.length > 0 ? data.fileUrl.join(",") : null;
    }

    const { activeId } = req.query;
    if (!activeId || typeof activeId !== "string") {
      return res.status(400).json({ error: "ID do ativo é obrigatório." });
    }

    const newAttachment = await db.attachment.create({
      data: {
        alias: data.alias.trim(),
        fileUrl: normalizedFileUrl || null,
        activeId,
      },
    });

    return res.status(201).json(newAttachment);
  } catch (error: unknown) {
    console.error("❌ Erro na criação de anexo:", error);

    if (error instanceof Error && error.message.includes("P2003")) {
      return res.status(400).json({
        error: "Falha de vínculo!",
        details: "O ID do ativo informado não existe.",
      });
    }

    if (error instanceof Error && error.message.includes("P2002")) {
      return res.status(409).json({
        error: "Dados duplicados!",
        details: "Já existe um anexo com esse alias para este ativo.",
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido no banco de dados.";

    return res.status(500).json({
      error: "Erro interno no servidor ao salvar anexo.",
      details: errorMessage,
    });
  }
}