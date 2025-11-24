// pages/instances.tsx

import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Box,
  Layers,
  Combine,
  PackagePlus,
  NotebookPen,
  SendToBack,
  Grid2X2Check,
  Boxes,
  MapPin,
  FileDigit,
  Search,
  CheckSquare
} from 'lucide-react';

// --- Tipagens ---
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
  item: Item;
  parent?: {
    id: string;
    serialNumber: string;
    location: string | null;
  };
  children?: ItemInstance[]; 
}

const LOCATION_SKU = "INTERNAL_LOCATION_SPACE";

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
  const [newParentId, setNewParentId] = useState(''); // Único estado necessário agora
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Estados de Dados
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [availableParents, setAvailableParents] = useState<ItemInstance[]>([]);

  // Estados para Mover Instância
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]); 
  const [moveNewParentId, setMoveNewParentId] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveSuccess, setMoveSuccess] = useState<string | null>(null);

  // --- Helpers ---
  const isPhysicalSpace = (instance: ItemInstance): boolean => {
    return instance.item?.sku === LOCATION_SKU;
  };

  // -----------------------------------------------------------------
  // 1. FUNÇÃO HIERÁRQUICA AJUSTADA (Separando Ocultar e Desabilitar)
  // -----------------------------------------------------------------
  const renderSpaceOptions = (
    nodes: ItemInstance[], 
    depth = 0, 
    idsToHide: string[] = [], 
    idsToDisable: string[] = []
  ): React.ReactNode[] => {
    let options: React.ReactNode[] = [];

    nodes.forEach((node) => {
      // 1. Regra de Ocultação: Se não for espaço OU se for o próprio item (evita ciclo).
      // Se estiver oculto (idsToHide), o loop é interrompido (return).
      if (!isPhysicalSpace(node) || idsToHide.includes(node.id)) return;

      // Define os filhos (usa children se existir, ou busca no array plano)
      const children = (node.children && node.children.length > 0)
        ? node.children 
        : availableParents.filter(p => p.parentId === node.id);

      // Define se este item deve estar desabilitado (ex: já está aqui - idsToDisable)
      const isDisabled = idsToDisable.includes(node.id);

      // Adiciona a opção com indentação visual
      const prefix = depth > 0 ? '\u00A0\u00A0'.repeat(depth) + '↳ ' : '';
      
      options.push(
        <option 
          key={node.id} 
          value={node.id}
          disabled={isDisabled}
          className={isDisabled ? 'text-gray-400 bg-gray-50' : ''} // Estilo visual
        >
          {prefix + (node.location || node.serialNumber)} {isDisabled ? '(Atual)' : ''}
        </option>
      );

      // Recursão: Ocorre mesmo se o pai estiver desabilitado (Permite selecionar subespaços)
      if (children.length > 0) {
        options = [...options, ...renderSpaceOptions(children, depth + 1, idsToHide, idsToDisable)];
      }
    });

    return options;
  };
  // -----------------------------------------------------------------

  // --- Funções de Fetch ---
  const fetchInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/item-instances/list?fetchChildren=false', { credentials: 'include' });
      if (!response.ok) throw new Error('Falha ao buscar instâncias.');
      const data = await response.json();
      setInstances(data.itemInstances);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const fetchAvailableItemsAndParents = async () => {
    try {
      const itemsRes = await fetch('/api/items/list', { credentials: 'include' });
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setAvailableItems(data.items.filter((item: Item) => item.sku !== LOCATION_SKU));
      }
      const parentsRes = await fetch('/api/item-instances/list?fetchChildren=true', { credentials: 'include' });
      if (parentsRes.ok) {
        const data = await parentsRes.json();
        setAvailableParents(data.itemInstances);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchInstances();
    fetchAvailableItemsAndParents();
  }, []);

  // --- Lógica de Seleção Múltipla ---
  const handleToggleSelect = (id: string) => {
    setSelectedInstanceIds((prev) => prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]);
  };

  // --- Handlers de Ação ---
  const handleCreateInstance = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const finalParentId = newParentId || null;

    try {
      const response = await fetch('/api/item-instances/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemId: newItemId,
          serialNumber: newSerialNumber,
          location: newLocation || null,
          isInUse: newIsInUse,
          notes: newNotes || null,
          parentId: finalParentId,
        }),
      });

      if (!response.ok) throw new Error('Falha ao criar produto.');

      alert('Produto criado com sucesso!');
      setNewItemId('');
      setNewSerialNumber('');
      setNewLocation('');
      setNewNotes('');
      setNewParentId('');
      
      fetchInstances();
      fetchAvailableItemsAndParents();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleMoveInstance = async (event: React.FormEvent) => {
    event.preventDefault();
    setMoveLoading(true);
    setMoveError(null);
    setMoveSuccess(null);

    if (selectedInstanceIds.length === 0 || !moveNewParentId) {
      setMoveError('Selecione pelo menos um item e um destino.');
      setMoveLoading(false); return;
    }
    if (selectedInstanceIds.includes(moveNewParentId)) {
       setMoveError('Você não pode mover um item para dentro dele mesmo.');
       setMoveLoading(false); return;
    }

    try {
      const movePromises = selectedInstanceIds.map(id => 
        fetch('/api/item-instances/move', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ instanceId: id, newParentId: moveNewParentId }),
        }).then(async (res) => {
          if (!res.ok) { const err = await res.json(); throw new Error(`Erro no item ${id}: ${err.message}`); }
          return res.json();
        })
      );
      await Promise.all(movePromises);
      setMoveSuccess(`${selectedInstanceIds.length} itens movidos com sucesso!`);
      setSelectedInstanceIds([]); 
      setMoveNewParentId('');
      await fetchInstances();
      await fetchAvailableItemsAndParents();
    } catch (err: any) {
      console.error('Erro ao mover:', err);
      setMoveError(err.message || 'Erro ao mover instâncias.');
    } finally {
      setMoveLoading(false);
      setTimeout(() => { setMoveError(null); setMoveSuccess(null); }, 4000);
    }
  };

  // --- Tree View Render (Corrigida para lista plana ou aninhada) ---
  const renderTree = (nodes: ItemInstance[], depth = 0) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <div className="flex flex-col gap-1">
        {nodes.map((node) => {
          const isSpace = isPhysicalSpace(node);
          const isSelected = selectedInstanceIds.includes(node.id);
          const paddingLeft = `${depth * 1.2}rem`; 

          // Busca filhos dinamicamente se não existirem
          const children = (node.children && node.children.length > 0)
            ? node.children 
            : availableParents.filter(p => p.parentId === node.id);

          if (isSpace) {
            return (
              <div key={node.id}>
                <div 
                  className="font-semibold text-blue-900 flex items-center py-1 text-sm bg-blue-50/50 rounded mt-1"
                  style={{ paddingLeft, marginLeft: depth > 0 ? '0.5rem' : '0' }}
                >
                  <Layers className="w-3 h-3 mr-2 opacity-70" />
                  {node.location || node.serialNumber}
                </div>
                {children.length > 0 && renderTree(children, depth + 1)}
              </div>
            );
          } else {
            return (
              <div 
                key={node.id} 
                className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors text-sm ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                style={{ paddingLeft: `calc(${paddingLeft} + 0.5rem)` }}
                onClick={() => handleToggleSelect(node.id)}
              >
                <div className={`w-4 h-4 mr-2 flex items-center justify-center border rounded ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-400 bg-white'}`}>
                   {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                </div>
                <span className={isSelected ? "text-blue-800 font-medium" : "text-gray-700"}>
                  {node.item?.name || 'Item'} 
                  <span className="text-xs text-gray-400 ml-1">({node.serialNumber})</span>
                </span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (loading) return <Layout><div className="flex justify-center h-full text-gray-700">Carregando...</div></Layout>;
  if (error) return <Layout><div className="text-red-600 text-center h-full">Erro: {error}</div></Layout>;

  return (
    <Layout title="Gerenciar Itens - MegaNuv">
      <div className="max-w-6xl mx-auto py-8 px-4"> 
        <Head><title>Gerenciar Itens</title></Head>
        <h1 className="text-3xl font-bold text-blue-950 flex mb-6">
          <Box className="mr-3 text-blue-900" /> Gerenciar Itens Físicos & Ativos
        </h1>
        
        {/* Formulário de Criação */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
          <h2 className="text-2xl flex font-semibold text-blue-900 mb-4">
            <PackagePlus className="mr-2 " />
            Adicionar Novo Produto
          </h2>
          <form onSubmit={handleCreateInstance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Campos Padrão */}
            <div className="md:col-span-1">
              <label className="flex text-gray-700 text-sm font-bold mb-2"><Boxes className="mr-1 h-4 w-4" /> Tipo de Produto:</label>
              <select className="shadow border rounded w-full py-2 px-3 text-gray-600" value={newItemId} onChange={e => setNewItemId(e.target.value)} required>
                <option value="" disabled>- Selecione -</option>
                {availableItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="flex text-gray-700 text-sm font-bold mb-2"><FileDigit className="mr-1 h-4 w-4" /> Identificação:</label>
              <input type="text" className="shadow border rounded w-full py-2 px-3 text-gray-600" value={newSerialNumber} onChange={e => setNewSerialNumber(e.target.value)} placeholder="Ex: BATUN-A7" required />
            </div>
            <div className="md:col-span-1">
              <label className="flex text-gray-700 text-sm font-bold mb-2"><MapPin className="mr-1 h-4 w-4" /> Localização:</label>
              <input type="text" className="shadow border rounded w-full py-2 px-3 text-gray-600" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Opcional" />
            </div>

            {/* Input Hierárquico Único (Criação) */}
            <div className="md:col-span-1">
              <label className="flex text-gray-700 text-sm font-bold mb-2">
                <Layers className="mr-1 h-4 w-4" /> Espaço de Destino:
              </label>
              <select 
                className="shadow border rounded w-full py-2 px-3 text-gray-600 font-mono text-sm" 
                value={newParentId} 
                onChange={e => setNewParentId(e.target.value)}
              >
                <option value="">- Raiz (Sem pai) -</option>
                {/* Mostra todos os espaços em hierarquia plana */}
                {/* Aqui, o idsToHide e idsToDisable não são passados, pois não há filtro de "local atual" na criação */}
                {renderSpaceOptions(availableParents.filter(i => !i.parentId))}
              </select>
            </div>

            {/* Resto do Form */}
            <div className="md:col-span-2 flex items-center mb-4">
              <input type="checkbox" id="newIsInUse" className="mr-2 h-4 w-4" checked={newIsInUse} onChange={(e) => setNewIsInUse(e.target.checked)} />
              <label htmlFor="newIsInUse" className="text-gray-700 text-sm font-bold flex">Está em Uso? <Grid2X2Check className="ml-1 h-4 w-4" /></label>
            </div>
            <div className="md:col-span-2 mb-6">
              <label htmlFor="newNotes" className="flex text-gray-700 text-sm font-bold mb-2"><NotebookPen className="mr-1 h-4 w-4" /> Notas:</label>
              <textarea id="newNotes" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-600" rows={3} value={newNotes} onChange={(e) => setNewNotes(e.target.value)}></textarea>
            </div>
            
            {formError && <p className="md:col-span-2 text-red-600 text-sm mb-4">{formError}</p>}
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 flex rounded-md" disabled={formLoading}>
                <Layers className="mr-2" /> {formLoading ? 'Adicionando...' : 'Adicionar Produto'}
              </button>
            </div>
          </form>
        </div>

        {/* Bloco de Movimentação */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
           <h2 className="text-2xl font-semibold text-blue-900 mb-4 flex"><SendToBack className="mr-2" /> Mover Produtos</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda: Tree View de Seleção */}
            <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
              <label className="flex text-teal-800 text-sm font-bold mb-3 sticky top-0 bg-gray-50 pb-2 border-b">
                <Search className="h-4 w-4 mr-1 text-teal-600" /> Selecione os Itens ({selectedInstanceIds.length}):
              </label>
              {renderTree(availableParents.filter(p => !p.parentId))}
            </div>

            {/* Coluna Direita: Destino (Lógica Corrigida) */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-indigo-900 text-sm font-bold mb-2 flex items-center">
                  <Combine className="h-4 w-4 mr-1 text-indigo-500" /> Mover Para Dentro de:
                </label>
                
                <select 
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 font-mono text-sm" 
                  value={moveNewParentId} 
                  onChange={(e) => setMoveNewParentId(e.target.value)}
                  disabled={selectedInstanceIds.length === 0}
                >
                  <option value="">
                    {selectedInstanceIds.length === 0 
                      ? "Selecione itens à esquerda primeiro..." 
                      : "- Selecione o destino -"}
                  </option>
                  
                  {/* -------------------------------------------------------- */}
                  {/* Lógica Corrigida: Separa OCULTAR (item) de DESABILITAR (pai atual) */}
                  {/* -------------------------------------------------------- */}
                  {(() => {
                    // 1. Achar os objetos completos dos itens selecionados
                    const selectedItems = availableParents.filter(p => selectedInstanceIds.includes(p.id));
                    
                    // 2. IDs para OCULTAR (O item selecionado - evita mover para dentro de si)
                    const idsToHide = selectedInstanceIds;

                    // 3. IDs para DESABILITAR (O local onde o item já está - permite ver os filhos)
                    const idsToDisable = selectedItems
                      .map(i => i.parentId)
                      .filter(id => id !== null) as string[];

                    // 4. Renderizar: Passamos as duas listas de filtro
                    return renderSpaceOptions(
                      availableParents.filter(i => !i.parentId), 
                      0, 
                      idsToHide,    // Oculta o item selecionado
                      idsToDisable  // Desabilita o pai atual (mas renderiza os subespaços)
                    );
                  })()}
                </select>
                
                <p className="text-xs text-gray-500 mt-1">
                  * O item selecionado é ocultado; seu local atual é desabilitado (mas subespaços são visíveis).
                </p>
              </div>
              <div className="mt-auto">
                <button onClick={handleMoveInstance} className={`w-full font-bold py-3 px-6 rounded-md flex items-center justify-center ${selectedInstanceIds.length > 0 && moveNewParentId ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-500'}`} disabled={moveLoading || selectedInstanceIds.length === 0 || !moveNewParentId}>
                  <SendToBack className="mr-2" /> {moveLoading ? 'Movendo...' : `Mover ${selectedInstanceIds.length} Itens`}
                </button>
                {moveError && <p className="bg-red-100 text-red-700 p-3 rounded mt-3 text-sm text-center">{moveError}</p>}
                {moveSuccess && <p className="bg-green-100 text-green-700 p-3 rounded mt-3 text-sm text-center">{moveSuccess}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}