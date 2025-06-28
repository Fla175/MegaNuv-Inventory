// pages/api/contaazul/products.ts (Lê JWT do Authorization Header)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth';
import * as cookie from 'cookie';
import { Prisma } from '@prisma/client';

const CONTA_AZUL_API_V2_BASE_URL = process.env.CONTA_AZUL_API_V2_BASE_URL || 'https://api-v2.contaazul.com';
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- CORREÇÃO: Obter userId do cabeçalho Authorization ou cookie ---
  let authenticatedUserId: string | undefined;
  const authHeader = req.headers.authorization;
  const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
  const tokenFromCookie = cookies.auth_token;

  let tokenToVerify: string | null = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokenToVerify = authHeader.split(' ')[1];
  } else if (tokenFromCookie) {
    tokenToVerify = tokenFromCookie;
  }

  if (!tokenToVerify) {
    console.warn('Token de autenticação ausente no cabeçalho ou cookie para sincronização.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação JWT válido.' });
  }

  const decodedPayload: AuthTokenPayload | null = verifyAuthToken(tokenToVerify);
  if (decodedPayload && decodedPayload.userId) {
    authenticatedUserId = decodedPayload.userId;
  } else {
    console.warn('Token JWT inválido ou sem ID para sincronização.');
    return res.status(401).json({ message: 'Não autorizado: Token JWT inválido ou ausente.' });
  }
  // --- FIM DA CORREÇÃO ---

  if (!authenticatedUserId) {
    return res.status(500).json({ message: 'Erro interno do servidor: Usuário não identificado para sincronização.' });
  }

  try {
    let integration = await prisma.contaAzulIntegration.findUnique({
      where: { userId: authenticatedUserId },
      select: { accessToken: true, refreshToken: true, expiresAt: true },
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integração Conta Azul não encontrada para este usuário ou tokens ausentes. Por favor, configure a integração primeiro.' });
    }

    const now = new Date();
    const tokenIsExpiredOrSoonToExpire = integration.expiresAt.getTime() - now.getTime() < (5 * 60 * 1000);

    if (tokenIsExpiredOrSoonToExpire) {
      console.log(`Access token para ${authenticatedUserId} expirado ou prestes a expirar. Tentando refrescar para sincronização...`);
      try {
        const refreshUrl = `${NEXT_PUBLIC_BASE_URL}/api/contaazul/refresh-access-token`;

        const refreshResponse = await axios.post(refreshUrl, {}, {
          headers: {
            'Authorization': `Bearer ${tokenToVerify}`, // Repassa o JWT do usuário
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
          },
          timeout: 10000
        });

        if (refreshResponse.status === 200) {
          const reloadedIntegration = await prisma.contaAzulIntegration.findUnique({
            where: { userId: authenticatedUserId },
            select: { accessToken: true, refreshToken: true, expiresAt: true },
          });

          if (reloadedIntegration && reloadedIntegration.accessToken) {
            integration = reloadedIntegration;
          } else {
            throw new Error('Falha ao recuperar novo access token após refresh para sincronização. Integração recarregada é nula ou sem token.');
          }
          console.log(`Access token para ${authenticatedUserId} refrescado com sucesso para sincronização.`);
        }
      } catch (refreshError: any) {
        console.error('Erro ao refrescar o access token para sincronização. O usuário pode precisar reautorizar a Conta Azul.', refreshError.response?.data || refreshError.message);
        return res.status(401).json({ message: 'Token da Conta Azul expirado ou inválido para sincronização. Por favor, reautorize a integração com a Conta Azul.' });
      }
    }

    let currentPage = 1;
    let productsSynced = 0;
    let totalPages = 1;

    console.log(`Iniciando sincronização de produtos da Conta Azul para o usuário ${authenticatedUserId}.`);

    do {
      const productsResponse = await axios.get(`${CONTA_AZUL_API_V2_BASE_URL}/v1/produto/busca`, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        params: {
          pagina: currentPage,
          tamanho_pagina: 50,
          status: 'TODOS',
        },
        timeout: 15000
      });

      const { itens, itens_totais } = productsResponse.data;

      if (itens_totais === 0 && currentPage === 1) {
        console.log('Nenhum produto encontrado na Conta Azul para sincronizar.');
        break;
      }
      if (itens.length === 0) {
        break;
      }

      for (const contaAzulProduct of itens) {
        const {
          id,
          id_legado,
          nome,
          codigo_sku,
          codigo_ean,
          tipo,
          status,
          estoque,
          valor_venda,
          custo_medio,
          variacao,
          nivel_estoque,
          estoque_minimo,
          estoque_maximo,
          movimentado,
          id_pai,
          integracao_ecommerce_ativa
        } = contaAzulProduct;

        const dataToUpsert: any = {
          contaAzulId: id,
          idLegado: id_legado ?? null,
          name: nome,
          sku: codigo_sku,
          ean: codigo_ean ?? null,
          description: "",
          stockQuantity: estoque ?? 0,
          price: valor_venda ? new Prisma.Decimal(valor_venda) : new Prisma.Decimal(0),
          cost: custo_medio ? new Prisma.Decimal(custo_medio) : null,
          type: tipo ?? "PRODUTO",
          status: status ?? "ACTIVE",

          variacao: variacao ?? null,
          stockLevel: nivel_estoque ?? null,
          minStockQuantity: estoque_minimo ?? null,
          maxStockQuantity: estoque_maximo ?? null,
          isMoved: movimentado ?? false,
          idParent: id_pai ?? null,
          isEcommerceIntegrated: integracao_ecommerce_ativa ?? false,

          tags: Prisma.JsonNull,

          lastContaAzulSync: new Date(),
          updatedAt: new Date(),
        };

        const existingItem = await prisma.item.findUnique({
          where: { contaAzulId: id },
        });

        if (existingItem) {
          await prisma.item.update({
            where: { id: existingItem.id },
            data: dataToUpsert,
          });
        } else {
          await prisma.item.create({
            data: {
              ...dataToUpsert,
              createdAt: new Date(),
            },
          });
        }
        productsSynced++;
      }

      totalPages = Math.ceil(itens_totais / 50);
      currentPage++;

    } while (currentPage <= totalPages);

    console.log(`Sincronização concluída. ${productsSynced} produtos sincronizados/atualizados.`);

    return res.status(200).json({ message: `Sincronização concluída com sucesso. ${productsSynced} produtos sincronizados/atualizados.`, syncedCount: productsSynced });

  } catch (error: any) {
    console.error('Erro ao sincronizar produtos da Conta Azul:', error.response?.data || error.message);
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401 && error.response.data.error === 'invalid_token') {
        return res.status(401).json({ message: 'Token da Conta Azul expirado ou inválido. Por favor, reautorize a integração com a Conta Azul.', details: error.response.data });
      }
      return res.status(error.response.status).json({
        message: 'Erro ao buscar produtos da Conta Azul.',
        details: error.response.data,
        status: error.response.status,
      });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
