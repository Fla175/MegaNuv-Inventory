// lib/minio.ts
import * as Minio from 'minio';

/**
 * Valida que uma variável de ambiente obrigatória está definida.
 * Lança um erro descritivo se estiver ausente — o app deve parar em vez de
 * cair em fallbacks inseguros com credenciais ou hosts de produção.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não está definida. Defina-a no .env antes de iniciar o app.`
    );
  }
  return value;
}

// Cliente para uso interno no servidor/proxy (porta da API MinIO, padrão 9000)
export const minioClient = new Minio.Client({
  endPoint: requireEnv('MINIO_ENDPOINT'),
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: requireEnv('MINIO_ACCESS_KEY'),
  secretKey: requireEnv('MINIO_SECRET_KEY'),
});

// Cliente público para geração de Presigned URLs acessíveis pelos navegadores
export const minioPublicClient = new Minio.Client({
  endPoint: requireEnv('MINIO_PUBLIC_ENDPOINT'),
  port: Number(process.env.MINIO_PUBLIC_PORT) || 80,
  useSSL: process.env.MINIO_PUBLIC_USE_SSL === 'true',
  accessKey: requireEnv('MINIO_ACCESS_KEY'),
  secretKey: requireEnv('MINIO_SECRET_KEY'),
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
