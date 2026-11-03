// lib/qrcodeBatchGenerator.ts
import JSZip from 'jszip';
import QRCode from 'qr.js';
import { deflateSync } from 'zlib';

interface PhysicalSpaceQRData {
  id: string;
  parentId: string | null;
  name: string;
  sku: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  tag: string | null;
  imageUrl: string | null;
  fileUrl: string | null;
  categoryId: string | null;
  createdAt: Date;
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function makeCRCTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCRCTable();

function crc32(buf: Buffer): number {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type);
  const crc = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuffer, data]));
  crc.writeUInt32BE(crcValue >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function generateQRCodePNGBuffer(data: string, size: number = 2048): Buffer {
  const qr = QRCode(data);
  const modules = qr.modules;
  const moduleCount = modules.length;
  const cellSize = Math.floor(size / moduleCount);
  const actualSize = cellSize * moduleCount;
  
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const width = actualSize;
  const height = actualSize;
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 3 + 1);
    rawData[rowStart] = 0;
    const moduleY = Math.floor(y / cellSize);
    for (let x = 0; x < width; x++) {
      const moduleX = Math.floor(x / cellSize);
      const isBlack = moduleY < moduleCount && moduleX < moduleCount && modules[moduleY][moduleX];
      const idx = rowStart + 1 + x * 3;
      rawData[idx] = isBlack ? 0 : 255;
      rawData[idx + 1] = isBlack ? 0 : 255;
      rawData[idx + 2] = isBlack ? 0 : 255;
    }
  }
  
  const compressed = deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
}

export async function generatePhysicalSpacesQRCodeZip(
  physicalSpaces: PhysicalSpaceQRData[]
): Promise<Buffer> {
  const zip = new JSZip();
  
  for (const space of physicalSpaces) {
    const qrData = JSON.stringify({
      type: 'active',
      id: space.id,
      isPhysicalSpace: true,
      parentId: space.parentId,
      name: space.name,
      sku: space.sku,
      manufacturer: space.manufacturer,
      model: space.model,
      serialNumber: space.serialNumber,
      tag: space.tag,
      imageUrl: space.imageUrl,
    });
    
    const pngBuffer = generateQRCodePNGBuffer(qrData, 2048);
    
    const tagPart = space.tag ? sanitizeFileName(space.tag) : '';
    const namePart = sanitizeFileName(space.name);
    const idPart = space.id;
    
    let fileName = '';
    if (tagPart) {
      fileName = `${tagPart}-${namePart}-${idPart}.png`;
    } else {
      fileName = `${namePart}-${idPart}.png`;
    }
    
    zip.file(fileName, pngBuffer);
  }
  
  return await zip.generateAsync({ type: 'nodebuffer' });
}

export function countPhysicalSpaces(physicalSpaces: PhysicalSpaceQRData[]): number {
  return physicalSpaces.length;
}
