// pages/api/storage/upload-url.ts
import { NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import db from '@/lib/prisma';
import { minioClient, BUCKET_NAME } from '@/lib/minio';
import { validateUpload } from '@/lib/uploadPolicy';
import { authMiddleware, AuthenticatedNextApiRequest } from '@/lib/middlewares/authMiddleware';

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const form = formidable({ multiples: false });

  try {
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'Arquivo não recebido' });
    }

    // Validação autoritativa no servidor: o cliente também valida, mas não é confiável.
    const rejection = validateUpload(file);
    if (rejection) {
      return res.status(400).json({ error: rejection.message });
    }

    // Opcional: vincular o upload a um ativo específico (activeId).
    // O campo é opcional — uploads sem ativo são permitidos.
    const activeIdField = fields.activeId?.[0];
    const activeId = activeIdField && activeIdField.trim() ? activeIdField.trim() : null;
    let active: { id: string; name: string } | null = null;
    if (activeId) {
      const found = await db.active.findUnique({ where: { id: activeId }, select: { id: true, name: true } });
      active = found;
    }

    const bucketName = BUCKET_NAME;
    const safeName = (file.originalFilename ?? 'arquivo').replace(/\s+/g, '-');
    const objectName = `${Date.now()}-${safeName}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    await minioClient.putObject(bucketName, objectName, fileBuffer, file.size, {
      'Content-Type': file.mimetype || 'application/octet-stream',
    });

    // URL pública derivada do ambiente — nenhum host de produção em código.
    const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;
    if (!publicEndpoint) {
      return res.status(500).json({ error: 'MINIO_PUBLIC_ENDPOINT não está definido no ambiente.' });
    }
    const scheme = process.env.MINIO_PUBLIC_USE_SSL === 'true' ? 'https' : 'http';
    const publicUrl = `${scheme}://${publicEndpoint}/${bucketName}/${objectName}`;
    return res.status(200).json({ publicUrl, active });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return res.status(500).json({ error: err.message });
  }
};

export default authMiddleware(handler);
export const config = { api: { bodyParser: false } };
