// pages/products.tsx
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import {
  Box,
  Layers,
  PackagePlus,
  SendToBack,
  CheckSquare,
  X,
  ArrowRightCircle 
} from 'lucide-react';

interface ItemDefinition { id: string; name: string; sku: string | null; cost: number; }
// Interface atualizada para suportar recursão correta
interface SpaceLocation { 
  id: string; 
  name: string; 
  parentId: string | null; 
  children?: SpaceLocation[]; 
  items?: any[]; 
}

export default function InstancesPage() {
  const [loading, setLoading] = useState(true);
  const [availableDefinitions, setAvailableDefinitions] = useState<ItemDefinition[]>([]); 
  const [availableSpaces, setAvailableSpaces] = useState<SpaceLocation[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]); 

  // Forms e Modais
  const [newDefinitionId, setNewDefinitionId] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [usefulLife, setUsefulLife] = useState(60);
  const [formLoading, setFormLoading] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [defsRes, spacesRes] = await Promise.all([
        fetch('/api/item-definitions/list'),
        // API agora retorna onlyRoots=true mas com fetchChildren=true para árvore completa
        fetch('/api/item-instances/list?onlyRoots=true&fetchChildren=true&includeItems=true')
      ]);
      const defsData = await defsRes.json();
      const spacesData = await spacesRes.json();
      setAvailableDefinitions(defsData.items || []);
      // A API retorna as raízes já com os filhos aninhados
      setAvailableSpaces(spacesData.itemInstances || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/items/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definitionId: newDefinitionId,
          locationId: newParentId,
          serialNumber: newSerialNumber,
          purchaseDate: new Date(purchaseDate).toISOString(),
          usefulLifeMonths: Number(usefulLife),
          tag: 'IN-STOCK'
        }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      setNewSerialNumber('');
      fetchData();
    } catch (err) { alert(err); } finally { setFormLoading(false); }
  };

  const handleMoveToLocation = async (targetLocationId: string) => {
    if (!confirm(`Mover ${selectedAssetIds.length} itens para este local?`)) return;
    setMoveLoading(true);
    try {
      const res = await fetch('/api/items/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: selectedAssetIds, newLocationId: targetLocationId }),
      });
      if (!res.ok) throw new Error('Falha ao mover');
      setSelectedAssetIds([]);
      setIsMoveModalOpen(false);
      fetchData();
    } catch (err) { alert(err); } finally { setMoveLoading(false); }
  };

  // Renderiza Opções no Dropdown (Apenas lineariza a árvore para seleção simples)
  const renderOptions = (nodes: SpaceLocation[], depth = 0): any => {
    return nodes.flatMap(node => [
      <option key={node.id} value={node.id}>{"\u00A0".repeat(depth * 2)}↳ {node.name}</option>,
      ...(node.children ? renderOptions(node.children, depth + 1) : [])
    ]);
  };

  // Renderiza Árvore Visual (Recursiva)
  const renderViewTree = (nodes: SpaceLocation[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="mb-1">
        {/* Cabeçalho do Local */}
        <div className="flex items-center p-2 bg-gray-50/50 rounded-lg mb-1" style={{ marginLeft: `${depth * 1.2}rem` }}>
          <Layers size={14} className="mr-2 text-gray-400" />
          <span className="text-xs font-bold text-gray-600 uppercase">{node.name}</span>
        </div>

        {/* Renderiza Itens deste nó */}
        {node.items && node.items.length > 0 && node.items.map((asset) => (
          <div 
            key={asset.id}
            onClick={() => setSelectedAssetIds(prev => prev.includes(asset.id) ? prev.filter(i => i !== asset.id) : [...prev, asset.id])}
            className={`flex items-center p-3 my-1 rounded-xl cursor-pointer border transition-all ${selectedAssetIds.includes(asset.id) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-gray-100 hover:border-blue-300'}`}
            style={{ marginLeft: `${(depth + 1) * 1.2}rem` }}
          >
            <CheckSquare size={16} className={`mr-3 ${selectedAssetIds.includes(asset.id) ? 'text-white' : 'text-gray-200'}`} />
            <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate">{asset.definition?.name}</p>
                <p className={`text-[10px] font-mono ${selectedAssetIds.includes(asset.id) ? 'text-blue-200' : 'text-gray-400'}`}>{asset.serialNumber}</p>
            </div>
          </div>
        ))}

        {/* Renderiza Filhos (Recursão) */}
        {node.children && node.children.length > 0 && (
          <div>{renderViewTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  const renderSelectionTree = (nodes: SpaceLocation[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="mb-1">
        <button 
          onClick={() => handleMoveToLocation(node.id)}
          className="w-full text-left flex items-center p-3 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200 group"
          style={{ paddingLeft: `${(depth * 1.5) + 0.75}rem` }}
        >
          <Layers size={16} className="mr-2 text-gray-400 group-hover:text-blue-600" />
          <span className="text-sm font-bold text-gray-700 group-hover:text-blue-800">{node.name}</span>
          <ArrowRightCircle size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-blue-500"/>
        </button>
        {node.children && renderSelectionTree(node.children, depth + 1)}
      </div>
    ));
  };

  if (loading) return <Layout><div className="p-20 text-center font-black">CARREGANDO...</div></Layout>;

  return (
    <Layout title="Gestão de Ativos">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-black text-blue-950 flex items-center mb-8"><Box className="mr-3 text-blue-600"/> Gerenciar Produtos</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border shadow-sm space-y-5 h-fit">
            <h2 className="text-xl font-bold text-blue-900 flex items-center mb-4"><PackagePlus className="mr-2 text-blue-600"/> Entrada de Ativos</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Produto</label>
                <select className="w-full bg-gray-50 border-gray-100
                 text-gray-600 border p-3 rounded-xl font-bold text-sm" value={newDefinitionId} onChange={e => setNewDefinitionId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {availableDefinitions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Número de Série</label>
                <input className="w-full bg-gray-50 border-gray-100 text-gray-600 border p-3 rounded-xl font-bold text-sm" value={newSerialNumber} onChange={e => setNewSerialNumber(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Data de Compra</label>
                    <input type="date" className="w-full bg-gray-50 border-gray-100  text-gray-600 border p-3 rounded-xl font-bold text-sm" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Vida Útil (Meses)</label>
                    <input type="number" className="w-full bg-gray-50 border-gray-100  text-gray-600 border p-3 rounded-xl font-bold text-sm" value={usefulLife} onChange={e => setUsefulLife(Number(e.target.value))} />
                  </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Espaço Pai</label>
                <select className="w-full bg-gray-50 border-gray-100  text-gray-600 border p-3 rounded-xl font-bold text-sm" value={newParentId} onChange={e => setNewParentId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {renderOptions(availableSpaces)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={formLoading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
              {formLoading ? 'Processando...' : 'Confirmar Entrada'}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border shadow-sm flex flex-col h-[800px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-blue-900 flex items-center"><SendToBack className="mr-2 text-indigo-500"/> Mover Ativos</h2>
                <button 
                  onClick={() => setIsMoveModalOpen(true)}
                  disabled={selectedAssetIds.length === 0} 
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none transition-all flex items-center gap-2"
                >
                  <SendToBack size={18} />
                  Mover Selecionados ({selectedAssetIds.length})
                </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {availableSpaces.length === 0 ? <div className="text-center text-gray-400 py-20">Vazio.</div> : renderViewTree(availableSpaces)}
            </div>
          </div>
        </div>
      </div>

      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-blue-950/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl h-[600px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-blue-950">Selecione o Destino</h3>
                        <p className="text-sm text-gray-500">Movendo {selectedAssetIds.length} ativos</p>
                    </div>
                    <button onClick={() => setIsMoveModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X/></button>
                </div>
                <div className="flex-1 overflow-y-auto border rounded-2xl p-4 bg-gray-50 custom-scrollbar">
                    {moveLoading ? <div className="text-center py-20 font-bold text-blue-600 animate-pulse">Movendo...</div> : renderSelectionTree(availableSpaces)}
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
}