// pages/api/storage/file.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { minioClient, BUCKET_NAME } from '@/lib/minio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET' });
  }

  const key = typeof req.query.key === 'string' ? req.query.key : undefined;
  if (!key) {
    return res.status(400).json({ error: 'Parâmetro key ausente' });
  }

  try {
    let stat;
    try {
      stat = await minioClient.statObject(BUCKET_NAME, key);
    } catch {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const contentType = stat.metaData?.['content-type'] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    // Força visualização inline no navegador para PDFs/imagens
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(key.split('/').pop() || 'file')}"`);

    const stream = await minioClient.getObject(BUCKET_NAME, key);
    
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).json({ error: 'Erro ao ler arquivo' });
      else res.end();
    });

    stream.pipe(res);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Erro interno');
    return res.status(500).json({ error: err.message });
  }
}