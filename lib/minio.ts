// lib/minio.ts
import * as Minio from 'minio';

// Configuração do cliente MinIO usando variáveis de ambiente
export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: Number(process.env.MINIO_PORT) || 9001,
  useSSL: process.env.MINIO_USE_SSL === 'false',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'meganuv1300',
});

// Nome do bucket onde as imagens serão salvas
export const BUCKET_NAME = 'inventory-images';

/**
 * Helper para extrair o nome do arquivo de uma URL e removê-lo do MinIO.
 * Isso evita que fiquem arquivos "órfãos" no storage quando deletamos algo no banco.
 */
export const deleteFileFromMinio = async (url: string | null) => {
  if (!url) return;

  try {
    // A URL costuma ser: http://localhost:9000/inventory-images/nome-do-arquivo.jpg
    // O split('/') quebra a string em partes e o pop() pega a última (o nome do arquivo)
    const urlParts = url.split('/');
    const objectName = urlParts.pop();

    if (objectName) {
      await minioClient.removeObject(BUCKET_NAME, objectName);
      console.log(`[MINIO]: Arquivo ${objectName} removido com sucesso.`);
    }
  } catch (error) {
    console.error(`[MINIO ERROR]: Falha ao remover arquivo do storage:`, error);
    // Não lançamos o erro aqui para não travar a exclusão no banco de dados,
    // mas deixamos o log para sabermos que o arquivo ficou lá.
  }
};