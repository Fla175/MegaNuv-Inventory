// lib/minio.ts
import * as Minio from 'minio';
import { getMinioKeyFromUrl } from './mediaUrl';

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

/**
 * Constrói um cliente MinIO com as credenciais especificadas.
 * Modo 'app' usa MINIO_ACCESS_KEY/MINIO_SECRET_KEY.
 * Modo 'auditor' usa MINIO_AUDIT_ACCESS_KEY/MINIO_AUDIT_SECRET_KEY.
 */
function buildMinioClient(mode: 'app' | 'auditor'): Minio.Client {
  const endPoint = process.env.MINIO_ENDPOINT!;
  const port = Number(process.env.MINIO_PORT) || 9000;
  const useSSL = process.env.MINIO_USE_SSL === 'true';

  let accessKey: string;
  let secretKey: string;

  if (mode === 'auditor') {
    accessKey = process.env.MINIO_AUDIT_ACCESS_KEY!;
    secretKey = process.env.MINIO_AUDIT_SECRET_KEY!;
    if (!accessKey || !secretKey) {
      throw new Error(
        'Variáveis de ambiente MINIO_AUDIT_ACCESS_KEY e MINIO_AUDIT_SECRET_KEY são necessárias para o modo auditor.'
      );
    }
  } else {
    accessKey = requireEnv('MINIO_ACCESS_KEY');
    secretKey = requireEnv('MINIO_SECRET_KEY');
  }

  return new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });
}

// Cliente para uso interno no servidor/proxy (porta da API MinIO, padrão 9000)
// Usa credenciais da aplicação por padrão.
export const minioClient = buildMinioClient('app');

// Cliente público para geração de Presigned URLs acessíveis pelos navegadores
// Usa credenciais da aplicação por padrão.
export const minioPublicClient = buildMinioClient('app');

export const BUCKET_NAME = 'inventory';

/**
 * Retorna um cliente MinIO configurado para o modo especificado.
 * Use 'app' para credenciais da aplicação (operações de upload/download normais).
 * Use 'auditor' para credenciais de auditoria (necessário quando a policy da aplicação
 * não possui ListBucket ou em operações que requerem enumeração do bucket).
 */
export function getMinioClient(mode: 'app' | 'auditor'): Minio.Client {
  return buildMinioClient(mode);
}

/**
 * Remove o objeto do MinIO referenciado por uma URL guardada no banco.
 *
 * A extração da chave tem que ser a canônica (`getMinioKeyFromUrl`), e não um
 * `split('/').pop()` local, por dois motivos concretos:
 *
 * 1. O banco guarda a **URL completa** e o bucket guarda a **chave**. Com
 *    subpasta (`/inventory/subpasta/foto.jpg`) o `pop()` devolve só
 *    `foto.jpg` e apaga o objeto errado — ou nada, sem sinalizar.
 * 2. O app aceita **link externo** ("Cole um link", ex.: Google Drive). O
 *    `pop()` dele (`.../view` → `view`) viraria uma chave de deleção dentro do
 *    bucket `inventory`: uma remoção que o usuário nunca pediu.
 *
 * `getMinioKeyFromUrl` devolve `null` para o que não é do bucket — e aí não há
 * nada nosso para apagar, o que **não** é erro.
 *
 * Não lança: `removeObject` é idempotente e rejeita objeto já inexistente,
 * e os chamadores (`father-spaces/delete`, `actives/delete`,
 * `storage/delete-url`) dependem disso para não reverter a exclusão de um
 * registro só porque o arquivo já sumiu.
 */
export const deleteFileFromMinio = async (url: string | null | undefined) => {
  if (!url) return;

  const objectName = getMinioKeyFromUrl(url);

  // Link externo ou URL fora do bucket `inventory`: nada nosso para apagar.
  if (!objectName) return;

  try {
    await minioClient.removeObject(BUCKET_NAME, objectName);
  } catch (error) {
    // Registra o motivo (antes era engolido em silêncio) sem stack e sem
    // qualquer credencial: o log vai para o console do servidor.
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[minio] falha ao remover o objeto de "${url}": ${reason}`);
  }
};
