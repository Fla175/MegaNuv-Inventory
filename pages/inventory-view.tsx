// pages/inventory-view.tsx (Ajustado para Cookie HttpOnly)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Item {
  name: string;
  sku: string;
  contaAzulId?: string;
  status: string;
  price: number;
  cost: number | null;
}

interface ItemInstance {
  id: string;
  itemId: string;
  serialNumber: string;
  location: string | null;
  qrCodePath: string | null;
  isInUse: boolean;
  notes: string | null;
  parentId: string | null;
  item: Item;
  children?: ItemInstance[];
}

export default function InventoryView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemInstances, setItemInstances] = useState<ItemInstance[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setError(null);
      const { location, instanceId, serialNumber } = router.query;

      if (!location && !instanceId && !serialNumber) {
        setLoading(false);
        setError('Por favor, forneça um parâmetro de busca (location, instanceId ou serialNumber).');
        return;
      }

      let queryParam = '';
      let displayLocationName: string | null = null;
      let fetchChildren = false;

      if (location) {
        queryParam = `location=${encodeURIComponent(String(location))}`;
        displayLocationName = String(location);
        fetchChildren = true;
      } else if (instanceId) {
        queryParam = `id=${encodeURIComponent(String(instanceId))}`;
        displayLocationName = `Instância: ${String(instanceId)}`;
        fetchChildren = true;
      } else if (serialNumber) {
        queryParam = `serialNumber=${encodeURIComponent(String(serialNumber))}`;
        displayLocationName = `N. Série: ${String(serialNumber)}`;
        fetchChildren = true;
      }

      if (fetchChildren) {
        queryParam += '&fetchChildren=true';
      }

      try {
        // CORREÇÃO AQUI: NÃO TENTAMOS MAIS LER O JWT DO localStorage
        // O navegador enviará automaticamente o cookie HttpOnly 'auth_token'
        // se ele estiver definido para este domínio.

        const response = await fetch(`/api/item-instances/list?${queryParam}`, {
          // Headers 'Content-Type' podem ser omitidos para GET ou configurados se necessário.
          // O cabeçalho 'Authorization' NÃO é mais necessário aqui, pois o token está no cookie HttpOnly.
          // Isso é o que torna o HttpOnly seguro.
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Falha ao buscar inventário.');
        }

        const data = await response.json();
        const instances = data.itemInstances as ItemInstance[];
        setItemInstances(instances);

        let currentTotalCost = 0;
        let currentTotalPrice = 0;

        instances.forEach(instance => {
          if (instance.item) {
            currentTotalCost += instance.item.cost ?? 0;
            currentTotalPrice += instance.item.price ?? 0;
          }
          instance.children?.forEach(child => {
            if (child.item) {
              currentTotalCost += child.item.cost ?? 0;
              currentTotalPrice += child.item.price ?? 0;
            }
          });
        });

        setTotalCost(currentTotalCost);
        setTotalPrice(currentTotalPrice);

        if ((instanceId || serialNumber) && instances.length > 0) {
          setLocationName(instances[0].location || instances[0].serialNumber || instances[0].item?.name || 'Localização Desconhecida');
        } else {
          setLocationName(displayLocationName);
        }

      } catch (err: any) {
        console.error('Erro ao buscar inventário:', err);
        setError(err.message || 'Ocorreu um erro.');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchInventory();
    }
  }, [router.isReady, router.query]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-700 bg-gray-100">Carregando inventário...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 bg-gray-100">Erro: {error}</div>;
  if (itemInstances.length === 0) return <div className="min-h-screen flex items-center justify-center text-gray-700 bg-gray-100">Nenhum item encontrado para esta busca.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-inter">
      <Head>
        <title>Inventário MegaNuv - {locationName || 'Visualização'}</title>
      </Head>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">
          Inventário: {locationName || 'Detalhamento'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-md shadow-sm">
            <p className="text-blue-700 text-lg font-semibold">Custo Total dos Ativos:</p>
            <p className="text-blue-900 text-2xl font-bold">R$ {totalCost.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md shadow-sm">
            <p className="text-green-700 text-lg font-semibold">Valor Total de Venda:</p>
            <p className="text-green-900 text-2xl font-bold">R$ {totalPrice.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        {itemInstances.map((instance) => (
          <div key={instance.id} className="border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">{instance.item?.name || 'Item Desconhecido'} ({instance.serialNumber})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 mb-4">
              <p><strong>Localização:</strong> {instance.location || 'N/A'}</p>
              <p><strong>Em Uso:</strong> {instance.isInUse ? 'Sim' : 'Não'}</p>
              <p><strong>SKU:</strong> {instance.item?.sku || 'N/A'}</p>
              <p><strong>Custo:</strong> R$ {instance.item?.cost ? instance.item.cost.toFixed(2).replace('.', ',') : 'N/A'}</p>
              <p><strong>Preço Venda:</strong> R$ {instance.item?.price ? instance.item.price.toFixed(2).replace('.', ',') : 'N/A'}</p>
              {instance.notes && <p className="col-span-1 sm:col-span-2"><strong>Notas:</strong> {instance.notes}</p>}
            </div>

            {instance.children && instance.children.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Itens Dentro ({instance.serialNumber})</h3>
                <div className="space-y-3">
                  {instance.children.map((child) => (
                    <div key={child.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                      <h4 className="text-lg font-medium text-gray-700">{child.item?.name || 'Item Desconhecido'} ({child.serialNumber})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-600">
                        <p><strong>Localização:</strong> {child.location || 'N/A'}</p>
                        <p><strong>Em Uso:</strong> {child.isInUse ? 'Sim' : 'Não'}</p>
                        <p><strong>SKU:</strong> {child.item?.sku || 'N/A'}</p>
                        <p><strong>Custo:</strong> R$ {child.item?.cost ? child.item.cost.toFixed(2).replace('.', ',') : 'N/A'}</p>
                        <p><strong>Preço Venda:</strong> R$ {child.item?.price ? child.item.price.toFixed(2).replace('.', ',') : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
