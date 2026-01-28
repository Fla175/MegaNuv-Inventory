// pages/index.tsx
import Layout from "../components/Layout";
import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  PlusCircle,
  Eye,
  MapPin,
  Warehouse,
  Trash2,
  Loader2,
  Pencil,
  Search,
  X,
  Save,
  DollarSign
} from "lucide-react";
import ImageUpload from '@/components/imageUpload';

interface ItemInstanceLocation {
  id: string;
  name: string;
  parentId: string | null;
  fixedValue: number;
  imageUrl?: string | null;
  createdAt?: string;
  _count?: { items: number; children: number; };
}

const RootLocationModal = ({ isOpen, onClose, onSave, initialData, isLoading }: any) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    
    useEffect(() => { 
        if (isOpen) {
          setName(initialData?.name || '');
          setValue(initialData?.fixedValue || '');
          setImageUrl(initialData?.imageUrl || null);
        };
    }, [isOpen, initialData]);
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-blue-950/70 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
        <form 
            onSubmit={(e) => { e.preventDefault(); onSave(name, value, imageUrl); }} 
            className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md shadow-2xl relative max-h-[92vh] overflow-y-auto"
        >
          <button type="button" onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-300 hover:text-red-500 transition-colors p-2"><X size={20}/></button>
          
          <h3 className="text-lg md:text-2xl font-black text-blue-950 mb-6 md:mb-8 tracking-tight">
            {initialData ? 'Editar Espaço' : 'Novo Espaço Pai'}
          </h3>

          <div className="space-y-4 md:space-y-6">
            <ImageUpload 
                value={imageUrl} 
                onChange={setImageUrl} 
                label="Foto do Espaço (Opcional)"
            />
            
            <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase ml-2 block tracking-widest">Nome do Espaço</label>
                <input 
                    autoFocus
                    className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl p-3.5 md:p-4 font-bold outline-none focus:border-blue-500 transition-all text-gray-700 text-sm md:text-base" 
                    placeholder="Ex: Galpão Central" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                />
            </div>

            <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase ml-2 block tracking-widest">Valor Mensal (R$)</label>
                <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input 
                        type="number"
                        step="0.01"
                        className="w-full bg-gray-50 border-2 border-transparent rounded-xl md:rounded-2xl pl-10 pr-4 py-3.5 md:p-4 font-bold outline-none focus:border-blue-500 transition-all text-gray-700 text-sm md:text-base" 
                        placeholder="0.00" 
                        value={value} 
                        onChange={(e) => setValue(e.target.value)} 
                    />
                </div>
            </div>
          </div>
  
          <button type="submit" disabled={isLoading} className="w-full mt-8 py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-widest">
            {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={18}/> Salvar Espaço</>}
          </button>
        </form>
      </div>
    );
};

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<ItemInstanceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder] = useState<'alphabetical' | 'newest'>('alphabetical');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<ItemInstanceLocation | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/item-instances/list?onlyRoots=true");
      const data = await response.json();
      setLocations(data.itemInstances || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const filteredAndSortedLocations = useMemo(() => {
    let result = locations.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return result.sort((a, b) => {
        if (sortOrder === 'alphabetical') return (a.name || "").localeCompare(b.name || "");
        if (sortOrder === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        return 0;
    });
  }, [locations, searchTerm, sortOrder]);

  const handleSave = async (name: string, value: string, imageUrl: string | null) => {
    if (!name.trim()) return;
    setFormLoading(true);
    try {
        const isEdit = !!editingLoc;
        const body = isEdit 
            ? { id: editingLoc.id, name, fixedValue: Number(value), imageUrl } 
            : { name, parentId: null, fixedValue: Number(value), imageUrl };
  
        const res = await fetch(isEdit ? '/api/item-instances/update' : '/api/item-instances/create', {
            method: isEdit ? 'PUT' : 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        setIsModalOpen(false);
        setEditingLoc(null);
        fetchLocations();
    } catch (err) { alert("Erro ao salvar."); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string, isForced = false) => {
    if(!isForced && !confirm("Deletar este espaço?")) return;
    try {
      const res = await fetch(`/api/item-instances/delete?id=${id}${isForced ? '&force=true' : ''}`, { method: 'DELETE' });
      if (res.status === 409) {
          if (confirm("Espaço contém itens! Deletar TUDO permanentemente?")) handleDelete(id, true);
      } else if (res.ok) fetchLocations();
    } catch (err) { alert("Erro de conexão"); }
  };

  useEffect(() => { fetchLocations(); }, []);

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-blue-900 font-black animate-pulse"><Loader2 className="animate-spin mr-2"/> CARREGANDO...</div></Layout>;

  return (
    <Layout title="Meus Espaços">
      <div className={`max-w-6xl mx-auto py-4 md:py-10 px-3 sm:px-6 transition-all duration-300 ${isModalOpen ? "blur-md scale-[0.98]" : ""}`}>
        <Head><title>Espaços Físicos</title></Head>

        {/* Header Ultra-Adaptável */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 md:mb-10 gap-4 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-50">
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="bg-blue-600 p-3 rounded-xl md:rounded-2xl text-white shadow-lg shrink-0"><Warehouse size={24} /></div>
                <div className="min-w-0">
                    <h1 className="text-xl md:text-3xl font-black text-blue-950 italic truncate tracking-tight">Espaços</h1>
                    <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate">Infraestrutura</p>
                </div>
             </div>
             <div className="relative w-full sm:max-w-xs flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Buscar espaço..." 
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all border border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <button
            onClick={() => { setEditingLoc(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 md:py-4 px-6 md:px-8 rounded-xl md:rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 justify-center text-xs md:text-sm uppercase tracking-wider"
          >
            <PlusCircle size={18} /> <span className="hidden sm:inline">Novo</span> Espaço
          </button>
        </div>

        {/* Grid de Cards Otimizado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredAndSortedLocations.map((loc) => (
            <div key={loc.id} className="group bg-white border border-gray-100 rounded-[1.5rem] md:rounded-[2.5rem] hover:shadow-xl transition-all flex flex-col overflow-hidden animate-in fade-in duration-300">
              <div className="p-5 md:p-8 flex-1">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className="h-12 w-12 md:h-16 md:w-16 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden border border-blue-100 shrink-0">
                    {loc.imageUrl ? (
                        <img src={loc.imageUrl} className="w-full h-full object-cover" alt={loc.name} />
                    ) : (
                        <MapPin size={24} className="md:w-7 md:h-7" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingLoc(loc); setIsModalOpen(true); }} className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(loc.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <h2 className="text-lg md:text-xl font-black text-blue-950 mb-2 truncate tracking-tight">{loc.name}</h2>
                
                <div className="mb-4 md:mb-6">
                    <span className="inline-flex items-center text-sm md:text-lg font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loc.fixedValue || 0)}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                   <div className="bg-gray-50 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-center border border-gray-100/50">
                      <span className="block text-base md:text-lg font-black text-indigo-600 leading-none mb-1">{loc._count?.children || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Subespaços</span>
                   </div>
                   <div className="bg-gray-50 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-center border border-gray-100/50">
                      <span className="block text-base md:text-lg font-black text-teal-600 leading-none mb-1">{loc._count?.items || 0}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Ativos</span>
                   </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push(`/inventory-view?location=${loc.id}`)}
                className="w-full bg-blue-50 group-hover:bg-blue-600 py-3.5 md:py-4 text-[10px] md:text-xs font-black uppercase text-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2 border-t border-gray-50"
              >
                Explorar Inventário <Eye size={14} />
              </button>
            </div>
          ))}
          
          {filteredAndSortedLocations.length === 0 && !loading && (
             <div className="col-span-full py-16 md:py-24 text-center">
                <div className="bg-gray-50 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Warehouse size={32} className="text-gray-200"/>
                </div>
                <p className="text-gray-400 font-black uppercase text-[10px] md:text-xs tracking-widest">Nenhum espaço encontrado</p>
             </div>
          )}
        </div>
      </div>

      <RootLocationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingLoc}
        isLoading={formLoading}
      />
    </Layout>
  );
}