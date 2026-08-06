// lib/minio.ts
import * as Minio from 'minio';

// Cliente para uso interno no servidor/proxy (porta da API MinIO, padrão 9000)
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '178.95.47.68',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'inventory-backend',
  secretKey: process.env.MINIO_SECRET_KEY || 'MinIoBackend2026Secure',
});

// Cliente público para geração de Presigned URLs acessíveis pelos navegadores
export const minioPublicClient = new Minio.Client({
  endPoint: process.env.MINIO_PUBLIC_ENDPOINT || 'minio.meganuv.com',
  port: Number(process.env.MINIO_PUBLIC_PORT) || 80,
  useSSL: process.env.MINIO_PUBLIC_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'inventory-backend',
  secretKey: process.env.MINIO_SECRET_KEY || 'MinIoBackend2026Secure',
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
    // Silencia erros de exclusão
  }
};