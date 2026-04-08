// lib/logger.ts
import { PrismaClient } from "@prisma/client";
import { NextApiRequest } from "next";

const prisma = new PrismaClient();

/**
 * Registra uma ação no banco de dados para auditoria.
 * @param req - Objeto da requisição para extrair IP e UserAgent
 * @param userId - ID do usuário autenticado (viesse do JWT)
 * @param action - Nome da ação (ex: "CREATE_AREA", "UPDATE_ACTIVE")
 * @param details - Texto detalhando a mudança
 */
export async function createLog(
  req: NextApiRequest,
  userId: string | null,
  action: string,
  details: string
) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    await prisma.log.create({
      data: {
        action,
        details,
        ip: Array.isArray(ip) ? ip[0] : (ip as string) || "IP_UNKNOWN",
        userAgent: userAgent || "AGENT_UNKNOWN",
        userId,
      },
    });
  } catch (error) {
    // Falha silenciosa no banco de logs para não travar a operação principal
    console.error("CRITICAL_LOG_ERROR:", error);
  }
}