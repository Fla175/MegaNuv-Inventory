// pages/inventory-view.tsx
import { useState, useEffect, useCallback }from 'react'; // Importado useCallback
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import {
  Box,
  MapPin,
  Layers,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Trash2,
  X,
} from 'lucide-react';

// --- Tipagens ---
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

// --- Constante ---
// Certifique-se de que este valor é EXATAMENTE o SKU do seu item de localização
const LOCATION_SKU = "INTERNAL_LOCATION_SPACE"

// --- Componente Principal ---
export default function InventoryView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentInstance, setParentInstance] = useState<ItemInstance | null>(null);
  const [subSpaces, setSubSpaces] = useState<ItemInstance[]>([]);
  const [containedItems, setContainedItems] = useState<ItemInstance[]>([]);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'subspace' | 'item' | null>(null);
  const [locationItemId, setLocationItemId] = useState<string | null>(null);

  // --- Funções de Busca ---

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { location, instanceId, serialNumber } = router.query;

    if (!router.isReady) {
      setLoading(false);
      return;
    }

    if (!location && !instanceId && !serialNumber) {
      setLoading(false);
      setError('Por favor, forneça um parâmetro de busca (location, instanceId ou serialNumber).');
      return;
    }

    let queryParam = '';
    let displayLocationName: string | null = null;

    if (location) {
      queryParam = `location=${encodeURIComponent(String(location))}`;
      displayLocationName = String(location);
    } else if (instanceId) {
      queryParam = `id=${encodeURIComponent(String(instanceId))}`;
      displayLocationName = `Instância: ${String(instanceId)}`;
    } else if (serialNumber) {
      queryParam = `serialNumber=${encodeURIComponent(String(serialNumber))}`;
      displayLocationName = `N. Série: ${String(serialNumber)}`;
    }

    queryParam += '&fetchChildren=true';

    try {
      const response = await fetch(`/api/item-instances/list?${queryParam}`, {});
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao buscar inventário.');
      }

      const data = await response.json();
      const parent = data.itemInstances[0] as ItemInstance;

      if (!parent) {
        setParentInstance(null);
        setSubSpaces([]);
        setContainedItems([]);
        setLoading(false);
        setError("Nenhum item ou localização encontrado para esta busca.");
        return;
      }

      setParentInstance(parent);
      setLocationName(parent.location || parent.serialNumber || parent.item?.name || 'Localização Desconhecida');

      const children = parent.children || [];
      const spaces = children.filter(child => child.item.sku === LOCATION_SKU);
      const items = children.filter(child => child.item.sku !== LOCATION_SKU);

      setSubSpaces(spaces);
      setContainedItems(items);

      let currentTotalCost = 0;
      let currentTotalPrice = 0;
      children.forEach(instance => {
        if (instance.item) {
          currentTotalCost += instance.item.cost ?? 0;
          currentTotalPrice += instance.item.price ?? 0;
        }
      });

      setTotalCost(currentTotalCost);
      setTotalPrice(currentTotalPrice);

    } catch (err: any) {
      console.error('Erro ao buscar inventário:', err);
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
    
  // Array de dependências para o useCallback
  }, [router.query, router.isReady]);

  const fetchLocationItemId = useCallback(async () => {
    try {
      const itemResponse = await fetch("/api/internal/ensure-location-item", {
        credentials: "include",
      });
      if (!itemResponse.ok) throw new Error("Falha ao buscar ID de item de localização.");
      const itemData = await itemResponse.json();
      setLocationItemId(itemData.locationItemId);
    } catch (err: any) {
      console.error(err);
      setError((prevError) => prevError || err.message || "Erro ao buscar ID de localização.");
    }
  }, []); // Sem dependências

  // --- useEffect ---
  useEffect(() => {
    if (router.isReady) {
      fetchInventory();
      fetchLocationItemId();
    }
  }, [router.isReady, fetchInventory, fetchLocationItemId]);


  // --- Funções de Ação (CRUD) ---

  const handleDeleteChild = async (childId: string, isRecursive: boolean = false) => {
    const query = new URLSearchParams({
      childId: childId,
      recursive: isRecursive.toString()
    }).toString();

    const url = `/api/item-instances/children/delete?${query}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Falha ao deletar item/subespaço.");
      }

      alert(`Deletado com sucesso! (ID: ${childId})`);
      await fetchInventory(); // Recarrega

    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      alert(`Erro: ${err.message}`);
    }
  };

  const handleAddChild = (type: 'subspace' | 'item') => {
    if (!parentInstance) return;

    if (type === 'subspace' && !locationItemId) {
      alert("Erro: ID do item de localização não carregado. Tente recarregar a página.");
      return;
    }
    
    if (type === 'item') {
      alert("A adição de 'Itens' (que não são subespaços) ainda precisa de um seletor de 'Item' (produto). Focando no subespaço.");
      // Se quiser bloquear a adição de 'item' por enquanto, descomente o 'return' abaixo
      // return; 
    }

    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCreateChild = async (formData: { serialNumber: string, location: string, notes: string }) => {
    if (!parentInstance || !modalType) return;

    let itemIdToUse: string | null = null;

    if (modalType === 'subspace') {
      itemIdToUse = locationItemId;
    } else {
      // **Lógica futura aqui**
      // Temporariamente usando o ID de localização para 'item' também, 
      // já que o seletor de 'Item' (produto) não está implementado.
      // O ideal seria travar ou implementar o seletor.
      // Vamos assumir que o 'item' usa o mesmo ID do 'subspace' por enquanto,
      // embora isso esteja conceitualmente errado se 'item' for um produto diferente.
      
      // AVISO: Usando locationItemId para 'item' como placeholder
      itemIdToUse = locationItemId; 
      // Se você tiver um 'itemId' de placeholder para itens, use-o.
      // Se o 'item' (produto) precisar ser selecionado, esta lógica precisa mudar.
    }

    if (!itemIdToUse) {
      alert("Erro: ID do item não encontrado.");
      return;
    }

    setLoading(true); // Opcional: mostrar loading no modal

    try {
      const response = await fetch('/api/item-instances/children/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          parentId: parentInstance.id,
          itemId: itemIdToUse,
          serialNumber: formData.serialNumber,
          location: formData.location,
          notes: formData.notes,
          isInUse: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Falha ao adicionar filho.");
      }

      setIsModalOpen(false);
      alert("Adicionado com sucesso!");
      await fetchInventory(); // Recarregar a lista

    } catch (err: any) {
      console.error("Erro ao criar filho:", err);
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubspaceContents = (instance: ItemInstance) => {
    router.push(`/inventory-view?location=${instance.location}`);
  };


  // --- Renderização ---

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-700 bg-gray-100">Carregando inventário...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 bg-gray-100">Erro: {error}</div>;
  
  if (!parentInstance) return <div className="min-h-screen flex items-center justify-center text-gray-700 bg-gray-100">Nenhum item ou localização encontrado para esta busca.</div>;

  return (
    <Layout title={`Inventário MegaNuv - ${locationName || 'Visualização'}`}>
      <div className="max-w-6xl mx-auto p-4 sm:p-0 font-inter">
        <Head>
          <title>Inventário MegaNuv - {locationName || 'Visualização'}</title>
        </Head>

        {/* Header e Botões de Ação */}
        <div className="bg-white border-b border-gray-200 pt-6 pl-6 pr-6 pb-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800 transition duration-150 font-medium"
            >
              <ArrowLeft size={20} className="mr-2" />
              Voltar
            </button>
            <div className='flex space-x-3'>
              <button
                  onClick={() => handleAddChild('subspace')}
                  className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 mr-4 rounded-xl shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition duration-300 ease-in-out text-sm"
              >
                  <Layers size={18} className="mr-2" />
                  Novo Subespaço
              </button>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-blue-950 text-left mb-3 flex items-center">
            <MapPin size={36} className="mr-3 text-blue-600" />
            {locationName || 'Detalhamento'}
          </h1>
          {parentInstance.notes && (
             <p className="text-gray-700 italic border-l-4 border-gray-200 pl-3 ml-4">
              {parentInstance.notes}
            </p>
          )}

          {/* Totais */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6 ml-4 mr-4 pt-4 border-t border-gray-100 border- text-center">
            <div className="bg-blue-50 p-4 rounded-xl shadow-inner">
              <p className="text-blue-700 text-base font-medium">Custo Total Contido:</p>
              <p className="text-blue-900 text-2xl font-bold">R$ {totalCost.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        </div>

        {/* Seção de Subespaços */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-indigo-900 mb-4 border-b pb-2 flex items-center">
            <Layers size={24} className="mr-2 text-indigo-500" />
            Subespaços ({subSpaces.length})
          </h2>
          {subSpaces.length === 0 ? (
            <p className="text-gray-500 italic py-4">Nenhum subespaço dentro desta localização.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subSpaces.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200 flex justify-between items-center"
                >
                  <div 
                    className="cursor-pointer flex-grow mr-2" 
                    onClick={() => handleViewSubspaceContents(sub)}
                  >
                    <h3 className="text-lg font-semibold text-indigo-800">{sub.location || sub.serialNumber}</h3>
                    <p className="text-sm text-indigo-600 line-clamp-1">{sub.notes || 'Subespaço sem descrição.'}</p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const recursive = window.confirm(
                        "Você quer deletar também TODOS os itens e subespaços DENTRO deste subespaço?\n\n'OK' = Deletar TUDO dentro (recursivo).\n'Cancelar' = Deletar APENAS o subespaço (se estiver vazio)."
                      );
                      handleDeleteChild(sub.id, recursive);
                    }}
                    className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition duration-200"
                    title="Deletar Subespaço"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seção de Itens Contidos */}
        <div>
          <h2 className="text-2xl font-bold text-teal-900 mb-4 border-b pb-2 flex items-center">
            <Box size={24} className="mr-2 text-teal-500" />
            Itens Contidos ({containedItems.length})
          </h2>
          {containedItems.length === 0 ? (
            <p className="text-gray-500 italic py-4">Nenhum item direto dentro desta localização.</p>
          ) : (
            <div className="space-y-4">
              {containedItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-md hover:shadow-lg transition duration-200 flex justify-between items-center">
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{item.item?.name || 'Item Desconhecido'}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                      <p><strong>N. Série:</strong> {item.serialNumber}</p>
                      <p><strong>Custo:</strong> R$ {item.item?.cost ? item.item.cost.toFixed(2).replace('.', ',') : 'N/A'}</p>
                      <p className="col-span-2 sm:col-span-4 text-xs italic">
                        Notas: {item.notes || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Itens geralmente não são recursivos, mas a API suporta
                      const recursive = window.confirm(
                        "Tem certeza que deseja deletar este item?\n\n(Se este item contiver outros itens, eles também serão deletados se você selecionar 'OK' para recursivo)."
                      );
                      // Para itens, geralmente é false, a menos que um item possa conter outros
                      handleDeleteChild(item.id, false); 
                    }}
                    className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition duration-200 ml-4"
                    title="Deletar Item"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal */}
      {isModalOpen && (
        <AddChildModal
          type={modalType}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateChild}
        />
      )}
    </Layout>
  );
}


// --- Componente Modal ---
// (Fora do componente InventoryView, no mesmo arquivo)

interface AddChildModalProps {
  type: 'subspace' | 'item' | null;
  onClose: () => void;
  onSubmit: (formData: { serialNumber: string, location: string, notes: string }) => void;
}

function AddChildModal({ type, onClose, onSubmit }: AddChildModalProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState(''); // Nome/Localização
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber || !location) {
      alert("Número de Série e Nome (Localização) são obrigatórios.");
      return;
    }
    onSubmit({ serialNumber, location, notes });
  };
  
  const title = type === 'subspace' ? "Adicionar Novo Subespaço" : "Adicionar Novo Item";
  const locationLabel = type ==='subspace' ? "Nome do Subespaço" : "Nome/Localização do Item";

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl z-50 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {type === 'item' && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 text-sm">
                <strong>Atenção:</strong> A seleção de 'Item' (Produto) ainda não foi implementada. Esta funcionalidade (WIP) usará o ID de localização padrão.
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">{locationLabel}*</label>
              <input
                type="text"
                value={location}
                placeholder='Ex: gaveta 01'
                onChange={(e) => setLocation(e.target.value)}
                className="
                mt-1
                block
                w-full
                border
                border-gray-300
                rounded-md
                shadow-sm
                p-2
                text-gray-700
                placeholder:text-gray-400
                focus:ring-blue-500
                focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Série*</label>
              <input
                type="text"
                value={serialNumber}
                placeholder='Ex: GAV-001'
                onChange={(e) => setSerialNumber(e.target.value)}
                className="
                mt-1
                block
                w-full
                border
                border-gray-300
                rounded-md
                shadow-sm
                p-2
                text-gray-700
                placeholder:text-gray-400
                focus:ring-blue-500
                focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="
                mt-1
                block
                w-full
                border
                border-gray-300
                rounded-md
                shadow-sm
                p-2
                text-gray-700
                placeholder:text-gray-400
                focus:ring-blue-500
                focus:border-blue-500"
                required
                rows={3}
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
