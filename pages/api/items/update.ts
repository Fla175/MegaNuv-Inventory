import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  const { id, tag, notes } = req.body;
  
  // 1. Verifica o método HTTP
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Método não permitido. Use PUT.' });
  }

  // 2. (opcional) Verifica Autenticação
  // const authHeader = req.headers.authorization;

  // if (!authHeader) {
  //   return res.status(401).json({ message: 'Token de autenticação ausente.' });
  // }

  // const token = authHeader.split(' ')[1]; 

  // if (!token) {
  //   return res.status(401).json({ message: 'Formato de token inválido.' });
  // }

  // const user = verifyAuthToken(token);

  // if (!user) {
  //   return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
  // }

  // 3. Validação Básica
  if (!id) {
    return res.status(400).json({ message: 'ID do ativo é obrigatório.' });
  }

  try {
    // 4. Executa o Update no Prisma
    const updatedItem = await prisma.item.update({
      where: { id: String(id) },
      data: {
        tag: tag,
        notes: notes
      },
    });

    return res.status(200).json(updatedItem);

  } catch (error: any) {
    console.error('Erro ao atualizar ativo:', error);

    // Erro comum do Prisma quando o ID não existe (código P2025)
    if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Ativo não encontrado.' });
    }

    return res.status(500).json({ message: 'Erro interno ao atualizar ativo.' });
  }
}