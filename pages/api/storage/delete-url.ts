// pages/api/storage/delete-url.ts
import { NextApiResponse } from 'next';
import { deleteFileFromMinio } from '@/lib/minio';
import { authMiddleware, AuthenticatedNextApiRequest } from '@/lib/middlewares/authMiddleware';

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  // Garante que só aceita requisições do tipo DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido. Use DELETE.' });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL não fornecida.' });
    }

    // Executa a deleção de forma segura no lado do servidor (Node.js)
    await deleteFileFromMinio(url);

    return res.status(200).json({ success: true, message: 'Ficheiro removido com sucesso.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao eliminar ficheiro.';
    return res.status(500).json({ error: message });
  }
};

export default authMiddleware(handler);
