// pages/inventory-view.tsx

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import {  
  MapPin, Layers, Trash2, Plus, X, Loader2, Package, Box, Pencil, Search, ChevronRight, ArrowLeft
} from 'lucide-react';

// 1. Tipagem definida para evitar o erro 'any'
interface SubSpace {
  id: string;
  name: string;
  items?: any[];
  children?: SubSpace[];
  parentId?: string | null;
  _count?: {
    items: number;
    children: number;
  };
}

export default function InventoryView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<SubSpace | null>(null);

  // Estados de Modais e Filtros
  const [subspaceModalOpen, setSubspaceModalOpen] = useState(false);
  const [editingSubspace, setEditingSubspace] = useState<SubSpace | null>(null);
  const [subspaceName, setSubspaceName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Função de busca aprimorada
  const fetchInventory = useCallback(async () => {
    // Garantimos que pegamos o ID da URL (location)
    const locationId = router.query.location;

    if (!router.isReady || !locationId) return;    
    
    setLoading(true);

    try {
      // Chamada para a API que corrigimos anteriormente
      const res = await fetch(`/api/item-instances/list?id=${locationId}&fetchChildren=true&includeItems=true`);
      const data = await res.json();

      if (data.itemInstances && data.itemInstances.length > 0) {
          // A API retorna um array, pegamos o primeiro item que é o local atual
          setCurrentLocation(data.itemInstances[0]);
      } else {
          setCurrentLocation(null);
      }
    } catch (err) { 
        console.error("Erro ao carregar inventário:", err); 
    } finally { 
        setLoading(false); 
    }
  }, [router.query.location, router.isReady]); // Observa a mudança da localização na URL

  useEffect(() => { 
    fetchInventory(); 
  }, [fetchInventory]);

  // 3. Função para Navegação (Drill-down)
  const handleNavigate = (id: string) => {
    // Ao clicar, empurramos a nova URL. O useEffect acima detectará a mudança.
    router.push(`/inventory-view?location=${id}`);
  };

  const handleSaveSubspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!subspaceName.trim() || !currentLocation) return;
    try {
        const isEdit = !!editingSubspace;
        const url = isEdit ? '/api/item-instances/update' : '/api/item-instances/create';
        const method = isEdit ? 'PUT' : 'POST';
        const body = isEdit 
            ? { id: editingSubspace.id, name: subspaceName }
            : { name: subspaceName, parentId: currentLocation.id }; 
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (res.ok) {
            setSubspaceModalOpen(false);
            setSubspaceName('');
            setEditingSubspace(null);
            fetchInventory();
        }
    } catch (err) { alert('Erro de conexão.'); } 
  };

  const handleDeleteSubspace = async (id: string) => {
      if(!confirm("Remover este espaço?")) return;
      await fetch(`/api/item-instances/delete?id=${id}`, { method: 'DELETE' });
      fetchInventory();
  };

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-blue-900 font-black gap-2"><Loader2 className="animate-spin"/> CARREGANDO...</div></Layout>;

  if (!currentLocation) return <Layout><div className="p-20 text-center font-bold text-gray-400">Local não encontrado.</div></Layout>;

  // Filtragem
  const filteredChildren = currentLocation.children?.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  const filteredItems = currentLocation.items?.filter((i) => 
    i.definition?.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Layout title={currentLocation.name}>
      <div className="max-w-7xl mx-auto py-6 md:py-8 px-4">

        {/* Header / Breadcrumb */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 mb-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            <button onClick={() => router.back()} className="text-blue-600 font-bold flex items-center mb-2 text-sm"><ArrowLeft size={16} className="mr-1"/> Voltar</button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

             <div className="flex items-center gap-4">

                 <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg">

                     <MapPin size={24}/>

                 </div>

                 <div>

                    <h1 className="text-2xl font-black text-blue-950 leading-none">{currentLocation.name}</h1>

                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">

                        {filteredChildren.length} subespaços • {filteredItems.length} ativos

                    </p>

                 </div>

             </div>

             

             <div className="relative w-full md:w-64">

                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>

                <input 

                    className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-gray-600 outline-none"

                    placeholder="Filtrar conteúdo..."

                    value={searchQuery}

                    onChange={e => setSearchQuery(e.target.value)}

                />

             </div>

          </div>

        </div>



        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          

          {/* Subespaços */}

          <div className="lg:col-span-7 flex flex-col gap-4">

            <div className="flex justify-between items-center px-2">

               <h2 className="text-lg font-black text-indigo-900 flex items-center gap-2">

                   <Layers size={18} className="text-indigo-500"/> Subespaços

               </h2>

               <button 

                 onClick={() => { setEditingSubspace(null); setSubspaceName(''); setSubspaceModalOpen(true); }} 

                 className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center gap-2"

               >

                 <Plus size={14}/> Criar Subespaço

               </button>

            </div>

            

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {filteredChildren.map((sub: SubSpace) => ( // Tipado corretamente

                    <div 

                        key={sub.id} 

                        onClick={() => handleNavigate(sub.id)} // Função de entrada

                        className="group bg-white p-4 rounded-2xl border border-gray-100 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between min-h-[100px]"

                    >

                        <div className="flex items-start justify-between">

                            <div className='flex'>

                                <div className="bg-blue-50 text-blue-500 p-2 rounded-lg"><Layers size={20}/></div>

                                <div className="pl-3">

                                    <h3 className="font-bold text-blue-950 leading-tight">{sub.name}</h3>

                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">

                                      {sub.items?.length || 0} ativos

                                    </p>

                                </div>

                            </div>

                            

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>

                                <button onClick={() => { setEditingSubspace(sub); setSubspaceName(sub.name); setSubspaceModalOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500"><Pencil size={14}/></button>

                                <button onClick={() => handleDeleteSubspace(sub.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

          </div>



          {/* Ativos */}

          <div className="lg:col-span-5 flex flex-col gap-4">

            <h2 className="text-lg font-black text-teal-900 flex items-center gap-2 px-2">

                <Box size={18} className="text-teal-500"/> Ativos

            </h2>

            <div className="bg-white rounded-[2rem] border border-gray-100 p-2 shadow-sm min-h-[200px]">

                <div className="flex flex-col gap-2 p-2">

                    {filteredItems.map((item: any) => (

                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">

                            <div className="bg-white p-2 rounded-lg text-teal-600 shadow-sm border border-gray-100">

                                <Package size={20}/>

                            </div>

                            <div className="flex-1 min-w-0">

                                <p className="font-bold text-gray-800 text-sm truncate">{item.definition.name}</p>

                                <p className="text-[10px] font-mono text-gray-400 uppercase">SN do Ativo: {item.definition?.sku || 'N/A'}</p>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

          </div>

        </div>

      </div>



      {/* Modal Reutilizável */}

      {subspaceModalOpen && (

         <div className="fixed inset-0 bg-blue-950/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">

            <form onSubmit={handleSaveSubspace} className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm relative shadow-2xl">

                <button type="button" onClick={() => setSubspaceModalOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500"><X/></button>

                <h3 className="text-lg font-black text-blue-950 mb-4">{editingSubspace ? 'Editar Nome' : 'Novo Subespaço'}</h3>

                <input 

                    className="input-primary mb-4" 

                    placeholder="Ex: Gaveta A, Prateleira 2..." 

                    value={subspaceName} 

                    onChange={e => setSubspaceName(e.target.value)} 

                    autoFocus 

                />

                <button className="btn-primary w-full">Confirmar</button>

            </form>

         </div>

      )}



      <style jsx global>{`

        .input-primary { width: 100%; background: #f9fafb; border: 2px solid transparent; border-radius: 1rem; padding: 1rem; font-weight: 700; outline: none; }

        .input-primary:focus { border-color: #4f46e5; background: white; }

        .btn-primary { padding: 1rem; background: #4f46e5; color: white; border-radius: 1rem; font-weight: 900; }

      `}</style>

    </Layout>

  );

}