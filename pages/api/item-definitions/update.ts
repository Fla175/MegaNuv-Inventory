// pages/api/item-definitions/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Corrigido para usar o singleton
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query; 
    const { method } = req;

    if (typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ success: false, message: 'Missing or invalid Item Definition ID.' });
    }

    switch (method) {
        case 'PUT':
        case 'PATCH':
            try {
                // Adicionado imageUrl na desestruturação
                const { name, sku, imageUrl } = req.body;
                
                const updateData: Prisma.ItemDefinitionUpdateInput = {};

                if (name !== undefined) updateData.name = String(name);
                if (sku !== undefined) updateData.sku = String(sku).toUpperCase().trim();
                
                // Lógica de atualização da imagem
                if (imageUrl !== undefined) {
                    updateData.imageUrl = imageUrl || null; 
                    // Nota: Se quiser ser muito avançado no futuro, aqui você poderia buscar o item antigo
                    // e deletar a imagem antiga do MinIO caso a nova seja diferente.
                    // Por enquanto, vamos apenas atualizar o link.
                }

                const updatedDefinition = await prisma.itemDefinition.update({
                    where: { id: id },
                    data: updateData,
                });

                console.log(`[API Prisma] Item Definition ${id} updated successfully.`);
                return res.status(200).json({ success: true, item: updatedDefinition });

            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') {
                        return res.status(404).json({ success: false, message: `Item Definition not found.` });
                    }
                    if (error.code === 'P2002') {
                        return res.status(409).json({ success: false, message: 'SKU already exists.' });
                    }
                }
                
                console.error(`[API Prisma] Error updating Item Definition ${id}:`, error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal Server Error while updating definition.', 
                    error: (error as Error).message 
                });
            }
        
        default:
            res.setHeader('Allow', ['PUT', 'PATCH']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}