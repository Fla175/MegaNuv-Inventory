// lib/minio.ts
import * as Minio from 'minio';

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '178.95.47.68',
  port: Number(process.env.MINIO_PORT) || 9001,
  useSSL: process.env.MINIO_USE_SSL === 'false',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'MinIo2026%',
});

export const BUCKET_NAME = 'inventory';

export const deleteFileFromMinio = async (url: string | null) => {
  if (!url) return;

  try {
    const urlParts = url.split('/');
    const objectName = urlParts.pop();

      if (objectName) {
      await minioClient.removeObject(BUCKET_NAME, objectName);
    }
    } catch {
  }
};