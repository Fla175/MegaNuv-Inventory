// pages/index.tsx
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
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
  Save
} from "lucide-react";

interface ItemInstanceLocation {
  id: string;
  name: string;
  parentId: string | null;
  _count?: { items: number; children: number; };
}

// Modal Reutilizável para Criar ou Editar Raízes
const RootLocationModal = ({ isOpen, onClose, onSave, initialData, isLoading }: any) => {
    const [name, setName] = useState('');
    
    useEffect(() => { 
        if (isOpen) setName(initialData?.name || ''); 
    }, [isOpen, initialData]);
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-blue-950/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
        <form 
            onSubmit={(e) => { e.preventDefault(); onSave(name); }} 
            className="bg-white rounded-[2.5rem] p-6 md:p-8 w-full max-w-sm shadow-2xl relative"
        >
          <button type="button" onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"><X/></button>
          <h3 className="text-xl font-black text-blue-950 mb-6">
            {initialData ? 'Editar Espaço Pai' : 'Novo Espaço Pai'}
          </h3>
          
          <div className="mb-6">
              <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block">Nome do Local</label>
              <input 
                  autoFocus
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all text-gray-700" 
                  placeholder="Ex: Galpão Central" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
              />
          </div>
  
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" size={20}/> : <><Save size={18}/> Salvar</>}
          </button>
        </form>
      </div>
    );
};

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<ItemInstanceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle do Modal
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

  // Lógica Unificada: Criar ou Editar
  const handleSave = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setFormLoading(true);
    try {
        const isEdit = !!editingLoc;
        const url = isEdit ? '/api/item-instances/update' : '/api/item-instances/create';
        const method = isEdit ? 'PUT' : 'POST';
        
        // Payload dinâmico
        const body = isEdit 
            ? { id: editingLoc.id, name: trimmed } 
            : { name: trimmed, parentId: null }; // parentId null garante que é raiz

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Falha na operação");

        setIsModalOpen(false);
        setEditingLoc(null);
        fetchLocations();
    } catch (err) {
        alert("Erro ao salvar espaço.");
    } finally {
        setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, isForced = false): Promise<void> => {
    if(!isForced && !confirm("Deseja deletar este espaço?")) return;
    
    try {
      const res = await fetch(`/api/item-instances/delete?id=${id}${isForced ? '&force=true' : ''}`, { method: 'DELETE' });
      if (res.status === 409) {
          if (confirm("Este espaço não está vazio. Deseja deletar TUDO dentro dele permanentemente?")) {
              handleDelete(id, true);
          }
      } else if (res.ok) {
          fetchLocations();
      }
    } catch (err) { alert("Erro de conexão"); }
  };

  useEffect(() => { fetchLocations(); }, []);

  const filteredLocations = locations.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-blue-900 font-black animate-pulse"><Loader2 className="animate-spin mr-2"/> CARREGANDO...</div></Layout>;

  return (
    <Layout title="Meus Espaços">
      <div className={`max-w-6xl mx-auto py-6 md:py-10 px-4 ${isModalOpen ? "blur-sm" : ""}`}>
        <Head><title>Espaços | MegaNuv</title></Head>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
             <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl"><Warehouse size={32} /></div>
                <div>
                    <h1 className="text-2xl font-black text-blue-950 italic">MegaNuv</h1>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Gestão de Espaços Físicos</p>
                </div>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Buscar Espaço Físico..." 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-500 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <button
            onClick={() => { setEditingLoc(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
          >
            <PlusCircle size={20} /> Novo Local
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((loc) => (
            <div key={loc.id} className="group bg-white border border-gray-100 rounded-[2.5rem] hover:shadow-xl transition-all flex flex-col overflow-hidden">
              <div className="p-8 flex-1">
                <div className="flex justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><MapPin size={24} /></div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingLoc(loc); setIsModalOpen(true); }} className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-xl"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(loc.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl"><Trash2 size={18} /></button>
                  </div>
                </div>
                <h2 className="text-xl font-black text-blue-950 mb-4 truncate">{loc.name}</h2>
                <div className="flex gap-3">
                   <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center">
                      <span className="block text-lg font-black text-indigo-600">{loc._count?.children || 0}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Subs</span>
                   </div>
                   <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center">
                      <span className="block text-lg font-black text-teal-600">{loc._count?.items || 0}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Itens</span>
                   </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/inventory-view?location=${loc.id}`)}
                className="w-full bg-blue-50 group-hover:bg-blue-600 py-4 text-xs font-black uppercase text-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Abrir <Eye size={16} />
              </button>
            </div>
          ))}
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