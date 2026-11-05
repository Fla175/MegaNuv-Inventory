// pages/api/storage/file.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getMinioClient, BUCKET_NAME } from '@/lib/minio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET' });
  }

  const key = typeof req.query.key === 'string' ? req.query.key : undefined;
  if (!key) {
    return res.status(400).json({ error: 'Parâmetro key ausente' });
  }

  try {
    const minio = getMinioClient();
    let stat;
    try {
      stat = await minio.statObject(BUCKET_NAME, key);
      console.log('[storage/file] statObject success, size:', stat.size, 'content-type:', stat.metaData?.['content-type']);
    } catch (statErr) {
      console.error('[storage/file] statObject error:', statErr);
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const contentType = stat.metaData?.['content-type'] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(stat.size));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    // Força visualização inline no navegador para PDFs/imagens
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(key.split('/').pop() || 'file')}"`);

    const stream = await minio.getObject(BUCKET_NAME, key);
    console.log('[storage/file] getObject stream started, key:', key);

    stream.on('error', (streamErr) => {
      console.error('[storage/file] getObject stream error:', streamErr);
      if (!res.headersSent) res.status(500).json({ error: 'Erro ao ler arquivo' });
      else res.end();
    });

    stream.pipe(res);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Erro interno');
    console.error('[storage/file] unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}