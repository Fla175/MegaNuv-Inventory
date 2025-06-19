// pages/api/sync/contaazul-products.ts (Correções de Tipagem e Capitalização)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../../../lib/prisma';
import { verifyAuthToken, AuthTokenPayload } from '../../../lib/auth';

const CONTAAZUL_API_BASE_URL = 'https://api-v2.contaazul.com';
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let authenticatedUserId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decodedPayload: AuthTokenPayload | null = verifyAuthToken(token);
    if (decodedPayload && decodedPayload.userId) {
      authenticatedUserId = decodedPayload.userId;
    } else {
      console.warn('Token JWT decodificado inválido ou sem ID para sincronização.');
      return res.status(401).json({ message: 'Não autorizado: Token JWT inválido ou ausente.' });
    }
  } else {
    console.warn('Cabeçalho de autenticação Bearer não encontrado para sincronização.');
    return res.status(401).json({ message: 'Não autorizado: É necessário um token de autenticação JWT válido.' });
  }

  if (!authenticatedUserId) {
    return res.status(500).json({ message: 'Erro interno do servidor: Usuário não identificado para sincronização.' });
  }

  try {
    let integration = await prisma.contaAzulIntegration.findUnique({ // CORREÇÃO: capitalização prisma.contaAzulIntegration
      where: { userId: authenticatedUserId },
      select: { accessToken: true, refreshToken: true, expiresAt: true },
    });

    if (!integration || !integration.accessToken || !integration.refreshToken) {
      return res.status(404).json({ message: 'Integração Conta Azul não encontrada para este usuário ou tokens ausentes.' });
    }

    const now = new Date();
    const tokenIsExpiredOrSoonToExpire = integration.expiresAt.getTime() - now.getTime() < (5 * 60 * 1000);

    if (tokenIsExpiredOrSoonToExpire) {
      console.log(`Access token para ${authenticatedUserId} expirado ou prestes a expirar. Tentando refrescar para sincronização...`);
      try {
        const refreshUrl = `${NEXT_PUBLIC_BASE_URL}/api/contaazul/refresh-access-token`;
        const refreshResponse = await axios.post(refreshUrl, {}, {
          headers: {
            'Authorization': `Bearer ${authHeader.split(' ')[1]}`,
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
          },
          timeout: 10000
        });

        if (refreshResponse.status === 200) {
          const reloadedIntegration = await prisma.contaAzulIntegration.findUnique({ // CORREÇÃO: capitalização prisma.contaAzulIntegration
            where: { userId: authenticatedUserId },
            select: { accessToken: true, refreshToken: true, expiresAt: true },
          });

          // CORREÇÃO: Atribuição garantida e verificação de nulo
          if (reloadedIntegration && reloadedIntegration.accessToken) {
            integration = reloadedIntegration;
          } else {
            throw new Error('Falha ao recuperar novo access token após refresh para sincronização. Integração recarregada é nula ou sem token.');
          }
          console.log(`Access token para ${authenticatedUserId} refrescado com sucesso para sincronização.`);
        }
      } catch (refreshError) {
        console.error('Erro ao refrescar o access token para sincronização. O usuário pode precisar reautorizar a Conta Azul.', refreshError);
        if (axios.isAxiosError(refreshError) && refreshError.response) {
          console.error('Refresh API Error Response (Sinc):', refreshError.response.data);
        }
        return res.status(401).json({ message: 'Token da Conta Azul expirado para sincronização. Por favor, reautorize a integração com a Conta Azul.' });
      }
    }

    // A partir daqui, integration é garantido como não nulo devido às verificações anteriores
    // Se o código chegasse aqui e integration fosse nulo, o erro 404 já teria sido retornado.

    let currentPage = 1;
    let totalPages = 1;
    let productsSynced = 0;

    console.log(`Iniciando sincronização de produtos da Conta Azul para o usuário ${authenticatedUserId}.`);

    do {
      const productsResponse = await axios.get(`${CONTAAZUL_API_BASE_URL}/v1/produto/busca`, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`, // CORREÇÃO: integration é garantido como não nulo aqui
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

        const existingItem = await prisma.item.findUnique({
          where: { contaAzulId: id },
        });

        // Mapeamento dos dados para o seu modelo Item
        const dataToUpsert: any = { // Usar 'any' temporariamente para facilitar o mapeamento de tipos do JSON
          contaAzulId: id,
          idLegado: id_legado ?? null, // Use nullish coalescing operator (??) para valores null/undefined
          name: nome,
          sku: codigo_sku,
          ean: codigo_ean ?? null,
          description: "", // Manter vazio se não vier da CA
          stockQuantity: estoque ?? 0,
          price: valor_venda ?? 0.00,
          cost: custo_medio ?? null,
          type: tipo ?? "PRODUTO",
          status: status ?? "ACTIVE",
          
          variacao: variacao ?? null,
          stockLevel: nivel_estoque ?? null,
          minStockQuantity: estoque_minimo ?? null,
          maxStockQuantity: estoque_maximo ?? null,
          isMoved: movimentado ?? false,
          idParent: id_pai ?? null,
          isEcommerceIntegrated: integracao_ecommerce_ativa ?? false,

          tags: [], // Tags são gerenciadas localmente, inicie como vazio ou preserve se já houver
          
          lastContaAzulSync: new Date(),
          updatedAt: new Date(),
        };

        if (existingItem) {
          // Atualiza o item existente
          await prisma.item.update({
            where: { id: existingItem.id },
            data: dataToUpsert,
          });
        } else {
          // Cria um novo item
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

  } catch (error) {
    console.error('Erro ao sincronizar produtos da Conta Azul:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Conta Azul API Error Response (Sinc):', error.response.data);
      return res.status(error.response.status).json({
        message: 'Erro ao sincronizar produtos da Conta Azul.',
        details: error.response.data,
        status: error.response.status,
      });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
