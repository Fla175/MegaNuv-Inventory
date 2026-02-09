// pages/api/storage/upload-url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import * as Minio from 'minio';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const minioClient = new Minio.Client({
  endPoint: '10.20.31.142',
  port: 9000,
  useSSL: false,
  accessKey: 'minio',
  secretKey: '123asd!@#',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const form = formidable({});
  
  try {
    const [, files] = await form.parse(req); // Usando vírgula para ignorar o primeiro parâmetro
    const file = files.file?.[0];
    if (!file) throw new Error("Arquivo não recebido");

    const bucketName = 'inventory';
    const objectName = `${Date.now()}-${file.originalFilename?.replace(/\s+/g, '-')}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    await minioClient.putObject(bucketName, objectName, fileBuffer, file.size, {
      'Content-Type': file.mimetype || 'application/octet-stream',
    });

    const publicUrl = `http://10.20.31.142:9000/${bucketName}/${objectName}`;
    return res.status(200).json({ publicUrl });
  } catch (error) {
    const err = error as Error;
    console.error("Erro no upload:", err);
    return res.status(500).json({ error: err.message });
  }
}