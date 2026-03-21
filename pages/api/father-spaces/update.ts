// pages/api/father-spaces/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Area } from "@prisma/client";

const prisma = new PrismaClient();

interface UpdateFatherSpacePayload {
  id: string;
  name?: string;
  area?: Area;
  notes?: string;
  parentId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    // 1. VERIFICAÇÃO DE SESSÃO E RBAC
    // const session = await getServerSession(req, res, authOptions);
    // if (!session) return res.status(401).json({ error: "Não autenticado." });

    // Mock do usuário (Regra: APENAS ADMIN pode editar espaços)
    const user = {
      id: "",
      role: "ADMIN" // Experimente mudar para "MANAGER" para testar o bloqueio
    };

    if (user.role !== "ADMIN") {
      return res.status(403).json({ 
        error: "Acesso negado. Apenas administradores podem alterar a estrutura de espaços." 
      });
    }

    // 2. VALIDAÇÃO DO PAYLOAD
    const data = req.body as UpdateFatherSpacePayload;
    
    if (!data.id) {
      return res.status(400).json({ error: "O ID do espaço é obrigatório." });
    }

    // 3. EXECUÇÃO DA ATUALIZAÇÃO
    const updatedSpace = await prisma.fatherSpace.update({
      where: { id: data.id },
      data: {
        name: data.name,
        area: data.area,
        notes: data.notes,
        parentId: data.parentId,
      },
    });

    return res.status(200).json(updatedSpace);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("ERRO father-spaces/update:", error);

    if (error.code === 'P2002') {
      return res.status(409).json({ error: "Já existe um espaço pai com este nome." });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Espaço pai não encontrado." });
    }

    return res.status(500).json({ error: "Erro interno ao atualizar o espaço pai." });
  } finally {
    await prisma.$disconnect();
  }
}