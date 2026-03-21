// pages/api/father-spaces/delete.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Método não permitido. Use DELETE." });
  }

  try {

    // Mock do usuário temporário
    const user = {
      id: "",
      role: "ADMIN" 
    };

    // Regra de Ouro: MANAGER e VIEWER são barrados aqui
    if (user.role !== "ADMIN") {
      return res.status(403).json({ 
        error: "Acesso negado. Apenas administradores podem excluir espaços pai." 
      });
    }

    // 2. OBTER O ID DO ESPAÇO
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "O ID do espaço pai é obrigatório." });
    }

    // 3. EXCLUSÃO NO BANCO DE DADOS
    const deletedSpace = await prisma.fatherSpace.delete({
      where: { id: id },
    });

    return res.status(200).json({ 
      message: "Espaço pai e suas sub-divisões excluídos com sucesso.",
      id: deletedSpace.id
    });

  } catch (error: unknown) {
    console.error("ERRO father-spaces/delete:", error);

    // Tratamento para registro não encontrado
    if (typeof error === 'object' && error !== null && 'code' in error) {
        if ((error as { code: string }).code === 'P2025') {
            return res.status(404).json({ error: "O espaço pai solicitado não existe." });
        }
    }

    return res.status(500).json({ error: "Erro interno ao excluir o espaço pai." });
  } finally {
    await prisma.$disconnect();
  }
}