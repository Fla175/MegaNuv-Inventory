// pages/inventory-view.tsx
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ImageUpload from '@/components/imageUpload';
import { useUser } from '@/lib/context/UserContext';
import {  
  MapPin, Layers, Trash2, Plus, X, Loader2, Package, Box, Pencil, Search, ArrowLeft, DollarSign, Save, ChevronRight, Info, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

export default function InventoryView() {
  const router = useRouter();
  const { user } = useUser();
  useEffect(() => {
    console.log("Estado atual do usuário no Contexto:", user);
    console.log("Preferência de ordenação detectada:", user?.defaultSort);
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<SubSpace | null>(null);

  // --- ESTADOS: SUBESPAÇOS ---
  const [subspaceModalOpen, setSubspaceModalOpen] = useState(false);
  const [editingSubspace, setEditingSubspace] = useState<SubSpace | null>(null);
  const [subspaceName, setSubspaceName] = useState('');
  const [subspaceValue, setSubspaceValue] = useState('');
  const [subspaceImage, setSubspaceImage] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const fetchInventory = useCallback(async () => {
    const locationId = router.query.location;
    if (!router.isReady || !locationId || locationId === 'undefined') return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/item-instances/list?id=${locationId}&fetchChildren=true&includeItems=true`);
      const data = await res.json();
      setCurrentLocation(data.itemInstances?.[0] || null);
    } catch (err) { 
      console.error("Erro ao buscar inventário:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [router.query.location, router.isReady]);

  useEffect(() => { 
    fetchInventory(); 
  }, [fetchInventory]);

  // Fallback seguro para o tipo de ordenação
  const sortType = user?.defaultSort === 'newest' ? 'newest' : 'name';

  // Filtro e Ordenação (Subespaços)
  const filteredChildren = useMemo(() => {
    const filtered = currentLocation?.children?.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return [...filtered].sort((a, b) => {
      if (sortType === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [currentLocation?.children, searchQuery, sortType]);

  // Filtro e Ordenação (Ativos)
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = currentLocation?.items?.filter(i => 
        i.definition?.name.toLowerCase().includes(q) || 
        i.definition?.sku?.toLowerCase().includes(q) || 
        i.serialNumber?.toLowerCase().includes(q)
    ) || [];

    return [...filtered].sort((a, b) => {
      if (sortType === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      const nameA = a.definition?.name || "";
      const nameB = b.definition?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [currentLocation?.items, searchQuery, sortType]);

  const handleSaveSubspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!subspaceName.trim() || !currentLocation) return;
    
    setIsProcessing(true);
    try {
        const isEdit = !!editingSubspace;
        const res = await fetch(isEdit ? '/api/item-instances/update' : '/api/item-instances/create', {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: editingSubspace?.id, 
                name: subspaceName, 
                parentId: currentLocation.id, 
                fixedValue: Number(subspaceValue), 
                imageUrl: subspaceImage 
            })
        });
        
        if (res.ok) { 
          setSubspaceModalOpen(false); 
          fetchInventory(); 
        }
    } catch (err) {
      console.error("Erro ao salvar subespaço:", err);
    } finally { 
      setIsProcessing(false); 
    }
  };

  const deleteSubspace = async (id: string) => {
    if(!confirm("Deletar subespaço? Todos os itens dentro dele serão afetados.")) return;
    try {
      const res = await fetch(`/api/item-instances/delete?id=${id}&force=true`, { method: 'DELETE' });
      if (res.ok) fetchInventory();
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  const PrintLabel = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2rem] max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-blue-900 uppercase text-xs tracking-widest">Etiqueta de Local</h3>
          <button onClick={() => setIsQRModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
        </div>
  
        {/* ÁREA DA ETIQUETA - O que será impresso */}
        <div id="printable-label" className="border-2 border-black p-4 rounded-lg bg-white flex flex-col items-center text-black">
          <div className="text-center mb-2">
            <h2 className="text-lg font-black uppercase leading-tight">{currentLocation?.name}</h2>
            <p className="text-[8px] font-bold tracking-[0.2em] opacity-60">SISTEMA DE INVENTÁRIO</p>
          </div>
  
          <div className="bg-white p-2 border border-black/10 rounded-sm">
            <QRCodeSVG 
              value={`${window.location.origin}/qrcode/view?id=${currentLocation?.id}`}
              size={150}
              level="H"
            />
          </div>
  
          <div className="mt-3 w-full border-t border-black/20 pt-2 flex justify-between items-center">
            <span className="text-[7px] font-mono opacity-50">{currentLocation?.id}</span>
            <Box size={10} className="opacity-30"/>
          </div>
        </div>
  
        <button 
          onClick={() => window.print()} 
          className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <Printer size={16}/> IMPRIMIR ETIQUETA
        </button>
        
        <p className="text-[9px] text-center text-gray-400 mt-4 italic">
          Dica: Use impressoras térmicas (Zebra/Brother) para etiquetas adesivas.
        </p>
      </div>
    </div>
  );

  if (loading) return (
    <Layout>
      <div className="flex h-[60vh] items-center justify-center text-blue-900 dark:text-blue-400 font-black gap-2 animate-pulse">
        <Loader2 className="animate-spin"/> CARREGANDO...
      </div>
    </Layout>
  );

  if (!currentLocation) return (
    <Layout>
      <div className="p-20 text-center font-bold text-gray-400">Local não encontrado.</div>
    </Layout>
  );

  return (
    <Layout title={currentLocation.name}>
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-3 sm:px-6">

        {/* CABEÇALHO DE CONTEXTO */}
        <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 mb-6 border border-gray-100 dark:border-white/5 shadow-sm transition-colors">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest transition-all mb-4 md:mb-6 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Voltar
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="flex items-start gap-4 min-w-0">
                 <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shrink-0"><MapPin size={24}/></div>
                 <div className="min-w-0">
                    <h1 className="text-xl md:text-3xl font-black text-blue-950 dark:text-white leading-tight truncate">{currentLocation.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button 
                        onClick={() => setIsQRModalOpen(true)}
                        className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white transition-all text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                      >
                        <Printer size={12}/> Etiqueta QR
                      </button>
                      <span className="text-[9px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        {currentLocation._count?.children || 0} Subespaços • {currentLocation._count?.items || 0} Ativos
                       </span>
                      {currentLocation.fixedValue > 0 && (
                        <span className="bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[9px] px-2 py-0.5 rounded-full font-black">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentLocation.fixedValue)}
                        </span>
                      )}
                    </div>
                 </div>
             </div>
             <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                  className="w-full bg-gray-50 dark:bg-zinc-950 border-none rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 transition-all" 
                  placeholder="Filtrar nesta visualização..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SEÇÃO: SUBESPAÇOS */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-1">
               <h2 className="text-sm md:text-lg font-black text-indigo-900 dark:text-indigo-400 flex items-center gap-2 tracking-tighter"><Layers size={18}/> Subespaços</h2>
               <button onClick={() => { setEditingSubspace(null); setSubspaceName(''); setSubspaceValue(''); setSubspaceImage(null); setSubspaceModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg dark:shadow-none">
                <Plus size={16}/><span className="hidden md:inline">Adicionar</span>
               </button>
            </div>
            
            {filteredChildren.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[2rem] text-center">
                  <Layers size={32} className="text-indigo-100 dark:text-indigo-900 mb-3"/>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Nenhum subespaço</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredChildren.map((sub: SubSpace) => (
                        <div key={sub.id} onClick={() => router.push(`/inventory-view?location=${sub.id}`)} className="group bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-xl cursor-pointer transition-all flex flex-col min-h-[110px] relative">
                            <div className="flex items-start gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center shrink-0 overflow-hidden border dark:border-white/5">
                                  {sub.imageUrl ? <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover" /> : <Layers size={20}/>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-black text-blue-950 dark:text-gray-200 truncate text-sm mb-1">{sub.name}</h3>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{sub._count?.items ?? 0} ativos</p>
                                  {sub.fixedValue > 0 && (
                                    <div className="inline-block bg-green-50 dark:bg-green-500/10 px-2 py-1 mt-2 rounded-lg border border-green-100 dark:border-green-900/20">
                                      <p className="text-[10px] font-black text-green-600 dark:text-green-400 leading-none">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sub.fixedValue)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                            </div>
                            
                            <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <button onClick={() => { setEditingSubspace(sub); setSubspaceName(sub.name); setSubspaceValue(String(sub.fixedValue)); setSubspaceImage(sub.imageUrl || null); setSubspaceModalOpen(true); }} className="p-2 bg-gray-50 dark:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-gray-400 transition-all shadow-sm"><Pencil size={14}/></button>
                                <button onClick={() => deleteSubspace(sub.id)} className="p-2 bg-gray-50 dark:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-gray-400 transition-all shadow-sm"><Trash2 size={14}/></button>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Explorar</span>
                                <ChevronRight size={14} className="text-gray-300 group-hover:translate-x-1 transition-transform"/>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* SEÇÃO: ATIVOS */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-sm md:text-lg font-black text-teal-900 dark:text-teal-400 flex items-center gap-2 tracking-tighter"><Package size={18}/> Ativos</h2>

            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 dark:bg-zinc-900/30 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[2rem] text-center">
                  <Box size={32} className="text-teal-100 dark:text-teal-900 mb-3"/>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Nenhum ativo aqui</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map((item: any) => (
                        <div key={item.id} onClick={() => setSelectedAsset(item)} className="group bg-white dark:bg-zinc-900 p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 hover:border-teal-300 dark:hover:border-teal-800 hover:shadow-lg transition-all flex items-center gap-4 relative">
                            <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-zinc-950 flex-shrink-0 overflow-hidden border border-teal-400 dark:border-white/5 flex items-center justify-center">
                                {(item.definition?.imageUrl) ? <img src={item.definition?.imageUrl} alt={item.definition?.name} className="w-full h-full object-cover" /> : <Box size={24} className="text-teal-100 dark:text-teal-900"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-blue-950 dark:text-gray-200 truncate text-sm mb-1 leading-tight">{item.definition?.name}</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[8px] font-black bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded uppercase">SKU: {item.definition?.sku || 'N/A'}</span>
                                    {item.serialNumber && <span className="text-[8px] font-black bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded uppercase">S/N: {item.serialNumber}</span>}
                                </div>
                                {item.notes && <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-1 truncate italic">&quot;{item.notes}&quot;</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL SUBESPAÇO */}
      {subspaceModalOpen && (
         <div className="fixed inset-0 bg-blue-950/70 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
            <form onSubmit={handleSaveSubspace} className="bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto border dark:border-white/10">
                <button type="button" onClick={() => setSubspaceModalOpen(false)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2"><X/></button>
                <h3 className="text-xl font-black text-blue-950 dark:text-white mb-6 tracking-tight">{editingSubspace ? 'Editar Subespaço' : 'Novo Subespaço'}</h3>
                
                <ImageUpload value={subspaceImage} onChange={setSubspaceImage} label="Identificação Visual"/>
                
                <div className="space-y-4 mb-8 mt-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-2 block">Nome Identificador</label>
                      <input 
                        className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white border-2 border-transparent rounded-xl p-4 font-bold outline-none focus:border-indigo-500 text-sm transition-all" 
                        placeholder="Ex: Prateleira A1" 
                        value={subspaceName} 
                        onChange={e => setSubspaceName(e.target.value)} 
                        required 
                        disabled={isProcessing} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-2 block">Custo Fixo (Opcional)</label>
                      <div className="relative">
                          <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white border-2 border-transparent rounded-xl pl-10 pr-4 py-4 font-bold outline-none focus:border-indigo-500 text-sm transition-all" 
                            placeholder="0.00" 
                            value={subspaceValue} 
                            onChange={e => setSubspaceValue(e.target.value)} 
                            disabled={isProcessing} 
                          />
                      </div>
                    </div>
                </div>

                <button type="submit" disabled={isProcessing} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300 text-xs uppercase tracking-widest">
                    {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                    {isProcessing ? 'Processando...' : 'Salvar Estrutura'}
                </button>
            </form>
         </div>
      )}

      {/* MODAL ATIVOS */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-blue-950/70 z-[100] flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl relative border dark:border-white/10 overflow-hidden">
            <button onClick={() => setSelectedAsset(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 z-10 p-2"><X/></button>
            
            <div className="h-48 w-full bg-gray-200 dark:bg-zinc-800 relative">
              {(selectedAsset.imageUrl || selectedAsset.definition?.imageUrl) ? (
                <img src={selectedAsset.imageUrl || selectedAsset.definition?.imageUrl} className="w-auto h-auto m-auto items-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Box size={48}/></div>
              )}
              <div className="absolute bottom-4 left-6">
                 <span className="bg-teal-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg">
                   {selectedAsset.tag === "IN-STOCK" ? "Em Estoque" : selectedAsset.tag === "IN-USE" ? "Em Uso" : "À Venda"}
                 </span>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{selectedAsset.definition?.brand || 'Sem Marca'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">{selectedAsset.definition?.line || 'Geral'}</span>
                </div>
                <h3 className="text-2xl font-black text-blue-950 dark:text-white leading-tight">{selectedAsset.definition?.name}</h3>
                <p className="text-gray-400 font-bold text-xs mt-1 italic">SKU: {selectedAsset.definition?.sku}</p>
              </div>

              {/* Especificações */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-white/5 pb-2">Especificações Técnicas</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedAsset.specifications ? Object.entries(selectedAsset.specifications).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-zinc-950 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-1">{key}</p>
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-300">{String(value)}</p>
                    </div>
                  )) : (
                    <p className="text-[10px] text-gray-400 font-bold italic col-span-2">Nenhuma especificação cadastrada.</p>
                  )}
                </div>
              </div>

              {selectedAsset.notes && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                  <p className="text-[9px] font-black text-amber-600 uppercase mb-1 flex items-center gap-1"><Info size={12}/> Observações</p>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isQRModalOpen && <PrintLabel />}
    </Layout>
  );
}