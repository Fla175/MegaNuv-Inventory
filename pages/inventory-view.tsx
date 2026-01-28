// pages/inventory-view.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ImageUpload from '@/components/imageUpload';
import {  
  MapPin, Layers, Trash2, Plus, X, Loader2, Package, Box, Pencil, Search, ArrowLeft, DollarSign, Save, ChevronRight
} from 'lucide-react';

interface SubSpace {
  id: string;
  name: string;
  fixedValue: number;
  imageUrl?: string | null;
  items?: any[];
  children?: SubSpace[];
  parentId?: string | null;
  createdAt?: string;
  _count?: { items: number; children: number; };
}

interface ItemDefinition {
  id: string;
  name: string;
  sku: string;
}

export default function InventoryView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<SubSpace | null>(null);
  const [sortType] = useState<'alphabetical' | 'newest'>('alphabetical');

  // --- ESTADOS: SUBESPAÇOS ---
  const [subspaceModalOpen, setSubspaceModalOpen] = useState(false);
  const [editingSubspace, setEditingSubspace] = useState<SubSpace | null>(null);
  const [subspaceName, setSubspaceName] = useState('');
  const [subspaceValue, setSubspaceValue] = useState('');
  const [subspaceImage, setSubspaceImage] = useState<string | null>(null);

  // --- ESTADOS: ITENS ---
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [definitions, setDefinitions] = useState<ItemDefinition[]>([]); 
  const [defId, setDefId] = useState('');
  const [itemSerial, setItemSerial] = useState('');
  const [itemImage, setItemImage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const sortData = (data: any[], type: 'subspace' | 'item') => {
    return [...data].sort((a, b) => {
      if (sortType === 'alphabetical') {
        const nameA = type === 'subspace' ? a.name : a.definition?.name;
        const nameB = type === 'subspace' ? b.name : b.definition?.name;
        return (nameA || "").localeCompare(nameB || "");
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  };

  const fetchInventory = useCallback(async () => {
    const locationId = router.query.location;
    if (!router.isReady || !locationId || locationId === 'undefined') return;    
    setLoading(true);
    try {
      const res = await fetch(`/api/item-instances/list?id=${locationId}&fetchChildren=true&includeItems=true`);
      const data = await res.json();
      setCurrentLocation(data.itemInstances?.[0] || null);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [router.query.location, router.isReady]);

  useEffect(() => {
    fetch('/api/item-definitions/list').then(r => r.json()).then(data => setDefinitions(data.items || []));
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filteredChildren = useMemo(() => {
    const filtered = currentLocation?.children?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];
    return sortData(filtered, 'subspace');
  }, [currentLocation?.children, searchQuery]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = currentLocation?.items?.filter(i => 
        i.definition?.name.toLowerCase().includes(q) || i.definition?.sku.toLowerCase().includes(q) || i.serialNumber?.toLowerCase().includes(q)
    ) || [];
    return sortData(filtered, 'item');
  }, [currentLocation?.items, searchQuery]);

  const handleSaveSubspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!subspaceName.trim() || !currentLocation) return;
    setIsProcessing(true);
    try {
        const isEdit = !!editingSubspace;
        const res = await fetch(isEdit ? '/api/item-instances/update' : '/api/item-instances/create', {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingSubspace?.id, name: subspaceName, parentId: currentLocation.id, fixedValue: Number(subspaceValue), imageUrl: subspaceImage })
        });
        if (res.ok) { setSubspaceModalOpen(false); fetchInventory(); }
    } finally { setIsProcessing(false); }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation || !defId) return;
    setIsProcessing(true);
    try {
        const res = await fetch(editingItem ? '/api/items/update' : '/api/items/create', {
            method: editingItem ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingItem?.id, definitionId: defId, locationId: currentLocation.id, serialNumber: itemSerial.toUpperCase(), imageUrl: itemImage })
        });
        if (res.ok) { setItemModalOpen(false); fetchInventory(); }
    } finally { setIsProcessing(false); }
  };

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-blue-900 font-black gap-2 animate-pulse"><Loader2 className="animate-spin"/> CARREGANDO...</div></Layout>;
  if (!currentLocation) return <Layout><div className="p-20 text-center font-bold text-gray-400">Local não encontrado.</div></Layout>;

  return (
    <Layout title={currentLocation.name}>
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 sm:px-6">

        {/* CABEÇALHO DE CONTEXTO */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 mb-6 border border-gray-100 shadow-sm">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all mb-4 md:mb-6 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Voltar
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="flex items-start gap-4 min-w-0">
                 <div className="bg-blue-600 text-white p-3 rounded-xl md:rounded-2xl shadow-lg shrink-0"><MapPin size={24}/></div>
                 <div className="min-w-0">
                    <h1 className="text-xl md:text-3xl font-black text-blue-950 leading-tight truncate">{currentLocation.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[9px] md:text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">
                          {currentLocation._count?.children || 0} Subespaços • {currentLocation._count?.items || 0} Ativos
                        </span>
                        {currentLocation.fixedValue > 0 && (
                            <span className="bg-green-100 text-green-700 text-[9px] md:text-[10px] px-2 py-0.5 rounded-full font-black">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentLocation.fixedValue)}
                            </span>
                        )}
                    </div>
                 </div>
             </div>
             <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input className="w-full bg-gray-50 border-none rounded-xl md:rounded-2xl pl-11 pr-4 py-3.5 text-xs md:text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Filtrar nesta visualização..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SEÇÃO: SUBESPAÇOS */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-1">
               <h2 className="text-sm md:text-lg font-black text-indigo-900 flex items-center gap-2 tracking-tighter"><Layers size={18} className="text-indigo-500"/> Subespaços</h2>
               <button onClick={() => { setEditingSubspace(null); setSubspaceName(''); setSubspaceValue(''); setSubspaceImage(null); setSubspaceModalOpen(true); }} className="bg-indigo-600 text-white p-2 md:px-4 md:py-2 rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                <Plus size={16}/><span className="hidden md:inline">Adicionar</span>
               </button>
            </div>
            
            {filteredChildren.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[1.5rem] md:rounded-[2.5rem] text-center">
                  <Layers size={32} className="text-indigo-100 mb-3"/>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Nenhum subespaço</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {filteredChildren.map((sub: SubSpace) => (
                        <div key={sub.id} onClick={() => router.push(`/inventory-view?location=${sub.id}`)} className="group bg-white p-4 rounded-2xl md:rounded-[2rem] border border-gray-100 hover:border-indigo-300 hover:shadow-xl cursor-pointer transition-all flex flex-col min-h-[110px] relative">
                            <div className="flex items-start gap-3 md:gap-4">
                                <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 overflow-hidden border border-indigo-100">
                                  {sub.imageUrl ? <img src={sub.imageUrl} className="w-full h-full object-cover" alt={sub.name}/> : <Layers size={20}/>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-black text-blue-950 truncate text-sm md:text-base mb-1">{sub.name}</h3>
                                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{sub._count?.items ?? 0} ativos vinculados</p>
                                  <div className="shrink-0">
                                    <div className="w-20 bg-gradient-to-tr from-green-100 to-green-50 px-1.5 py-1.5 mt-1.5 rounded-xl border border-green-100 shadow-[0_2px_10px_-3px_rgba(20,184,166,0.2)]">
                                      <p className="text-[11px] text-center font-black text-green-600 leading-none">
                                        {sub.fixedValue > 0 && (
                                          <span className="bg-green-100 text-green-700 text-[9px] md:text-[10px] py-0.5 rounded-full font-black">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.fixedValue)}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                            </div>
                            
                            <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setEditingSubspace(sub); setSubspaceName(sub.name); setSubspaceValue(String(sub.fixedValue)); setSubspaceImage(sub.imageUrl || null); setSubspaceModalOpen(true); }} className="p-2 bg-gray-50 hover:bg-white hover:text-blue-600 rounded-lg text-gray-400 shadow-sm transition-all"><Pencil size={14}/></button>
                                <button onClick={() => { if(confirm("Deletar subespaço?")) fetch(`/api/item-instances/delete?id=${sub.id}&force=true`, {method: 'DELETE'}).then(() => fetchInventory()) }} className="p-2 bg-gray-50 hover:bg-white hover:text-red-600 rounded-lg text-gray-400 shadow-sm transition-all"><Trash2 size={14}/></button>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Explorar</span>
                                <ChevronRight size={14} className="text-gray-300 group-hover:translate-x-1 transition-transform"/>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* SEÇÃO: ATIVOS */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-sm md:text-lg font-black text-teal-900 flex items-center gap-2 tracking-tighter"><Package size={18} className="text-teal-500"/> Ativos</h2>
            </div>

            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[1.5rem] md:rounded-[2.5rem] text-center">
                  <Box size={32} className="text-teal-100 mb-3"/>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Nenhum ativo aqui</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map((item: any) => (
                        <div key={item.id} className="group bg-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-gray-100 hover:border-teal-300 hover:shadow-lg transition-all flex items-center gap-4 relative">
                            <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                                {(item.imageUrl || item.definition?.imageUrl) ? <img src={item.imageUrl || item.definition?.imageUrl} className="w-full h-full object-cover" alt="Ativo" /> : <Box size={24} className="text-teal-100"/>}
                            </div>
                            <div className="flex-1 min-w-0 pr-12">
                                <h3 className="font-black text-blue-950 truncate text-[13px] md:text-sm mb-1 leading-tight">{item.definition?.name}</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">SKU: {item.definition?.sku || 'N/A'}</span>
                                    {item.serialNumber && <span className="text-[8px] font-black bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">S/N: {item.serialNumber}</span>}
                                </div>
                                {item.notes && <p className="text-[9px] font-bold text-gray-400 mt-1 truncate italic">"{item.notes}"</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {subspaceModalOpen && (
         <div className="fixed inset-0 bg-blue-950/70 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4">
            <form onSubmit={handleSaveSubspace} className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
                <button type="button" onClick={() => setSubspaceModalOpen(false)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2"><X/></button>
                <h3 className="text-xl font-black text-blue-950 mb-6 tracking-tight">{editingSubspace ? 'Ajustar Subespaço' : 'Novo Subespaço'}</h3>
                
                <ImageUpload value={subspaceImage} onChange={setSubspaceImage} label="Identificação Visual"/>
                
                <div className="space-y-4 mb-8 mt-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-2 block">Nome Identificador</label>
                      <input className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 text-gray-700 text-sm" placeholder="Ex: Prateleira A1" value={subspaceName} onChange={e => setSubspaceName(e.target.value)} required disabled={isProcessing} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-2 block">Custo Fixo (Opcional)</label>
                      <div className="relative">
                          <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                          <input type="number" step="0.01" className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl pl-10 pr-4 py-4 font-bold outline-none focus:border-indigo-500 text-gray-700 text-sm" placeholder="0.00" value={subspaceValue} onChange={e => setSubspaceValue(e.target.value)} disabled={isProcessing} />
                      </div>
                    </div>
                </div>

                <button type="submit" disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300 text-xs md:text-sm uppercase tracking-widest">
                    {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                    {isProcessing ? 'Processando...' : 'Salvar Estrutura'}
                </button>
            </form>
         </div>
      )}

      {itemModalOpen && (
         <div className="fixed inset-0 bg-blue-950/70 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4">
            <form onSubmit={handleSaveItem} className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
                <button type="button" onClick={() => setItemModalOpen(false)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2"><X/></button>
                <h3 className="text-xl font-black text-blue-950 mb-6 tracking-tight">{editingItem ? 'Editar Ativo' : 'Novo Ativo'}</h3>
                
                <ImageUpload value={itemImage} onChange={setItemImage} label="Foto Real do Item"/>
                
                <div className="space-y-4 mb-8 mt-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-2 block">Modelo do Produto</label>
                      <select className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl p-4 font-bold outline-none focus:border-teal-500 text-gray-700 text-sm appearance-none" value={defId} onChange={e => setDefId(e.target.value)} required disabled={isProcessing}>
                          <option value="">Selecione no catálogo...</option>
                          {definitions.map(def => <option key={def.id} value={def.id}>{def.name} ({def.sku})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-2 block">Número de Série / Tag</label>
                      <input className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl p-4 font-bold outline-none focus:border-teal-500 text-gray-700 text-sm" placeholder="EX: SN-2024-XXXX" value={itemSerial} onChange={e => setItemSerial(e.target.value)} disabled={isProcessing} />
                    </div>
                </div>

                <button type="submit" disabled={isProcessing} className="w-full py-4 bg-teal-600 text-white rounded-xl md:rounded-2xl font-black shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300 text-xs md:text-sm uppercase tracking-widest">
                    {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                    {isProcessing ? 'Gravando...' : 'Finalizar Ativo'}
                </button>
            </form>
         </div>
      )}
    </Layout>
  );
}