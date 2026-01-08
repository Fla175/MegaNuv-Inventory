// pages/api/public/initial-check.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Assumindo que você usa este caminho

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  try {
    const userCount = await prisma.user.count();
    
    // Retorna true se precisar de configuração inicial (zero usuários)
    return res.status(200).json({ requiresSetup: userCount === 0 });
    
  } catch (error) {
    console.error("Erro ao verificar contagem de usuários:", error);
    // Em caso de erro de conexão, assuma que precisa de setup para ser seguro
    return res.status(500).json({ requiresSetup: true, message: 'Database error' });
  }
}