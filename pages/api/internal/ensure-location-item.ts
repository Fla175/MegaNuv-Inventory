// pages/api/internal/ensure-location-item.ts (Leitura de JWT de Cookie)

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth';
import * as cookie from 'cookie'; // Importar a biblioteca 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let authenticatedUserId: string | undefined;

  // --- INÍCIO: AUTENTICAÇÃO ATRAVÉS DO CABEÇALHO OU COOKIE ---
  const authHeader = req.headers.authorization;
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const tokenFromCookie = cookies.auth_token; // O nome do seu cookie é 'auth_token'

  let tokenToVerify: string | null = null;

  // Prioriza o cabeçalho Authorization, depois o cookie
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenToVerify = authHeader.split(' ')[1];
  } else if (tokenFromCookie) {
    tokenToVerify = tokenFromCookie;
  }

  if (!tokenToVerify) {
    console.warn('Token de autenticação ausente no cabeçalho ou cookie.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação JWT válido.' });
  }

  const decodedPayload: AuthTokenPayload | null = verifyAuthToken(tokenToVerify);

  if (decodedPayload && decodedPayload.userId) {
    authenticatedUserId = decodedPayload.userId;
  } else {
    console.warn('Token JWT inválido ou sem ID do usuário.');
    return res.status(401).json({ message: 'Não autorizado: Token JWT inválido.' });
  }

  if (!authenticatedUserId) {
    return res.status(500).json({ message: 'Erro interno do servidor: Usuário não identificado após decodificação.' });
  }
  // --- FIM: AUTENTICAÇÃO ATRAVÉS DO CABEÇALHO OU COOKIE ---

  try {
    const locationItemName = "Espaço Físico - Interno";
    const locationItemSku = 'INTERNAL_LOCATION_SPACE';

    let locationItem = await prisma.item.findUnique({
      where: { sku: locationItemSku },
    });

    if (!locationItem) {
      locationItem = await prisma.item.create({
        data: {
          name: locationItemName,
          sku: locationItemSku,
          stockQuantity: 0, 
          price: 0.00,
          cost: 0.00,
          type: 'SERVICE',
          status: 'ACTIVE',
          description: 'Item interno para representar espaços físicos (armários, racks, etc.). Não é um produto da Conta Azul e não possui estoque físico direto.',
          isEcommerceIntegrated: false,
        },
      });
      console.log(`[API] Novo item de localização interno criado: ${locationItem.name}`);
    } else {
      console.log(`[API] Item de localização interno encontrado: ${locationItem.name}`);
    }

    return res.status(200).json({
      message: 'Item de localização garantido!',
      locationItemId: locationItem.id,
    });

  } catch (error) {
    console.error('Erro ao garantir item de localização:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao garantir item de localização.' });
  }
}
