// pages/api/qrcode-batch/generate-zip.ts
import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { authMiddleware, AuthenticatedNextApiRequest } from '@/lib/middlewares/authMiddleware';
import { generatePhysicalSpacesQRCodeZip } from '@/lib/qrcodeBatchGenerator';

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  // Apenas ADMIN e DIRECTOR podem acessar
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'DIRECTOR') {
    return res.status(403).json({ error: 'Permissões insuficientes para esta operação.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Buscar apenas espaços físicos (isPhysicalSpace = true)
    const physicalSpaces = await prisma.active.findMany({
      where: {
        isPhysicalSpace: true,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        sku: true,
        manufacturer: true,
        model: true,
        serialNumber: true,
        tag: true,
        imageUrl: true,
        fileUrl: true,
        categoryId: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    if (!physicalSpaces || physicalSpaces.length === 0) {
      return res.status(400).json({ 
        error: 'Não existem ativos-espaços-físicos cadastrados no banco de dados.' 
      });
    }

    // Gerar ZIP com QR codes
    const zipBuffer = await generatePhysicalSpacesQRCodeZip(physicalSpaces as any);

    // Streaming direto
    const fileName = `qrcodes-espacos-fisicos-${new Date().toISOString().split('T')[0]}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', zipBuffer.length.toString());
    
    return res.send(zipBuffer);
  } catch (error: unknown) {
    console.error('Erro ao gerar ZIP de QR codes:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao gerar arquivo ZIP';
    return res.status(500).json({ error: `Erro ao gerar ZIP: ${message}` });
  }
};

export default authMiddleware(handler);
