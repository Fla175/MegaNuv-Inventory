// lib/mediaUrl.ts
const MINIO_URL_PATTERN = /^https?:\/\/[^/]+\/inventory\/(.+)$/;

// Extrai a chave (key) do MinIO a partir de uma URL salva no banco.
// Ex: http://minio.meganuv.com/inventory/fotos/imagem.jpg -> fotos/imagem.jpg
export function getMinioKeyFromUrl(url: string): string | null {
  if (!url) return null; // Proteção extra caso receba null/undefined
  
  const match = url.match(MINIO_URL_PATTERN);
  return match ? match[1] : null;
}

// Converte uma URL do MinIO para a rota interna do proxy autenticado.
// Mantém URLs externas intactas.
export function toLocalMediaUrl(url: string): string;
export function toLocalMediaUrl(url: string | null | undefined): string | null;
export function toLocalMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const key = getMinioKeyFromUrl(url);
  
  // Se não extraiu a key (ex: link externo do Google Drive), retorna a URL original
  if (!key) return url;
  
  // Retorna a rota do proxy com a key encodada de forma segura
  return `/api/storage/file?key=${encodeURIComponent(key)}`;
}