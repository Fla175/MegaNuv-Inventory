// pages/products.tsx (Chamando nova API de listagem)

import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import Head from 'next/head';

// Reusando interfaces para consistência.
interface Item {
  id: string;
  name: string;
  sku: string | null;
  contaAzulId: string | null;
  stockQuantity: number;
  price: number; // Já vem como number da API
  cost: number | null; // Já vem como number/null da API
  status: string;
  tags?: string[]; 
  lastContaAzulSync: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // CORREÇÃO: Chamar a nova API de listagem de itens
      const response = await fetch('/api/items/list', {
        credentials: 'include', // Garante que o cookie HttpOnly seja enviado
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao buscar produtos.');
      }

      const data = await response.json();
      // CORREÇÃO: A resposta agora terá 'items' em vez de 'products'.
      setProducts(data.items || []);
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err);
      setError(err.message || 'Ocorreu um erro ao carregar os produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <Layout><div className="flex items-center justify-center py-10 text-gray-700">Carregando produtos...</div></Layout>;
  if (error) return <Layout><div className="text-red-600 py-10 text-center">Erro: {error}</div></Layout>;

  return (
    <Layout title="Definição de Produtos - MegaNuv Inventory">
      <Head>
        <title>Definição de Produtos - MegaNuv Inventory</title>
      </Head>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Definição de Produtos (Conta Azul)</h1>
        
        {products.length === 0 ? (
          <p className="text-center text-gray-600">Nenhum produto sincronizado ainda. Sincronize com a Conta Azul!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
              <thead className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-left">Nome</th>
                  <th className="py-3 px-6 text-left">SKU</th>
                  <th className="py-3 px-6 text-left">Qtd. Estoque</th>
                  <th className="py-3 px-6 text-left">Preço (R$)</th>
                  <th className="py-3 px-6 text-left">Custo (R$)</th>
                  <th className="py-3 px-6 text-left">Status</th>
                  <th className="py-3 px-6 text-left">Última Sinc.</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{product.name}</td>
                    <td className="py-3 px-6 text-left">{product.sku || 'N/A'}</td>
                    <td className="py-3 px-6 text-left">{product.stockQuantity}</td>
                    <td className="py-3 px-6 text-left">R$ {product.price ? product.price.toFixed(2).replace('.', ',') : '0,00'}</td>
                    <td className="py-3 px-6 text-left">R$ {product.cost ? product.cost.toFixed(2).replace('.', ',') : 'N/A'}</td>
                    <td className="py-3 px-6 text-left">
                      <span className={`py-1 px-3 rounded-full text-xs font-semibold 
                        ${product.status === 'ATIVO' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">{product.lastContaAzulSync ? new Date(product.lastContaAzulSync).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
