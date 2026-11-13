import { describe, it, expect } from 'vitest';
import { getFileDetails } from '@/components/list/FileDetails';

describe('getFileDetails (shared, deduped)', () => {
  it('PDF returns red FileText icon', () => {
    const d = getFileDetails('https://minio/inventory/doc.pdf');
    expect(d.extension).toBe('pdf');
    expect(d.colorClass).toBe('text-red-500');
    expect(d.bgClass).toBe('bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50');
    expect(d.Icon).toBeTruthy();
  });

  it('DOC returns blue File icon', () => {
    const d = getFileDetails('https://minio/inventory/report.doc');
    expect(d.extension).toBe('doc');
    expect(d.colorClass).toBe('text-blue-500');
    expect(d.bgClass).toBe('bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50');
    expect(d.Icon).toBeTruthy();
  });

  it('DOCX returns blue File icon', () => {
    const d = getFileDetails('https://minio/inventory/report.docx');
    expect(d.extension).toBe('docx');
    expect(d.Icon).toBeTruthy();
  });

  it('PNG returns emerald Image icon', () => {
    const d = getFileDetails('https://minio/inventory/photo.png');
    expect(d.extension).toBe('png');
    expect(d.colorClass).toBe('text-emerald-500');
    expect(d.bgClass).toBe('bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50');
    expect(d.Icon).toBeTruthy();
  });

  it('JPEG returns emerald Image icon', () => {
    const d = getFileDetails('https://minio/inventory/photo.jpeg');
    expect(d.extension).toBe('jpeg');
    expect(d.Icon).toBeTruthy();
  });

  it('Unknown extension returns gray LinkIcon', () => {
    const d = getFileDetails('https://minio/inventory/archive.xyz');
    expect(d.extension).toBe('xyz');
    expect(d.colorClass).toBe('text-gray-500');
    expect(d.bgClass).toBe('bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700');
    expect(d.Icon).toBeTruthy();
  });

  it('URL without extension falls back to "link"', () => {
    const d = getFileDetails('https://minio/inventory/somefile');
    expect(d.extension).toBe('link');
    expect(d.colorClass).toBe('text-gray-500');
    expect(d.bgClass).toBe('bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700');
    expect(d.Icon).toBeTruthy();
  });

  it('URL with query string ignores query', () => {
    const d = getFileDetails('https://minio/inventory/doc.pdf?token=abc');
    expect(d.extension).toBe('pdf');
    expect(d.displayName).toBe('doc.pdf');
  });

  it('Decodes URI-encoded filename', () => {
    const d = getFileDetails('https://minio/inventory/relat%C3%B3rio.pdf');
    expect(d.displayName).toBe('relatório.pdf');
  });

  it('Uses fallback display name for URLs without filename', () => {
    const d = getFileDetails('https://minio/inventory/');
    expect(d.displayName).toBe('link-anexado');
    expect(d.extension).toBe('link');
  });
});
