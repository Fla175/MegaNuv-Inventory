// pages/api/actives/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método não permitido. Utilize PUT." });
  }

  try {
    const {
      id,
      name,
      categoryId,
      sku,
      manufacturer,
      model,
      serialNumbers,
      fixedValue,
      fatherSpaceId,
      parentId,
      isPhysicalSpace,
      tag,
      notes,
      imageUrl,
      fileUrl,
      applyToSimilar,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "O ID do ativo é obrigatório para atualização." });
    }

    const originalActive = await prisma.active.findUnique({
      where: { id },
    });

    if (!originalActive) {
      return res.status(404).json({ error: "Ativo não encontrado." });
    }

    const primarySerialNumber = Array.isArray(serialNumbers) && serialNumbers.length > 0 && serialNumbers[0] !== ""
      ? serialNumbers[0]
      : null;

    const formattedFileUrl = Array.isArray(fileUrl)
      ? fileUrl.filter(Boolean).join(",")
      : fileUrl || null;

    const parsedFixedValue = typeof fixedValue === "number" ? fixedValue : parseFloat(fixedValue) || 0;

    const currentUpdateData = {
      name,
      categoryId,
      sku: sku || null,
      manufacturer: manufacturer || null,
      model: model || null,
      fixedValue: parsedFixedValue,
      fatherSpaceId,
      parentId: parentId || null,
      isPhysicalSpace: !!isPhysicalSpace,
      tag: tag || "IN-STOCK",
      notes: notes || null,
      imageUrl: imageUrl || null,
      fileUrl: formattedFileUrl,
    };

    const updatedActive = await prisma.active.update({
      where: { id },
      data: {
        ...currentUpdateData,
        serialNumber: primarySerialNumber,
      },
    });

    if (applyToSimilar) {
      const changedFields: Prisma.ActiveUpdateManyMutationInput = {};

      const keys = Object.keys(currentUpdateData) as Array<keyof typeof currentUpdateData>;
      keys.forEach((key) => {
        const incomingValue = currentUpdateData[key];
        const originalValue = originalActive[key as keyof typeof originalActive];

        if (incomingValue !== originalValue) {
          Object.assign(changedFields, { [key]: incomingValue });
        }
      });

      if (Object.keys(changedFields).length > 0) {
        const similarityWhereClause: Prisma.ActiveWhereInput = {
          id: { not: id },
          name: originalActive.name,
          manufacturer: originalActive.manufacturer,
          model: originalActive.model,
          sku: originalActive.sku,
        };

        await prisma.active.updateMany({
          where: similarityWhereClause,
          data: changedFields,
        });
      }
    }

    return res.status(200).json(updatedActive);
  } catch (error) {
    console.error("Erro na API /api/actives/update:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(400).json({
        error: "O Número de Série informado já pertence a outro ativo cadastrado.",
        details: error.meta?.target,
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    return res.status(500).json({
      error: "Erro interno ao atualizar o ativo.",
      details: errorMessage,
    });
  }
}
