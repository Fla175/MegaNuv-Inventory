// pages/actives.tsx
import Layout from '../components/Layout';
import { useState, useEffect, useRef, useCallback, JSX } from 'react';
import { 
  Box, Layers, PackagePlus, SendToBack, CheckSquare, X, Loader2, MapPin, 
  ChevronRight, ChevronDown, Search, Pencil, Save, Tag as TagIcon, 
  FileText
} from 'lucide-react';
import { useUser } from "@/lib/context/UserContext";

// --- INTERFACES DE TIPAGEM ---
interface ItemDefinition {
  id: string;
  name: string;
  sku?: string;
}

interface Item {
  id: string;
  definitionId: string;
  definition: ItemDefinition;
  tag: string;
  notes?: string;
  createdAt: string;
}

interface ItemInstance {
  id: string;
  name: string;
  children?: ItemInstance[];
  items?: Item[];
  createdAt: string;
}

interface SearchableSelectProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  label: string;
}

const SearchableSelect = ({ options, value, onChange, placeholder, label }: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filtered = options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase ml-2 mb-1 block tracking-widest">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-500 border-2 border-transparent p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-[13px] md:text-sm outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center transition-all"
      >
        <span className={`truncate ${selectedOption ? 'text-blue-900 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 rounded-xl md:rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-gray-50 dark:border-white/5">
            <div className="flex items-center bg-gray-50 dark:bg-zinc-950 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400 mr-2 shrink-0"/>
                <input autoFocus className="bg-transparent w-full text-[13px] font-bold outline-none text-gray-600 dark:text-gray-300" placeholder="Filtrar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="max-h-40 md:max-h-56 overflow-y-auto p-1">
            {filtered.length > 0 ? filtered.map((opt) => (
                <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }} className={`p-3 rounded-lg text-[12px] md:text-xs font-bold cursor-pointer transition-colors ${value === opt.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>{opt.name}</div>
            )) : <div className="p-3 text-[12px] text-gray-400 text-center font-bold">Vazio</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ActivesPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editTag, setEditTag] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [availableDefinitions, setAvailableDefinitions] = useState<ItemDefinition[]>([]);
  const [availableSpaces, setAvailableSpaces] = useState<ItemInstance[]>([]);
  const [flatSpaces, setFlatSpaces] = useState<{ id: string; name: string }[]>([]); 
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [newDefinitionId, setNewDefinitionId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [tag, setTag] = useState('IN-STOCK');
  const [newParentId, setNewParentId] = useState('');

  // Ordenação tipada
  const sortData = useCallback(<T extends { name?: string; createdAt?: string; definition?: { name: string } }>(data: T[], type: 'node' | 'asset'): T[] => {
    return [...data].sort((a, b) => {
      const sortType = user?.defaultSort || 'name';
      if (sortType === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      const nameA = type === 'node' ? a.name : a.definition?.name;
      const nameB = type === 'node' ? b.name : b.definition?.name;
      return (nameA || "").localeCompare(nameB || "");
    });
  }, [user?.defaultSort]);

  const flattenSpaces = useCallback((nodes: ItemInstance[], prefix = ''): { id: string; name: string }[] => {
      let result: { id: string; name: string }[] = [];
      const sortedNodes = sortData(nodes, 'node');
      sortedNodes.forEach(node => {
          result.push({ id: node.id, name: prefix + node.name });
          if (node.children) result = [...result, ...flattenSpaces(node.children, prefix + node.name + ' > ')];
      });
      return result;
  }, [sortData]);

  const fetchData = useCallback(async () => {
    try {
      const [defsRes, spacesRes] = await Promise.all([
        fetch('/api/item-definitions/list'),
        fetch('/api/item-instances/list?onlyRoots=true&fetchChildren=true&includeItems=true')
      ]);
      const defsData = await defsRes.json();
      const spacesData = await spacesRes.json();
      
      const defs = defsData.items || [];
      const spaces = spacesData.itemInstances || [];
      
      setAvailableDefinitions(sortData(defs, 'node'));
      setAvailableSpaces(spaces);
      setFlatSpaces(flattenSpaces(spaces));
    } catch (err) { console.error(err); }
  }, [sortData, flattenSpaces]);

  useEffect(() => { 
    fetchData().finally(() => setLoading(false)); 
  }, [fetchData]);

  const toggleNode = (nodeId: string) => setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newDefinitionId || !newParentId) return;
    setFormLoading(true);
    const payload = Array.from({ length: quantity }, () => ({ definitionId: newDefinitionId, locationId: newParentId, tag, notes }));
    try {
      const res = await fetch('/api/items/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setQuantity(1); setNotes(''); setNewDefinitionId(''); fetchData(); }
    } finally { setFormLoading(false); }
  };

  const handleMoveAssets = async (destinationId: string) => {
    setMoveLoading(true);
    try {
      const res = await fetch('/api/items/move', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemIds: selectedAssetIds, newLocationId: destinationId }) });
      if (res.ok) { setSelectedAssetIds([]); setIsMoveModalOpen(false); fetchData(); }
    } finally { setMoveLoading(false); }
  };

  const handleDeleteAssets = async () => {
    if (!confirm("Excluir permanentemente?")) return;
    setMoveLoading(true);
    try {
      const res = await fetch('/api/items/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemIds: selectedAssetIds }) });
      if (res.ok) { setSelectedAssetIds([]); fetchData(); }
    } finally { setMoveLoading(false); }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingItem) return;
    setEditLoading(true);
    try {
        const res = await fetch(`/api/items/update`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingItem.id, tag: editTag, notes: editNotes }) });
        if (res.ok) { setEditingItem(null); fetchData(); }
    } finally { setEditLoading(false); }
  };

  const renderViewTree = (nodes: ItemInstance[], depth = 0): (JSX.Element | null)[] => {
    const query = assetSearch.toLowerCase();
    const sortedNodes = sortData(nodes, 'node');

    return sortedNodes.map((node) => {
        const filteredItems = node.items?.filter((asset) => 
            asset.definition?.name.toLowerCase().includes(query) ||
            asset.definition?.sku?.toLowerCase().includes(query) ||
            asset.tag.toLowerCase().includes(query) ||
            (asset.notes && asset.notes.toLowerCase().includes(query))
        ) || [];
        
        const sortedItems = sortData(filteredItems, 'asset');
        const childrenTree = node.children ? renderViewTree(node.children, depth + 1) : [];
        const hasVisibleChildren = childrenTree.some((c) => c !== null);
        
        if (query && sortedItems.length === 0 && !hasVisibleChildren) return null;

        const isExpanded = expandedNodes[node.id] || (query !== "");
        const hasContent = sortedItems.length > 0 || hasVisibleChildren;

        return (
            <div key={node.id} className="mb-1 animate-in fade-in duration-200">
                <div 
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors group cursor-pointer" 
                  style={{ paddingLeft: `${depth * 0.5}rem` }}
                  onClick={() => toggleNode(node.id)}
                >
                    <div className="flex items-center flex-1 min-w-0">
                        {hasContent ? (
                            <ChevronRight size={14} className={`mr-1.5 text-gray-400 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                        ) : <div className="w-[14px] mr-1.5 shrink-0" />} 
                        <Layers size={14} className={`mr-2 shrink-0 ${isExpanded ? 'text-blue-600' : 'text-gray-300 dark:text-gray-700'}`} />
                        <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider truncate ${isExpanded ? 'text-blue-900 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500'}`}>
                          {node.name}
                        </span>
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-l border-gray-100 dark:border-white/5 ml-3 md:ml-4">
                        {sortedItems.map((asset) => (
                            <div 
                                key={asset.id}
                                onClick={() => setSelectedAssetIds(prev => prev.includes(asset.id) ? prev.filter(i => i !== asset.id) : [...prev, asset.id])}
                                className={`group relative flex items-center p-3 md:p-4 my-1.5 ml-2 md:ml-4 rounded-xl md:rounded-2xl cursor-pointer border transition-all ${selectedAssetIds.includes(asset.id) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-zinc-950 border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/50'}`}
                            >
                                <CheckSquare size={16} className={`mr-3 shrink-0 ${selectedAssetIds.includes(asset.id) ? 'text-white' : 'text-gray-300 dark:text-gray-700'}`} />
                                <div className="min-w-0 flex-1 pr-6 md:pr-10">
                                    <p className={`font-black text-[12px] md:text-sm truncate leading-tight ${selectedAssetIds.includes(asset.id) ? 'text-white' : 'text-blue-950 dark:text-gray-200'}`}>{asset.definition?.name}</p>
                                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${selectedAssetIds.includes(asset.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'}`}>{asset.tag}</span>
                                        {asset.notes && <span className={`text-[9px] font-bold truncate max-w-[120px] md:max-w-none ${selectedAssetIds.includes(asset.id) ? 'text-blue-100' : 'text-gray-400 dark:text-gray-600'}`}>• {asset.notes}</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingItem(asset); setEditTag(asset.tag); setEditNotes(asset.notes || ''); }}
                                    className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all 
                                      ${selectedAssetIds.includes(asset.id) ? 'bg-blue-500 text-white hover:bg-white hover:text-blue-600' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 hover:bg-blue-600 hover:text-white'} 
                                      md:opacity-0 md:group-hover:opacity-100 opacity-100`}
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        ))}
                        {childrenTree}
                    </div>
                )}
            </div>
        );
    });
  };

  const renderSelectionTree = (nodes: ItemInstance[]) => {
    return sortData(nodes, 'node').map((node) => {
      const isExpanded = expandedNodes[`modal-${node.id}`]; 
      return (
      <div key={node.id} className="mb-2">
         <div className="flex gap-1.5 md:gap-2">
            <button onClick={() => setExpandedNodes(prev => ({ ...prev, [`modal-${node.id}`]: !prev[`modal-${node.id}`] }))} className="p-2 text-gray-400 hover:text-blue-600 shrink-0">
                {(node.children && node.children.length > 0) && <ChevronRight size={18} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
            </button>
            <button onClick={() => handleMoveAssets(node.id)} className="w-full text-left p-3 md:p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-xl md:rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-between group min-w-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="bg-gray-100 dark:bg-zinc-800 p-1.5 md:p-2 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 transition-colors shrink-0"><MapPin size={16} /></div>
                    <span className="font-bold text-blue-950 dark:text-gray-200 text-sm truncate">{node.name}</span>
                </div>
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest shrink-0 ml-2">Mover</div>
            </button>
        </div>
        {isExpanded && node.children && node.children.length > 0 && (
          <div className="ml-6 md:ml-8 mt-2 border-l-2 border-gray-100 dark:border-white/5 pl-3 md:pl-4 space-y-2">{renderSelectionTree(node.children)}</div>
        )}
      </div>
    )});
  };

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-blue-900 dark:text-blue-400 font-black animate-pulse"><Loader2 className="animate-spin mr-2"/> CARREGANDO...</div></Layout>;

  return (
    <Layout title="Gestão de Ativos">
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 sm:px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8 bg-white/50 dark:bg-zinc-900/50 p-4 rounded-[1.5rem] md:rounded-[2rem] border border-white dark:border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md"><Box size={22}/></div>
                <h1 className="text-xl md:text-3xl font-black text-blue-950 dark:text-white tracking-tighter italic">Gestão de Ativos</h1>
            </div>
            
            <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input className="w-full bg-white dark:bg-zinc-950 border-none rounded-xl md:rounded-2xl pl-11 pr-4 py-3 md:py-4 text-xs md:text-sm font-bold text-gray-600 dark:text-gray-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all" placeholder="Buscar..." value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-5 md:space-y-6 lg:sticky lg:top-8 transition-colors">
                <h2 className="text-sm md:text-lg font-black text-blue-900 dark:text-blue-400 flex items-center gap-2"><PackagePlus size={18}/>Entrada de Ativos</h2>
                <div className="space-y-4">
                  <SearchableSelect label="Ativo Modelo" placeholder="Selecione..." options={availableDefinitions} value={newDefinitionId} onChange={setNewDefinitionId} />
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase ml-2 block">Qtd</label>
                      <input type="number" min="1" className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-gray-300 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base outline-none focus:bg-white dark:focus:bg-zinc-900 transition-all" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase ml-2 block">Status</label>
                      <select className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-500 dark:text-gray-300 p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-[13px] md:text-sm outline-none appearance-none" value={tag} onChange={e => setTag(e.target.value)}>
                          <option value="IN-STOCK">Estoque</option>
                          <option value="IN-USE">Em Uso</option>
                      </select>
                    </div>
                  </div>
                  <SearchableSelect label="Local de Destino" options={flatSpaces} value={newParentId} onChange={setNewParentId} />
                </div>
                <button type="submit" disabled={formLoading || !newDefinitionId || !newParentId} className="w-full bg-blue-600 text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-300 dark:disabled:bg-zinc-800">
                  {formLoading ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Registrar Ativos'}
                </button>
            </form>
          </div>

          <div className="lg:col-span-8 order-1 lg:order-2 bg-white dark:bg-zinc-900 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm min-h-[450px] flex flex-col transition-colors">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-sm md:text-lg font-black text-indigo-800 dark:text-white flex items-center gap-2"><SendToBack size={18}/>Mover ativos</h2>
                {selectedAssetIds.length > 0 && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleDeleteAssets} className="flex-1 sm:flex-none bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl font-bold text-[11px] md:text-xs hover:bg-red-100 transition-colors uppercase">Excluir ({selectedAssetIds.length})</button>
                    <button onClick={() => setIsMoveModalOpen(true)} className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-[11px] md:text-xs hover:bg-indigo-700 transition-colors uppercase shadow-md">Mover Seleção</button>
                  </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
               {availableSpaces.length > 0 ? renderViewTree(availableSpaces) : (
                <div className="text-center py-20">
                  <Box size={40} className="mx-auto text-gray-100 dark:text-zinc-800 mb-3"/>
                  <p className="text-gray-400 dark:text-gray-600 font-bold uppercase text-[10px] tracking-widest">Nenhum ativo encontrado</p>
                </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-blue-950/70 z-[100] flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg shadow-2xl h-[90vh] sm:h-[80vh] flex flex-col border dark:border-white/10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg md:text-2xl font-black text-blue-950 dark:text-white tracking-tighter">Mover Ativos</h3>
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Destino para {selectedAssetIds.length} item(ns)</p>
                    </div>
                    <button onClick={() => setIsMoveModalOpen(false)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 bg-gray-50/50 dark:bg-zinc-950/50 rounded-2xl md:rounded-3xl p-3 md:p-4 border border-gray-100 dark:border-white/5">
                    {moveLoading ? (
                      <div className="h-full flex flex-col items-center justify-center text-blue-600 font-black">
                        <Loader2 className="animate-spin mb-2" size={32}/>
                        <span className="text-[10px] uppercase tracking-widest">Processando...</span>
                      </div>
                    ) : renderSelectionTree(availableSpaces)}
                </div>
            </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-blue-950/70 z-[110] flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <form onSubmit={handleUpdateItem} className="bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2.5rem] p-6 md:p-8 w-full max-w-sm shadow-2xl relative border dark:border-white/10">
            <button type="button" onClick={() => setEditingItem(null)} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-300 hover:text-red-500 p-2"><X size={24}/></button>
            <h3 className="text-lg md:text-xl font-black text-blue-950 dark:text-white mb-1 flex items-center gap-2"><Pencil size={18} className="text-blue-500"/> Editar Detalhes</h3>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-6 truncate max-w-[250px]">{editingItem.definition?.name}</p>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase ml-2 flex items-center gap-1"><TagIcon size={10}/> Status do Item</label>
                <select className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-600 dark:text-gray-300 border-2 border-transparent p-3.5 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none focus:border-blue-500 transition-all" value={editTag} onChange={e => setEditTag(e.target.value)}>
                  <option value="IN-STOCK">Estoque</option>
                  <option value="IN-USE">Em Uso</option>
                  <option value="TO-SELL">Venda</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase ml-2 flex items-center gap-1"><FileText size={10}/> Observações</label>
                <textarea className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-700 dark:text-gray-300 border-2 border-transparent p-3.5 md:p-4 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none focus:border-blue-500 resize-none" rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas internas..." />
              </div>
            </div>
            
            <button type="submit" disabled={editLoading} className="w-full py-3.5 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-300">
              {editLoading ? <Loader2 className="animate-spin mx-auto" size={20}/> : <><Save size={16} className="inline mr-2"/> Salvar Alterações</>}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}