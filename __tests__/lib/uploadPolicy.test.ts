import { describe, it, expect } from 'vitest';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  getFileExtension,
  isAllowedFileType,
  isWithinSizeLimit,
  validateUpload,
} from '@/lib/uploadPolicy';

describe('getFileExtension', () => {
  it('extrai a extensão em minúsculas', () => {
    expect(getFileExtension('relatorio.PDF')).toBe('.pdf');
    expect(getFileExtension('foto.JPEG')).toBe('.jpeg');
  });

  it('devolve string vazia quando não há extensão', () => {
    expect(getFileExtension('sem-extensao')).toBe('');
    expect(getFileExtension('')).toBe('');
    expect(getFileExtension(null)).toBe('');
    expect(getFileExtension(undefined)).toBe('');
  });
});

describe('isAllowedFileType', () => {
  it('aceita os MIME types da allowlist quando não há extensão conflitante', () => {
    for (const mime of ALLOWED_MIME_TYPES) {
      expect(isAllowedFileType(mime, 'arquivo-sem-extensao')).toBe(true);
    }
  });

  it('rejeita extensão perigosa mesmo com MIME válido', () => {
    // nome de arquivo não confiável não é aceito só porque o MIME parece bom
    expect(isAllowedFileType('application/pdf', 'malware.exe')).toBe(false);
    expect(isAllowedFileType('image/png', 'payload.bin')).toBe(false);
  });

  it('rejeita MIME desconhecido mesmo com extensão válida', () => {
    // extensão válida não "salva" um MIME fora da allowlist
    expect(isAllowedFileType('application/x-desconhecido', 'contrato.docx')).toBe(false);
  });

  it('rejeita MIME perigoso disfarçado de extensão válida', () => {
    expect(isAllowedFileType('application/x-msdownload', 'relatorio.pdf')).toBe(false);
    expect(isAllowedFileType('text/html', 'pagina.pdf')).toBe(false);
  });

  it('rejeita executáveis e scripts', () => {
    expect(isAllowedFileType('application/x-msdownload', 'virus.exe')).toBe(false);
    expect(isAllowedFileType('text/html', 'pagina.html')).toBe(false);
    expect(isAllowedFileType('application/x-sh', 'script.sh')).toBe(false);
  });

  it('rejeita extension fora da allowlist', () => {
    expect(isAllowedFileType(undefined, 'malware.exe')).toBe(false);
  });

  it('rejeita application/octet-stream mesmo com extensão válida', () => {
    // nome de extensão confiável não basta quando o MIME é o genérico
    expect(isAllowedFileType('application/octet-stream', 'relatorio.pdf')).toBe(false);
  });

  it('rejeita arquivo sem MIME e sem extensão', () => {
    expect(isAllowedFileType(undefined, undefined)).toBe(false);
  });

  it('normaliza MIME com maiúsculas', () => {
    expect(isAllowedFileType('APPLICATION/PDF', 'doc.pdf')).toBe(true);
  });
});

describe('isWithinSizeLimit', () => {
  it('aceita arquivo exatamente no limite', () => {
    expect(isWithinSizeLimit(MAX_FILE_SIZE_BYTES)).toBe(true);
  });

  it('rejeita arquivo acima do limite', () => {
    expect(isWithinSizeLimit(MAX_FILE_SIZE_BYTES + 1)).toBe(false);
  });

  it('rejeita arquivo vazio', () => {
    expect(isWithinSizeLimit(0)).toBe(false);
  });

  it('rejeita tamanho inválido', () => {
    expect(isWithinSizeLimit(Number.NaN)).toBe(false);
    expect(isWithinSizeLimit(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('validateUpload', () => {
  const validBase = { mimetype: 'application/pdf', originalFilename: 'relatorio.pdf', size: 1024 };

  it('aceita arquivo válido', () => {
    expect(validateUpload(validBase)).toBeNull();
  });

  it('rejeita por tipo antes de olhar tamanho', () => {
    const r = validateUpload({ ...validBase, originalFilename: 'x.exe', mimetype: 'application/x-msdownload' });
    expect(r?.field).toBe('type');
  });

  it('rejeita por tamanho', () => {
    const r = validateUpload({ ...validBase, size: MAX_FILE_SIZE_BYTES + 1 });
    expect(r?.field).toBe('size');
    expect(r?.message).toContain('10 MB');
  });

  it('trata size ausente como inválido', () => {
    const r = validateUpload({ mimetype: 'application/pdf', originalFilename: 'a.pdf' });
    expect(r?.field).toBe('size');
  });

  it('aceita todas as extensões declaradas na allowlist', () => {
    for (const ext of ALLOWED_EXTENSIONS) {
      expect(
        validateUpload({ mimetype: 'application/octet-stream', originalFilename: `arquivo${ext}`, size: 100 })
          ?.field
      ).toBe('type');
      // com MIME válido, passa
      expect(
        validateUpload({ mimetype: 'image/png', originalFilename: `arquivo${ext}`, size: 100 })
      ).toBeNull();
    }
  });
});
