// pages/api/item-definitions/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // const definitions = await prisma.itemDefinition.findMany({
        //     where: {
        //         OR: [
        //             { sku: { not: LOCATION_SKU } },
        //             { sku: null }
        //         ]
        //     },
        //     orderBy: {
        //         name: 'asc',
        //     }
        // });

        const definitions = await prisma.itemDefinition.findMany({
            orderBy: { name: 'asc' }
        });

        console.log(`[API] Retornando ${definitions.length} definições do banco.`);

        return res.status(200).json({ 
            success: true, 
            items: definitions // O frontend espera esta chave "items"
        });

    } catch (error) {
        console.error('[API Error]:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Erro ao buscar definições.', 
            error: (error as Error).message 
        });
    }
}