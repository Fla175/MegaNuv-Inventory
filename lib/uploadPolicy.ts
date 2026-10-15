// lib/uploadPolicy.ts

/**
 * Limites e tipos aceitos no upload de anexos.
 *
 * A validação existe no cliente (`components/FileUpload.tsx`) por UX, mas o
 * cliente não é confiável: estas regras são a validação autoritativa e são
 * aplicadas no servidor, em `pages/api/storage/upload-url.ts`.
 */

/** Tamanho máximo por arquivo: 10 MB. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** MIME types aceitos. */
export const ALLOWED_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
];

/** Extensões aceitas — cobre navegadores que não enviam MIME type confiável. */
export const ALLOWED_EXTENSIONS: readonly string[] = [
  '.pdf',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
];

const ALLOWED_MIME_SET = new Set(ALLOWED_MIME_TYPES);
const ALLOWED_EXT_SET = new Set(ALLOWED_EXTENSIONS);

/** Extrai a extensão em minúsculas a partir do nome do arquivo (`.PDF` → `.pdf`). */
export function getFileExtension(filename: string | null | undefined): string {
  if (!filename) return '';
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return `.${parts.pop()!.toLowerCase()}`;
}

/**
 * Verdadeiro quando o arquivo é aceito.
 *
 * Tipo **e** extensão são validados quando presentes, e ambos precisam estar
 * na allowlist. Exigir os dois é o que impede a troca de um pelo outro: um
 * `.exe` renomeado com MIME `application/pdf` é rejeitado pela extensão, e um
 * `application/x-msdownload` disfarçado de `.pdf` é rejeitado pelo MIME.
 *
 * `application/octet-stream` nunca é aceito por MIME — é o genérico que um
 * cliente usaria para burlar a checagem.
 */
export function isAllowedFileType(mimeType: string | null | undefined, filename: string | null | undefined): boolean {
  const mime = mimeType?.toLowerCase() ?? '';
  const ext = getFileExtension(filename);

  if (mime === 'application/octet-stream') return false;

  // Extensão presente precisa estar na allowlist.
  if (ext && !ALLOWED_EXT_SET.has(ext)) return false;

  // MIME presente (e não genérico) precisa estar na allowlist.
  if (mime && mime !== 'application/octet-stream' && !ALLOWED_MIME_SET.has(mime)) return false;

  // Sem nenhuma informação de tipo, não há como autorizar.
  if (!ext && !mime) return false;

  return true;
}

/** Verdadeiro quando o arquivo respeita o limite de tamanho. */
export function isWithinSizeLimit(sizeBytes: number): boolean {
  return Number.isFinite(sizeBytes) && sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

export interface UploadRejection {
  field: 'type' | 'size';
  message: string;
}

/**
 * Valida um upload e devolve a razão da rejeição, ou `null` se o arquivo é válido.
 * Função pura: nenhuma dependência de I/O, fácil de testar.
 */
export function validateUpload(
  file: { mimetype?: string | null; originalFilename?: string | null; size?: number },
): UploadRejection | null {
  if (!isAllowedFileType(file.mimetype, file.originalFilename)) {
    return {
      field: 'type',
      message: 'Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, PNG, JPG ou WEBP.',
    };
  }

  const size = file.size ?? 0;
  if (!isWithinSizeLimit(size)) {
    return {
      field: 'size',
      message: `Arquivo excede o limite de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
    };
  }

  return null;
}
