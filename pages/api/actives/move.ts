// pages/api/actives/move.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma"; 
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).end();

  try {
    // 1. Verificação e Autenticação do Token JWT
    const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Sessão expirada." });
    
    const secret = new TextEncoder().encode(JWT_SECRET!);
    const { payload } = await jose.jwtVerify(token, secret);
    const decoded = payload as { role: string; userId: string; [key: string]: unknown };

    // 2. Validação de nível de acesso (Role)
    if (decoded.role === "VIEWER") return res.status(403).json({ error: "Negado" });

    const isBatch = Array.isArray(req.body.ids);
    const { id, ids, newFatherSpaceId, newParentId } = req.body;

    // 3. Validações de consistência dos parâmetros de entrada
    if (!newFatherSpaceId) return res.status(400).json({ error: "Espaço físico de destino é obrigatório" });
    if (id === newParentId) return res.status(400).json({ error: "Loop hierárquico proibido" });

    // 4. Execução das operações dentro da Transação Interativa
    const results = await db.$transaction(async (tx) => {
      
      if (isBatch) {
        // Evita loops hierárquicos em movimentações em lote
        if (ids.includes(newParentId)) return res.status(400).json({ error: "Loop hierárquico proibido" });
        
        // A. Captura o estado atual (localização de origem) de todos os ativos selecionados
        const oldActives = await tx.active.findMany({
          where: { id: { in: ids } },
          select: { id: true, fatherSpaceId: true, parentId: true }
        });

        // B. Executa a atualização de localização em lote no banco de dados
        const updateResult = await tx.active.updateMany({
          where: { id: { in: ids } },
          data: {
            fatherSpaceId: newFatherSpaceId,
            parentId: newParentId || null,
          },
        });

        // C. Prepara a estrutura de dados mapeando a origem antiga para cada ID de ativo
        const movementsData = oldActives.map(active => ({
          activeId: active.id,
          fromSpaceId: active.parentId || active.fatherSpaceId || "desconhecido",
          toSpaceId: newFatherSpaceId
        }));

        // D. Grava o histórico de auditoria completo para todos os ativos em lote
        await tx.movement.createMany({
          data: movementsData
        });

        return updateResult;

      } else {
        // A. Captura a localização de origem atual do ativo individual
        const oldActive = await tx.active.findUnique({
          where: { id },
          select: { fatherSpaceId: true }
        });

        // B. Executa a atualização de localização do ativo individual
        const moved = await tx.active.update({
          where: { id },
          data: {
            fatherSpaceId: newFatherSpaceId,
            parentId: newParentId || null,
          },
        });

        // C. Grava o registro individual de movimentação no histórico de auditoria
        await tx.movement.create({
          data: {
            activeId: id,
            fromSpaceId: oldActive?.fatherSpaceId || "desconhecido",
            toSpaceId: newFatherSpaceId
          }
        });

        return { count: 1, moved };
      }
    });

    // 5. Retorno de sucesso com o resultado das operações da transação
    return res.status(200).json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha na movimentação';
    return res.status(500).json({ error: message });
  }
}