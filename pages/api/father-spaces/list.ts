// pages/api/father-spaces/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
// import { getServerSession } from "next-auth/next"; 
// import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas o método GET é permitido
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  try {
    // 1. VERIFICAÇÃO DE SESSÃO (Opcional, mas recomendado)
    // const session = await getServerSession(req, res, authOptions);
    // if (!session) return res.status(401).json({ error: "Não autenticado." });

    // 2. BUSCA NO BANCO COM RELACIONAMENTOS E CONTAGENS
    const spaces = await prisma.fatherSpace.findMany({
      include: {
        // Traz quem criou o local
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        // Traz o nome do espaço pai caso seja uma sub-área
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        // Conta quantos ativos estão vinculados diretamente a este espaço
        _count: {
          select: {
            actives: true,
            children: true // Quantas sub-áreas existem dentro dele
          }
        }
      },
      orderBy: {
        name: 'asc' // Ordena alfabeticamente para facilitar a busca
      }
    });

    // 3. RETORNO DOS DADOS
    return res.status(200).json(spaces);

  } catch (error) {
    console.error("ERRO father-spaces/list:", error);
    return res.status(500).json({ error: "Erro interno ao listar os espaços pai." });
  } finally {
    await prisma.$disconnect();
  }
}