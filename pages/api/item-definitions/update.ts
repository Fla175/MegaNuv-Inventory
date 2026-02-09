// pages/api/item-definitions/update.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query; 
    if (typeof id !== 'string') return res.status(400).json({ message: 'Invalid ID' });

    if (req.method === 'PUT' || req.method === 'PATCH') {
        try {
            const { name, sku, imageUrl, brand, line } = req.body;
            const updateData: any = {};

            if (name !== undefined) updateData.name = String(name);
            if (sku !== undefined) updateData.sku = String(sku).toUpperCase().trim();
            if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
            if (brand !== undefined) updateData.brand = brand || null;
            if (line !== undefined) updateData.line = line || null;

            const updated = await prisma.itemDefinition.update({
                where: { id },
                data: updateData,
            });
            return res.status(200).json({ success: true, item: updated });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    return res.status(405).end();
}