// pages/catalog.tsx
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { Tags, Pencil, Trash2, PlusCircle, PackageOpen, Loader2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface ItemDefinition {
  id: string;
  name: string;
  sku: string;
}

export default function CatalogPage() {
  const [definitions, setDefinitions] = useState<ItemDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados de Formulário
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formProcessing, setFormProcessing] = useState(false);

  // Estados de Paginação e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDefs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/item-definitions/list');
      const data = await res.json();
      setDefinitions(data.items || (Array.isArray(data) ? data : []));
    } catch (err) { 
      setDefinitions([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchDefs(); }, []);

  // Lógica de Filtragem e Paginação
  const filteredDefinitions = definitions.filter(def => 
    def.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    def.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDefinitions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredDefinitions.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const resetForm = () => {
    setNewName('');
    setNewSku('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormProcessing(true);

    const payload = { 
      name: newName, 
      sku: newSku.toUpperCase(),
      cost: 0,
      usefulLifeMonths: 60
    };

    const url = editingId ? `/api/item-definitions/update?id=${editingId}` : '/api/item-definitions/create';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchDefs();
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Falha ao salvar'}`);
      }
    } catch (err) { 
      alert("Erro de conexão."); 
    } finally {
      setFormProcessing(false);
    }
  };

  const startEdit = (def: ItemDefinition) => {
    setEditingId(def.id);
    setNewName(def.name);
    setNewSku(def.sku);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este modelo permanentemente?")) return;
    try {
      const res = await fetch(`/api/item-definitions/delete?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchDefs();
      else alert("Não foi possível excluir. O item pode estar em uso.");
    } catch (err) { alert("Erro ao excluir."); }
  };

  if (loading) return <Layout><div className="flex h-screen items-center justify-center text-blue-900 font-black animate-pulse"><Loader2 className="animate-spin mr-2"/> CARREGANDO...</div></Layout>;

  return (
    <Layout title="Catálogo">
      <div className="max-w-6xl mx-auto py-6 md:py-10 px-4 md:px-6">
        
        {/* Header com Pesquisa */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-50">
          <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto items-center">
             <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-md shadow-gray-300"><Tags size={28}/></div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-blue-950 tracking-tight italic">Catálogo</h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Gerenciar Modelos</p>
                </div>
             </div>
             
             {/* Barra de Pesquisa */}
             <div className="relative w-full sm:w-64 lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                <input 
                    type="text" 
                    placeholder="Buscar ativo ou SKU..." 
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl font-bold text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
             </div>
          </div>

          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <PlusCircle size={20}/> Novo Ativo
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col justify-between">
          <div>
            {currentItems.length > 0 ? (
                <div className="divide-y divide-gray-50">
                {currentItems.map((def) => (
                    <div key={def.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-blue-50/30 transition-colors gap-4 animate-in fade-in">
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-blue-950 text-lg truncate">{def.name}</p>
                        <span className="inline-block bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-1 rounded-md mt-1 uppercase tracking-wider">
                        SKU: {def.sku}
                        </span>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => startEdit(def)} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Pencil size={18}/>
                        </button>
                        <button onClick={() => handleDelete(def.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18}/>
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                <PackageOpen size={48} className="mx-auto text-gray-200 mb-4" />
                <h3 className="text-lg font-black text-gray-400 uppercase">
                    {searchTerm ? "Nenhum resultado encontrado" : "Catálogo Vazio"}
                </h3>
                </div>
            )}
          </div>

          {/* Paginação Estilo "Setinha pros 2 lados" */}
          {filteredDefinitions.length > 0 && (
              <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => goToPage(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                          <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={() => goToPage(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                          <ChevronRight size={20} />
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Modal permanece igual... (Omitido para economizar espaço, mantenha o seu anterior) */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-blue-950/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-6 md:p-10 w-full max-w-md shadow-2xl relative">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"><X/></button>
            <h3 className="text-2xl font-black text-blue-950 mb-6 tracking-tight">{editingId ? 'Editar Ativo' : 'Novo Ativo'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block">Nome</label>
                <input className="w-full bg-gray-50 text-gray-500 border-2 border-transparent rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all" value={newName} onChange={e => setNewName(e.target.value)} required />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 mb-1 block">SKU / Código</label>
                <input className="w-full bg-gray-50 text-gray-500 border-2 border-transparent rounded-2xl p-4 font-bold outline-none focus:border-blue-500 transition-all uppercase" value={newSku} onChange={e => setNewSku(e.target.value)} required />
              </div>
            </div>
            <button type="submit" disabled={formProcessing} className="w-full mt-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              {formProcessing ? <Loader2 className="animate-spin" size={20}/> : 'Salvar no Catálogo'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}