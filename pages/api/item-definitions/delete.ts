// pages/api/item-definitions/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Corrigido para usar o singleton
import { Prisma } from '@prisma/client';
import { deleteFileFromMinio } from '@/lib/minio'; // Importamos o helper

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { id } = req.query; 

    if (typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ success: false, message: 'Missing or invalid Item Definition ID.' });
    }

    try {
        // 1. Buscamos o item primeiro para pegar a URL da imagem
        const definition = await prisma.itemDefinition.findUnique({
            where: { id: id },
            select: { imageUrl: true }
        });

        if (!definition) {
            return res.status(404).json({ success: false, message: `Item Definition not found.` });
        }

        // 2. Se tiver imagem, deletamos do MinIO
        if (definition.imageUrl) {
            await deleteFileFromMinio(definition.imageUrl);
        }

        // 3. Deletamos o registro do banco
        await prisma.itemDefinition.delete({
            where: { id: id },
        });

        console.log(`[API Prisma] Item Definition ${id} and its image deleted successfully.`);

        return res.status(200).json({ success: true, message: `Item Definition deleted successfully.` });

    } catch (error) {
        // Erro de restrição de chave estrangeira (se houver itens usando essa definição)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2003') {
                return res.status(409).json({ 
                    success: false, 
                    message: "Não é possível excluir este produto pois existem itens ativos vinculados a ele no inventário." 
                });
             }
        }
        
        console.error(`[API Prisma] Error deleting Item Definition ${id}:`, error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error while deleting definition.', 
            error: (error as Error).message 
        });
    }
}