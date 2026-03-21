// pages/api/actives/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  try {
    const actives = await prisma.active.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        fatherSpace: {
          select: {
            id: true,
            name: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            tag: true
          }
        },
        // Em vez de trazer todos os children, usamos o count filtrado
        // Nota: Se a sua versão do Prisma for < 4.3.0, o filtro dentro de _count 
        // pode variar. Esta é a abordagem moderna e eficiente:
        _count: {
          select: {
            children: {
              where: { isPhysicalSpace: false } // Conta apenas ativos comuns
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Mapeamos o resultado para facilitar o consumo no front-end
    // Transformamos o objeto _count em uma propriedade mais amigável
    const formattedActives = actives.map(item => ({
      ...item,
      childrenCount: item._count.children,
      _count: undefined // Removemos o objeto original para limpar o JSON
    }));

    return res.status(200).json(formattedActives);

  } catch (error) {
    console.error("ERRO LIST ACTIVE:", error);
    return res.status(500).json({ error: "Erro interno ao listar os ativos." });
  } finally {
    await prisma.$disconnect();
  }
}