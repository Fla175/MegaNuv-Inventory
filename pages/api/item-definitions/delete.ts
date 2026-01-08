// pages/api/item-definitions/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Captura o ID da URL (ex: /delete/abc-123)
    const { id } = req.query; 

    if (typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ success: false, message: 'Missing or invalid Item Definition ID.' });
    }

    try {
        // Tenta deletar a definição pelo ID
        await prisma.itemDefinition.delete({
            where: {
                id: id,
            },
        });

        console.log(`[API Prisma] Item Definition ${id} deleted successfully.`);

        return res.status(200).json({ success: true, message: `Item Definition ${id} deleted successfully.` });

    } catch (error) {
        // Trata erro de registro não encontrado (P2025)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ success: false, message: `Item Definition with ID ${id} not found.` });
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
