// pages/api/actives/move.ts

import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import { getSessionUser } from "@/lib/apiAuth";
import { createLog } from "@/lib/logger";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({
      error: "Método não permitido.",
    });
  }

  try {
    // =========================================================
    // AUTENTICAÇÃO
    // =========================================================

    const session = await getSessionUser(req);

    if (!session) {
      return res.status(401).json({
        error: "Sessão expirada.",
      });
    }

    const userId = session.userId;

    if (!userId || userId === "undefined") {
      return res.status(401).json({
        error:
          "Usuário não identificado no token de autenticação.",
      });
    }

    if (session.role === "VIEWER") {
      return res.status(403).json({
        error:
          "Permissão negada. Nível de acesso não permitido.",
      });
    }

    // =========================================================
    // BODY
    // =========================================================

    const {
      id,
      ids,
      newFatherSpaceId,
      newParentId,
    } = req.body || {};

    const isBatch = Array.isArray(ids);

    if (!newFatherSpaceId) {
      return res.status(400).json({
        error: "Espaço físico de destino é obrigatório.",
      });
    }

    if (!isBatch && !id) {
      return res.status(400).json({
        error: "ID do ativo é obrigatório.",
      });
    }

    if (isBatch && ids.length === 0) {
      return res.status(400).json({
        error: "Nenhum ativo foi selecionado.",
      });
    }

    if (!isBatch && id === newParentId) {
      return res.status(400).json({
        error: "Loop hierárquico proibido.",
      });
    }

    if (isBatch && ids.includes(newParentId)) {
      return res.status(400).json({
        error: "Loop hierárquico proibido.",
      });
    }

    // Timestamp gerado pelo servidor.
    // Será devolvido ao frontend e usado pelo revert.ts.
    const operationTimestamp = new Date();

    // =========================================================
    // MOVIMENTAÇÃO
    // =========================================================

    const result = await db.$transaction(async (tx) => {
      if (isBatch) {
        const oldActives = await tx.active.findMany({
          where: {
            id: {
              in: ids,
            },
          },
          select: {
            id: true,
            name: true,
            fatherSpaceId: true,
            parentId: true,
          },
        });

        if (oldActives.length !== ids.length) {
          throw new Error(
            "Um ou mais ativos selecionados não foram encontrados."
          );
        }

        // -----------------------------------------------------
        // Separar raízes e filhos
        // -----------------------------------------------------

        const idsSet = new Set(ids);

        const rootIds: string[] = [];
        const childIds: string[] = [];

        for (const active of oldActives) {
          if (
            active.parentId &&
            idsSet.has(active.parentId)
          ) {
            childIds.push(active.id);
          } else {
            rootIds.push(active.id);
          }
        }

        let updatedCount = 0;

        // -----------------------------------------------------
        // Atualizar raízes
        // -----------------------------------------------------

        if (rootIds.length > 0) {
          const rootResult = await tx.active.updateMany({
            where: {
              id: {
                in: rootIds,
              },
            },
            data: {
              fatherSpaceId: newFatherSpaceId,
              parentId: newParentId || null,
            },
          });

          updatedCount += rootResult.count;
        }

        // -----------------------------------------------------
        // Atualizar filhos
        // -----------------------------------------------------

        if (childIds.length > 0) {
          const childResult = await tx.active.updateMany({
            where: {
              id: {
                in: childIds,
              },
            },
            data: {
              fatherSpaceId: newFatherSpaceId,
            },
          });

          updatedCount += childResult.count;
        }

        // -----------------------------------------------------
        // Histórico de movimentação
        // -----------------------------------------------------

        const movementsData = oldActives.map((active) => {
          const fromSpace =
            active.parentId ||
            active.fatherSpaceId ||
            "desconhecido";

          const toSpace =
            newParentId ||
            newFatherSpaceId;

          return {
            activeId: active.id,
            fromSpaceId: fromSpace,
            toSpaceId: toSpace,
            createdAt: operationTimestamp,
          };
        });

        await tx.movement.createMany({
          data: movementsData,
        });

        return {
          count: updatedCount,
          actives: oldActives,
        };
      }

      // =======================================================
      // MOVIMENTAÇÃO INDIVIDUAL
      // =======================================================

      const oldActive = await tx.active.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          fatherSpaceId: true,
          parentId: true,
        },
      });

      if (!oldActive) {
        throw new Error(
          "Ativo não encontrado."
        );
      }

      const fromSpace =
        oldActive.parentId ||
        oldActive.fatherSpaceId ||
        "desconhecido";

      const toSpace =
        newParentId ||
        newFatherSpaceId;

      const moved = await tx.active.update({
        where: {
          id,
        },
        data: {
          fatherSpaceId: newFatherSpaceId,
          parentId: newParentId || null,
        },
      });

      await tx.movement.create({
        data: {
          activeId: id,
          fromSpaceId: fromSpace,
          toSpaceId: toSpace,
          createdAt: operationTimestamp,
        },
      });

      return {
        count: 1,
        actives: [oldActive],
        moved,
      };
    });

    // =========================================================
    // LOG
    // =========================================================

    const names = result.actives
      .map((active) => active.name)
      .join(", ");

    const action = isBatch
      ? "MOVIMENTAÇÃO DE ATIVOS"
      : "MOVIMENTAÇÃO DE ATIVO";

    const details = isBatch
      ? `Moveu ${result.count} ativo(s): ${names}. Destino: ${
          newParentId || newFatherSpaceId
        }.`
      : `Moveu o ativo "${names}" de ${
          result.actives[0].parentId ||
          result.actives[0].fatherSpaceId ||
          "desconhecido"
        } para ${
          newParentId ||
          newFatherSpaceId
        }.`;

    await createLog(
      req,
      String(userId),
      action,
      details
    );

    // =========================================================
    // RESPOSTA
    // =========================================================

    return res.status(200).json({
      success: true,
      count: result.count,

      // O frontend usará este timestamp para o revert.
      timestamp: operationTimestamp.toISOString(),

      ids: result.actives.map(
        (active) => active.id
      ),
    });
  } catch (error: unknown) {
    console.error(
      "❌ Erro na movimentação:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Falha na movimentação.";

    return res.status(500).json({
      error: message,
    });
  }
}