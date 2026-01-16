// pages/api/item-definitions/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Captura o ID da URL dinâmica (ex: /item-definitions/abc-123)
    const { id } = req.query; 
    const { method } = req;

    if (typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ success: false, message: 'Missing or invalid Item Definition ID.' });
    }

    switch (method) {
        case 'PUT':
        case 'PATCH':
            // Lógica de ATUALIZAÇÃO (Edição)
            try {
                // Captura os dados enviados no corpo da requisição
                const { name, sku} = req.body;
                
                // Monta o objeto de dados para atualização, garantindo a conversão de tipos
                const updateData: Prisma.ItemDefinitionUpdateInput = {};

                if (name !== undefined) updateData.name = String(name);
                if (sku !== undefined) updateData.sku = String(sku).toUpperCase().trim();

                const updatedDefinition = await prisma.itemDefinition.update({
                    where: { id: id },
                    data: updateData,
                });

                console.log(`[API Prisma] Item Definition ${id} updated successfully.`);
                return res.status(200).json({ success: true, item: updatedDefinition });

            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2025') { // Registro não encontrado
                        return res.status(404).json({ success: false, message: `Item Definition with ID ${id} not found.` });
                    }
                    if (error.code === 'P2002') { // Chave única duplicada (ex: SKU já existe)
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
        
        // Você pode adicionar o método 'GET' aqui para buscar um item individualmente.
        // case 'GET':
        //    // ... lógica de GET ...
        
        default:
            res.setHeader('Allow', ['PUT', 'PATCH']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}