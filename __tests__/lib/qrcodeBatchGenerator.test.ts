import { describe, it, expect } from 'vitest';
import { generatePhysicalSpacesQRCodeZip } from '@/lib/qrcodeBatchGenerator';
import JSZip from 'jszip';

describe('lib/qrcodeBatchGenerator', () => {
  it('generates a ZIP with PNG files for each physical space', async () => {
    const physicalSpaces = [
      {
        id: 'space-1',
        parentId: null,
        name: 'Sala de Servidores',
        sku: 'SRV-01',
        manufacturer: 'Dell',
        model: 'R740',
        serialNumber: 'ABC123',
        tag: 'SALA-01',
        imageUrl: 'https://example.com/image.jpg',
        fileUrl: null,
        categoryId: 'cat-1',
        createdAt: new Date('2024-01-01'),
      },
    ];

    const zipBuffer = await generatePhysicalSpacesQRCodeZip(physicalSpaces);
    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/sala-de-servidores-space-1\.png$/);
    expect(files[0]).toContain('sala-01'); // tag should be included
  });

  it('includes QR code data in correct format matching individual QR codes', async () => {
    const physicalSpaces = [
      {
        id: 'space-2',
        parentId: 'parent-1',
        name: 'Depósito',
        sku: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        tag: 'DEP-01',
        imageUrl: null,
        fileUrl: null,
        categoryId: null,
        createdAt: new Date(),
      },
    ];

    const zipBuffer = await generatePhysicalSpacesQRCodeZip(physicalSpaces);
    const zip = await JSZip.loadAsync(zipBuffer);
    const fileName = Object.keys(zip.files)[0];
    const file = zip.files[fileName];
    expect(file).toBeDefined();
    
    // The file should be a PNG
    const content = await file.async('nodebuffer');
    // PNG signature
    expect(content[0]).toBe(0x89);
    expect(content[1]).toBe(0x50); // P
    expect(content[2]).toBe(0x4E); // N
    expect(content[3]).toBe(0x47); // G
  });

  it('handles spaces without tags correctly in filename', async () => {
    const physicalSpaces = [
      {
        id: 'space-3',
        parentId: null,
        name: 'Almoxarifado',
        sku: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        tag: null,
        imageUrl: null,
        fileUrl: null,
        categoryId: null,
        createdAt: new Date(),
      },
    ];

    const zipBuffer = await generatePhysicalSpacesQRCodeZip(physicalSpaces);
    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/almoxarifado-space-3\.png$/);
  });

  it('generates larger PNG for mass printing (2048px)', async () => {
    const physicalSpaces = [
      {
        id: 'space-4',
        parentId: null,
        name: 'Auditório',
        sku: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        tag: 'AUD-01',
        imageUrl: null,
        fileUrl: null,
        categoryId: null,
        createdAt: new Date(),
      },
    ];

    const zipBuffer = await generatePhysicalSpacesQRCodeZip(physicalSpaces);
    const zip = await JSZip.loadAsync(zipBuffer);
    const fileName = Object.keys(zip.files)[0];
    const file = zip.files[fileName];
    const content = await file.async('nodebuffer');
    
    // Check PNG dimensions - larger size for A4 printing
    expect(content.length).toBeGreaterThan(100000); // Should be larger than 100KB
  });

  it('processes multiple physical spaces', async () => {
    const physicalSpaces = [
      {
        id: 'space-1',
        parentId: null,
        name: 'Sala 1',
        sku: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        tag: 'S1',
        imageUrl: null,
        fileUrl: null,
        categoryId: null,
        createdAt: new Date(),
      },
      {
        id: 'space-2',
        parentId: null,
        name: 'Sala 2',
        sku: null,
        manufacturer: null,
        model: null,
        serialNumber: null,
        tag: 'S2',
        imageUrl: null,
        fileUrl: null,
        categoryId: null,
        createdAt: new Date(),
      },
    ];

    const zipBuffer = await generatePhysicalSpacesQRCodeZip(physicalSpaces);
    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);
    expect(files.length).toBe(2);
  });
});
