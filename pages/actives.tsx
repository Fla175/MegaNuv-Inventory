// pages/actives.tsx
import Layout from '../components/Layout';
import { useState, useEffect, useRef } from 'react';
import { 
  Box,
  Layers,
  PackagePlus,
  SendToBack,
  CheckSquare,
  X,
  Loader2,
  MapPin,
  ChevronRight,
  ChevronDown,
  Trash2,
  Search,
  Pencil, 
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/router';

// --- COMPONENTE AUXILIAR: COMBOBOX (Pesquisa no Select) ---
const SearchableSelect = ({ options, value, onChange, placeholder, label }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o: any) => o.id === value);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filtered = options.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-50 text-gray-500 border-2 border-transparent p-4 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center"
      >
        <span className={selectedOption ? 'text-blue-900' : 'text-gray-400'}>
            {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400"/>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-gray-50">
            <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2">
                <Search size={14} className="text-gray-400 mr-2"/>
                <input 
                    autoFocus
                    className="bg-transparent w-full text-xs font-bold outline-none text-gray-600"
                    placeholder="Pesquisar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
            {filtered.length > 0 ? filtered.map((opt: any) => (
                <div 
                    key={opt.id}
                    onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }}
                    className={`p-3 rounded-xl text-xs font-bold cursor-pointer transition-colors ${value === opt.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    {opt.name}
                </div>
            )) : <div className="p-3 text-xs text-gray-400 text-center font-bold">Nada encontrado</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const LocationNode = ({ node, level = 0 }: { node: any, level?: number }) => {
  const [isOpen, setIsOpen] = useState(level < 1); // Começa aberto apenas o primeiro nível
  const router = useRouter();

  const hasChildren = node.children && node.children.length > 0;
  const hasItems = node.items && node.items.length > 0;

  return (
    <div className="flex flex-col">
      {/* Linha do Local */}
      <div 
        className={`
          group flex items-center justify-between p-3 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all
          ${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : 'bg-white shadow-sm mb-2 border border-gray-100'}
        `}
        onClick={() => hasChildren ? setIsOpen(!isOpen) : router.push(`/inventory-view?location=${node.id}`)}
      >
        <div className="flex items-center gap-3">
          <div className={`${level === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {hasChildren ? (isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>) : <MapPin size={16}/>}
          </div>
          <div>
            <span className={`font-bold ${level === 0 ? 'text-blue-950' : 'text-gray-600 text-sm'}`}>
              {node.name}
            </span>
            <span className="ml-3 text-[10px] font-black text-gray-300 uppercase">
              {node._count?.items || 0} Ativos
            </span>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); router.push(`/inventory-view?location=${node.id}`); }}
          className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white p-1.5 rounded-lg transition-all"
        >
          <ArrowRight size={14}/>
        </button>
      </div>

      {/* Renderização dos Filhos (Recursão) */}
      {isOpen && hasChildren && (
        <div className="flex flex-col">
          {node.children.map((child: any) => (
            <LocationNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};


export default function ActivesPage() {
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Estados da Árvore (Minimização)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Dados do Banco
  const [availableDefinitions, setAvailableDefinitions] = useState<any[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([]);
  // Versão linear dos espaços para o Combobox
  const [flatSpaces, setFlatSpaces] = useState<any[]>([]); 
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Estados do Formulário de Entrada
  const [newDefinitionId, setNewDefinitionId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [tag, setTag] = useState('IN-STOCK');
  const [newParentId, setNewParentId] = useState('');

  // Estados de Edição de Espaço
  const [editingSpace, setEditingSpace] = useState<{id: string, name: string} | null>(null);

  // Função Auxiliar para "Achatar" a árvore para o Select
  const flattenSpaces = (nodes: any[], prefix = '') => {
      let result: any[] = [];
      nodes.forEach(node => {
          result.push({ id: node.id, name: prefix + node.name });
          if (node.children) {
              result = [...result, ...flattenSpaces(node.children, prefix + node.name + ' > ')];
          }
      });
      return result;
  };

  const fetchData = async () => {
    try {
      const [defsRes, spacesRes] = await Promise.all([
        fetch('/api/item-definitions/list'),
        // includeItems=true garante que vem os itens dentro das pastas
        fetch('/api/item-instances/list?onlyRoots=true&fetchChildren=true&includeItems=true')
      ]);
      const defsData = await defsRes.json();
      const spacesData = await spacesRes.json();
      setAvailableDefinitions(defsData.items || []);
      
      const spaces = spacesData.itemInstances || [];
      setAvailableSpaces(spaces);
      setFlatSpaces(flattenSpaces(spaces));

    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // 1. Lógica de Criação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newDefinitionId || !newParentId) { alert("Preencha ativo e local!"); return; }

    setFormLoading(true);
    const payload = [];
    for (let i = 0; i < quantity; i++) {
      payload.push({
        definitionId: newDefinitionId,
        locationId: newParentId,
        tag: tag || 'IN-STOCK',
        notes: notes,
      });
    }

    try {
      const res = await fetch('/api/items/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setQuantity(1); setNotes(''); setNewDefinitionId('');
        fetchData();
        alert("Ativos registrados com sucesso!");
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (err) { alert("Erro de conexão."); } 
    finally { setFormLoading(false); }
  };

  // 2. Lógica de Movimentação
  const handleMoveAssets = async (destinationId: string) => {
    if (!selectedAssetIds || selectedAssetIds.length === 0) {
      alert("Nenhum item selecionado.");
      return;
    }
    setMoveLoading(true);
    try {
      const res = await fetch('/api/items/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedAssetIds, newLocationId: destinationId }),
      });

      if (res.ok) {
        setSelectedAssetIds([]);
        setIsMoveModalOpen(false);
        fetchData();
        alert("Ativos movidos com sucesso!");
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (err) { alert("Erro ao conectar com o servidor."); } 
    finally { setMoveLoading(false); }
  };

  // 3. Lógica de Deleção
  const handleDeleteAssets = async () => {
    if (selectedAssetIds.length === 0) return;
    const confirmMsg = selectedAssetIds.length === 1 
        ? "Deseja excluir este ativo?" 
        : `Deseja excluir permanentemente estes ${selectedAssetIds.length} ativos?`;

    if (!confirm(confirmMsg)) return;

    setMoveLoading(true);
    try {
      const res = await fetch('/api/items/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedAssetIds }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedAssetIds([]);
        fetchData();
        alert(data.message);
      } else { alert("Erro ao excluir ativos."); }
    } catch (err) { alert("Erro de conexão."); } 
    finally { setMoveLoading(false); }
  };

  // --- RENDERIZAÇÃO DA ÁRVORE PRINCIPAL (COM SUBESPAÇOS E ITENS) ---
  const renderViewTree = (nodes: any[], depth = 0) => {
    return nodes.map((node) => {
        const isExpanded = expandedNodes[node.id];
        const hasChildren = (node.children && node.children.length > 0) || (node.items && node.items.length > 0);

        return (
            <div key={node.id} className="mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Cabeçalho da Pasta/Local */}
                <div 
                    className="flex items-center justify-between p-2 rounded-xl mb-1 hover:bg-gray-50 transition-colors group" 
                    style={{ marginLeft: `${depth * 0.8}rem` }}
                >
                    <div 
                        className="flex items-center cursor-pointer flex-1"
                        onClick={() => toggleNode(node.id)}
                    >
                        {hasChildren ? (
                            <ChevronRight size={14} className={`mr-2 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        ) : <div className="w-[14px] mr-2" />} {/* Espaçador */}
                        
                        <Layers size={16} className={`mr-2 ${isExpanded ? 'text-blue-600' : 'text-gray-300'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-widest ${isExpanded ? 'text-blue-900' : 'text-gray-500'}`}>
                            {node.name}
                        </span>
                    </div>
                </div>

                {/* Conteúdo da Pasta (Só renderiza se estiver expandido) */}
                {isExpanded && (
                    <div className="border-l border-gray-100 ml-2">
                        {/* 1. Renderizar Itens DENTRO deste espaço */}
                        {node.items?.map((asset: any) => (
                            <div 
                                key={asset.id}
                                onClick={() => setSelectedAssetIds(prev => prev.includes(asset.id) ? prev.filter(i => i !== asset.id) : [...prev, asset.id])}
                                className={`flex items-center p-3 md:p-4 my-1 ml-4 rounded-2xl cursor-pointer border transition-all ${
                                selectedAssetIds.includes(asset.id) 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                : 'bg-white border-gray-100 hover:border-blue-300'
                                }`}
                                style={{ marginLeft: `${(depth + 1) * 0.8}rem` }}
                            >
                                <CheckSquare size={18} className={`mr-3 ${selectedAssetIds.includes(asset.id) ? 'text-white' : 'text-gray-400'}`} />
                                <div className="min-w-0 flex-1">
                                    <p className={`font-black text-xs md:text-sm truncate ${selectedAssetIds.includes(asset.id) ? 'text-white' : 'text-gray-500'}`}>{asset.definition?.name}</p>
                                    <div className="flex gap-2 items-center mt-1">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${selectedAssetIds.includes(asset.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {asset.tag}
                                    </span>
                                    {asset.notes && <span className={`text-[10px] font-black opacity-60 truncate ${selectedAssetIds.includes(asset.id) ? 'text-white' : 'text-gray-600'}`}>| {asset.notes}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 2. Recursividade para Subespaços */}
                        {node.children && renderViewTree(node.children, depth + 1)}
                        
                        {/* Aviso se vazio */}
                        {!node.items?.length && !node.children?.length && (
                             <div className="ml-8 py-2 text-[9px] font-black text-gray-300 uppercase italic">Vazio</div>
                        )}
                    </div>
                )}
            </div>
        );
    });
  };

  // --- RENDERIZAÇÃO DO MODAL DE SELEÇÃO (COM MINIMIZAÇÃO) ---
  const renderSelectionTree = (nodes: any[]) => {
    return nodes.map((node) => {
      // Usamos um estado local temporário no modal ou reaproveitamos o expandedNodes?
      // Vamos reaproveitar o expandedNodes para consistência, ou poderíamos criar um novo estado `modalExpanded`.
      // Para simplificar, vou deixar sempre expandido no modal de movimento OU adicionar toggle simples.
      const isExpanded = expandedNodes[`modal-${node.id}`]; 
      
      return (
      <div key={node.id} className="mb-2">
         <div className="flex gap-2">
            <button
                onClick={() => setExpandedNodes(prev => ({ ...prev, [`modal-${node.id}`]: !prev[`modal-${node.id}`] }))}
                className="p-2 text-gray-400 hover:text-blue-600"
            >
                {node.children?.length > 0 && <ChevronRight size={20} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
            </button>

            <button
            onClick={() => handleMoveAssets(node.id)}
            className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
            >
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <MapPin size={18} />
                </div>
                <span className="font-bold text-blue-950">{node.name}</span>
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mover para cá</div>
            </button>
        </div>

        {isExpanded && node.children && node.children.length > 0 && (
          <div className="ml-8 mt-2 border-l-2 border-gray-100 pl-4 space-y-2">
            {renderSelectionTree(node.children)}
          </div>
        )}
      </div>
    )});
  };

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-blue-900 font-black"><Loader2 className="animate-spin mr-2"/> CARREGANDO...</div></Layout>;

  return (
    <Layout title="Gestão de Ativos">
      <div className="max-w-7xl mx-auto py-6 md:py-8 px-4">
        
        <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Box size={24}/></div>
            <h1 className="text-2xl md:text-3xl font-black text-blue-950 tracking-tighter italic">Gestão de Ativos</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Formulário de Entrada */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 sticky top-8">
                <h2 className="text-lg font-black text-blue-900 flex items-center gap-2"><PackagePlus size={20}/> Entrada de Ativos</h2>
                
                <div className="space-y-4">
                  
                  {/* SELECT PERSONALIZADO: ATIVO */}
                  <SearchableSelect 
                    label="Ativo"
                    placeholder="Selecione o ativo..."
                    options={availableDefinitions}
                    value={newDefinitionId}
                    onChange={setNewDefinitionId}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block">Quantia</label>
                      <input type="number" min="1" className="w-full bg-gray-50 text-gray-500 border-2 border-transparent p-4 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block">Status</label>
                      <select className="w-full bg-gray-50 text-gray-500 border-2 border-transparent p-4 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" value={tag} onChange={e => setTag(e.target.value)}>
                        <option value="IN-STOCK">Estoque</option>
                        <option value="IN-USE">Em Uso</option>
                        <option value="TO-SELL">Venda</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block">Notas</label>
                    <textarea className="w-full bg-gray-50 text-gray-500 border-2 border-transparent p-4 rounded-2xl font-bold text-sm outline-none focus:border-blue-500 resize-none" rows={2} placeholder="Observações..." value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>

                  {/* SELECT PERSONALIZADO: ESPAÇO FÍSICO */}
                  <SearchableSelect 
                    label="Espaço Físico"
                    placeholder="Selecione o local..."
                    options={flatSpaces} // Usamos a lista achatada para facilitar a busca
                    value={newParentId}
                    onChange={setNewParentId}
                  />

                </div>

                <button type="submit" disabled={formLoading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  {formLoading ? <Loader2 className="animate-spin" size={20}/> : 'Registrar Ativos'}
                </button>
            </form>
          </div>

          {/* Listagem e Mapa */}
          <div className="lg:col-span-8 order-1 lg:order-2 bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-lg font-black text-blue-950 flex items-center gap-2"><SendToBack size={20} className="text-indigo-500"/> Mover Ativos</h2>
                {selectedAssetIds.length > 0 && (
                  <div className="flex gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right duration-300">
                    <button 
                      onClick={handleDeleteAssets} 
                      className="flex-1 sm:flex-none bg-red-100 text-red-600 px-6 py-3 rounded-xl font-black shadow-sm hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-200"
                  >
                      <Trash2 size={18} /> 
                      <span className="hidden sm:inline">Excluir</span> ({selectedAssetIds.length})
                  </button>

                     <button onClick={() => setIsMoveModalOpen(true)} className="flex-1 sm:flex-none bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                       <SendToBack size={18} /> <span className="hidden sm:inline">Mover</span> ({selectedAssetIds.length})
                     </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {availableSpaces.length === 0 ? (
                   <div className="text-center text-gray-500 py-20 font-bold uppercase tracking-widest text-xs">Nenhum espaço físico cadastrado</div>
               ) : (
                   <div className="space-y-1">
                       {renderViewTree(availableSpaces)}
                   </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Movimentação */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-blue-950/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-blue-950 tracking-tighter">Mover Ativos</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Selecione o destino para {selectedAssetIds.length} item(ns)</p>
                    </div>
                    <button onClick={() => setIsMoveModalOpen(false)} className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
                    {moveLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-blue-600 font-black gap-3 italic">
                            <Loader2 className="animate-spin" size={40} /> MOVENDO...
                        </div>
                    ) : (
                        renderSelectionTree(availableSpaces)
                    )}
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
}