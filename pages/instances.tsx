// pages/instances.tsx (Adiciona max-w ao Wrapper Interno)

import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import Head from 'next/head';

// Reusando interfaces (pode ser centralizado em um arquivo de tipos)
interface Item {
  id: string;
  name: string;
  sku: string | null;
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
  item: Item; // O Item (produto) associado
  parent?: { // Dados básicos do ItemInstance pai
    id: string;
    serialNumber: string;
    location: string | null;
  };
  children?: ItemInstance[]; // Instâncias filhas (não incluiremos por padrão nesta lista)
}

export default function InstancesPage() {
  const [instances, setInstances] = useState<ItemInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para o formulário de nova instância
  const [newItemId, setNewItemId] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newIsInUse, setNewIsInUse] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Estados para buscar Itens e ItemInstances para os dropdowns (selects)
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [availableParents, setAvailableParents] = useState<ItemInstance[]>([]);

  // Funções de fetch
  const fetchInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/item-instances/list?fetchChildren=false', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao buscar instâncias.');
      }
      const data = await response.json();
      setInstances(data.itemInstances);
    } catch (err: any) {
      console.error('Erro ao buscar instâncias:', err);
      setError(err.message || 'Ocorreu um erro ao carregar as instâncias.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItemsAndParents = async () => {
    try {
      const itemsResponse = await fetch('/api/items/list', { credentials: 'include' });
      if (itemsResponse.ok) {
        const data = await itemsResponse.json();
        setAvailableItems(data.items.filter((item: Item) => item.sku !== 'INTERNAL_LOCATION_SPACE'));
      } else {
        console.error('Falha ao buscar itens disponíveis.');
      }

      const parentsResponse = await fetch('/api/item-instances/list?fetchChildren=false', { credentials: 'include' });
      if (parentsResponse.ok) {
        const data = await parentsResponse.json();
        setAvailableParents(data.itemInstances);
      } else {
        console.error('Falha ao buscar itens pais disponíveis.');
      }
    } catch (err) {
      console.error('Erro ao buscar opções para formulário:', err);
    }
  };

  useEffect(() => {
    fetchInstances();
    fetchAvailableItemsAndParents();
  }, []);

  const handleCreateInstance = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch('/api/item-instances/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId: newItemId,
          serialNumber: newSerialNumber,
          location: newLocation || null,
          isInUse: newIsInUse,
          notes: newNotes || null,
          parentId: newParentId || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao criar instância.');
      }

      alert('Instância criada com sucesso!'); 
      
      setNewItemId('');
      setNewSerialNumber('');
      setNewLocation('');
      setNewIsInUse(false);
      setNewNotes('');
      setNewParentId('');
      fetchInstances();
      fetchAvailableItemsAndParents();
    } catch (err: any) {
      console.error('Erro ao criar instância:', err);
      setFormError(err.message || 'Ocorreu um erro ao criar a instância.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Itens Físicos & Ativos - MegaNuv Inventory">
        <div className="flex items-center justify-center h-full text-gray-700">
          Carregando itens físicos...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Itens Físicos & Ativos - MegaNuv Inventory">
        <div className="text-red-600 text-center h-full flex items-center justify-center">
          Erro: {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Itens Físicos & Ativos - MegaNuv Inventory">
      {/* NOVO: Adicionado max-w-6xl mx-auto para centralizar o conteúdo da página */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8"> 
        <Head>
          <title>Itens Físicos & Ativos - MegaNuv Inventory</title>
        </Head>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Gerenciar Itens Físicos & Ativos</h1>
        
        {/* Formulário para Adicionar Nova Instância */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Adicionar Nova Instância de Item</h2>
          <form onSubmit={handleCreateInstance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="newItemId" className="block text-gray-700 text-sm font-bold mb-2">
                Tipo de Item (Definição):
              </label>
              <select
                id="newItemId"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newItemId}
                onChange={(e) => setNewItemId(e.target.value)}
                required
              >
                <option value="">Selecione um Tipo de Item</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="newSerialNumber" className="block text-gray-700 text-sm font-bold mb-2">
                Número de Série / Identificador Único:
              </label>
              <input
                type="text"
                id="newSerialNumber"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newSerialNumber}
                onChange={(e) => setNewSerialNumber(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="newLocation" className="block text-gray-700 text-sm font-bold mb-2">
                Localização (Ex: "Slot 1", "Gaveta A", "Mesa 3"):
              </label>
              <input
                type="text"
                id="newLocation"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Opcional, se já estiver dentro de um Item Pai"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="newParentId" className="block text-gray-700 text-sm font-bold mb-2">
                Item Pai (Opcional - Ex: Servidor, Rack):
              </label>
              <select
                id="newParentId"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newParentId}
                onChange={(e) => setNewParentId(e.target.value)}
              >
                <option value="">Nenhum Item Pai (Nível Superior)</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.item?.name || 'Item Desconhecido'} ({parent.serialNumber}) {parent.location ? ` - ${parent.location}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex items-center mb-4">
              <input
                type="checkbox"
                id="newIsInUse"
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={newIsInUse}
                onChange={(e) => setNewIsInUse(e.target.checked)}
              />
              <label htmlFor="newIsInUse" className="text-gray-700 text-sm font-bold">
                Está em Uso?
              </label>
            </div>
            <div className="md:col-span-2 mb-6">
              <label htmlFor="newNotes" className="block text-gray-700 text-sm font-bold mb-2">
                Notas:
              </label>
              <textarea
                id="newNotes"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
                rows={3}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              ></textarea>
            </div>
            {formError && <p className="md:col-span-2 text-red-600 text-sm mb-4">{formError}</p>}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition duration-200"
                disabled={formLoading}
              >
                {formLoading ? 'Adicionando...' : 'Criar Instância'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Instâncias Existentes */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Todas as Instâncias de Itens Físicos</h2>
          {instances.length === 0 ? (
            <p className="text-center text-gray-600">Nenhuma instância de item físico cadastrada ainda.</p>
          ) : (
            <div className="overflow-x-auto"> {/* Mantém overflow-x-auto para tabelas largas */}
              <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                <thead className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <tr>
                    <th className="py-3 px-6 text-left">N. Série</th>
                    <th className="py-3 px-6 text-left">Tipo de Item</th>
                    <th className="py-3 px-6 text-left">Localização</th>
                    <th className="py-3 px-6 text-left">Item Pai</th>
                    <th className="py-3 px-6 text-left">Em Uso?</th>
                    <th className="py-3 px-6 text-left">Custo (R$)</th>
                    <th className="py-3 px-6 text-left">Preço (R$)</th>
                    <th className="py-3 px-6 text-left">Notas</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {instances.map((instance) => (
                    <tr key={instance.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{instance.serialNumber}</td>
                      <td className="py-3 px-6 text-left">{instance.item?.name || 'Desconhecido'} ({instance.item?.sku || 'N/A'})</td>
                      <td className="py-3 px-6 text-left">{instance.location || 'N/A'}</td>
                      <td className="py-3 px-6 text-left">
                        {instance.parentId ? `${instance.parent?.serialNumber || 'N/A'} (${instance.parent?.location || 'N/A'})` : 'Nenhum'}
                      </td>
                      <td className="py-3 px-6 text-left">{instance.isInUse ? 'Sim' : 'Não'}</td>
                      <td className="py-3 px-6 text-left">R$ {instance.item?.cost ? instance.item.cost.toFixed(2).replace('.', ',') : 'N/A'}</td>
                      <td className="py-3 px-6 text-left">R$ {instance.item?.price ? instance.item.price.toFixed(2).replace('.', ',') : 'N/A'}</td>
                      <td className="py-3 px-6 text-left max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={instance.notes || ''}>{instance.notes || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
