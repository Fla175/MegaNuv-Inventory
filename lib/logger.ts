// lib/logger.ts
import prisma from "./prisma";
import { NextApiRequest } from "next";

/**
 * @param req - Objeto da requisição para extrair IP e UserAgent
 * @param userId - ID do usuário autenticado (viesse do JWT)
 * @param action - Nome da ação (ex: "CREATE_AREA", "UPDATE_ACTIVE")
 * @param details - Texto detalhando a mudança
 * @param metadata - Metadados opcionais (ex: { action: "enter", success: true, targetUserId: "u1" })
 */
export async function createLog(
  req: NextApiRequest,
  userId: string | null,
  action: string,
  details: string,
  metadata?: {
    action?: string | null;
    success?: boolean;
    targetUserId?: string | null;
  }
) {

  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    await prisma.log.create({
      data: {
        action,
        details,
        ip: Array.isArray(ip) ? ip[0] : (ip as string) || "Ip desconhecido",
        userAgent: userAgent || "Agente desconhecido",
        userId,
        ...(metadata && {
          success: metadata.success,
          targetUserId: metadata.targetUserId,
        }),
      },
    });
  } catch (err) {
    console.error(`Erro crítico de log: ${err}`);
  }
}