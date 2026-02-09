// pages/catalog.tsx
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { 
  Tags, Pencil, Trash2, PlusCircle, PackageOpen, Loader2, X, Search, 
  ChevronLeft, ChevronRight, ImageIcon, Save 
} from 'lucide-react';
import ImageUpload from '../components/imageUpload';
import { useRouter } from 'next/router';

interface ItemDefinition {
  id: string;
  name: string;
  sku: string;
  brand?: string | null;
  line?: string | null;
  imageUrl?: string | null;
}

const getCookie = (name: string) => {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export default function CatalogPage() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState<ItemDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newLine, setNewLine] = useState('');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formProcessing, setFormProcessing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchDefs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/item-definitions/list');
      const data = await res.json();
      // Ajuste para garantir que tratamos a estrutura de retorno da API corretamente
      const items = data.items || (Array.isArray(data) ? data : []);
      setDefinitions(items);
    } catch (err) { 
      console.error("Erro ao buscar definições:", err);
      setDefinitions([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchDefs(); }, []);

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
    setNewImageUrl(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormProcessing(true);
    const token = getCookie('auth_token');

    const payload = { 
      name: newName, 
      sku: newSku.toUpperCase(),
      brand: newBrand,
      line: newLine,
      imageUrl: newImageUrl,
    };

    const url = editingId ? `/api/item-definitions/update?id=${editingId}` : '/api/item-definitions/create';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchDefs();
      } else if (res.status === 401) {
          router.push('/login');
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Falha ao salvar'}`);
      }
    } catch (err) { 
      console.error("Erro na submissão:", err);
      alert("Erro de conexão."); 
    } finally {
      setFormProcessing(false);
    }
  };

  const startEdit = (def: ItemDefinition) => {
    setEditingId(def.id);
    setNewName(def.name);
    setNewSku(def.sku);
    setNewImageUrl(def.imageUrl || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este modelo permanentemente?")) return;
    try {
      const res = await fetch(`/api/item-definitions/delete?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchDefs();
      else alert("Não foi possível excluir. O item pode estar em uso.");
    } catch (err) { 
        console.error("Erro ao deletar:", err);
        alert("Erro ao excluir."); 
    }
  };

  if (loading) return (
    <Layout>
        <div className="flex h-screen items-center justify-center text-blue-900 dark:text-blue-400 font-black animate-pulse">
            <Loader2 className="animate-spin mr-2"/> CARREGANDO...
        </div>
    </Layout>
  );

  return (
    <Layout title="Catálogo">
      <div className="max-w-6xl mx-auto py-4 md:py-10 px-3 sm:px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-6 gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-50 dark:border-white/5 transition-colors">
          <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shrink-0"><Tags size={22}/></div>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-blue-950 dark:text-white italic truncate tracking-tight">Catálogo</h1>
                    <p className="text-gray-400 dark:text-gray-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest truncate">Definições de Produto</p>
                </div>
             </div>
             
             <div className="relative w-full sm:max-w-[240px] md:max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Buscar por nome ou SKU..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-950 rounded-xl font-bold text-[13px] md:text-sm text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all border border-transparent"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
             </div>
          </div>

          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 shrink-0"
          >
            <PlusCircle size={18}/> <span>Novo Item</span>
          </button>
        </div>

        {/* Inventory List */}
        <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden min-h-[400px] flex flex-col justify-between transition-colors">
          <div>
            {currentItems.length > 0 ? (
                <div className="divide-y divide-gray-50 dark:divide-white/5">
                {currentItems.map((def) => (
                    <div key={def.id} className="flex items-center justify-between p-3.5 sm:p-6 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                            <div className="h-11 w-11 md:h-14 md:w-14 rounded-lg md:rounded-2xl bg-gray-50 dark:bg-zinc-800 flex-shrink-0 overflow-hidden border border-gray-100 dark:border-white/5 flex items-center justify-center">
                                {def.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={def.imageUrl} className="w-full h-full object-cover" alt={def.name} />
                                ) : (
                                    <ImageIcon className="text-gray-300 dark:text-gray-600" size={18} />
                                )}
                            </div>
                            <div className="min-w-0 flex flex-col">
                                <p className="font-black text-blue-950 dark:text-gray-200 text-[13px] sm:text-base md:text-lg truncate leading-tight">{def.name}</p>
                                <div className="mt-1">
                                  <span className="bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                      SKU: {def.sku}
                                  </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-0.5 sm:gap-2 shrink-0">
                            <button onClick={() => startEdit(def)} className="p-2 md:p-3 text-gray-400 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                <Pencil size={15} className="md:w-[18px] md:h-[18px]"/>
                            </button>
                            <button onClick={() => handleDelete(def.id)} className="p-2 md:p-3 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                <Trash2 size={15} className="md:w-[18px] md:h-[18px]"/>
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="py-20 text-center px-4">
                    <PackageOpen size={40} className="mx-auto text-gray-200 dark:text-zinc-800 mb-3" />
                    <h3 className="text-[13px] md:text-base font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                        Nenhum modelo encontrado
                    </h3>
                </div>
            )}
          </div>

          {/* Pagination */}
          {filteredDefinitions.length > 0 && (
              <div className="p-3.5 md:p-6 border-t border-gray-50 dark:border-white/5 flex items-center justify-between bg-gray-50/30 dark:bg-zinc-950/30">
                  <span className="text-[8px] md:text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                      Pág. {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-1.5 md:gap-2">
                      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 md:p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 hover:text-blue-600 disabled:opacity-40 transition-all"><ChevronLeft size={16} /></button>
                      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 md:p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 hover:text-blue-600 disabled:opacity-40 transition-all"><ChevronRight size={16} /></button>
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-blue-950/70 z-[100] flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md shadow-2xl relative max-h-[92vh] overflow-y-auto border dark:border-white/10"
          >
            <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-2"><X size={20}/></button>
            
            <h3 className="text-lg md:text-2xl font-black text-blue-950 dark:text-white mb-5 tracking-tight">
                {editingId ? 'Editar Modelo' : 'Novo Modelo'}
            </h3>
            
            <div className="space-y-4 md:space-y-6">
              <ImageUpload value={newImageUrl} onChange={setNewImageUrl} label="Imagem de Referência" />

              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase ml-1 block">Nome do Produto</label>
                <input className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-700 dark:text-gray-300 border-2 border-transparent rounded-xl p-3 md:p-4 font-bold outline-none focus:border-blue-500 transition-all text-[13px] md:text-base" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Ex: Teclado Dell A37" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase ml-1 block">SKU</label>
                <input className="w-full bg-gray-50 dark:bg-zinc-950 text-gray-700 dark:text-gray-300 border-2 border-transparent rounded-xl p-3 md:p-4 font-bold outline-none focus:border-blue-500 transition-all uppercase text-[13px] md:text-base" value={newSku} onChange={e => setNewSku(e.target.value)} required placeholder="(pesquise o SKU na internet)" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase ml-1">Marca</label>
                <input className="w-full bg-gray-50 dark:bg-zinc-950 border-2 border-transparent rounded-xl p-3 font-bold outline-none focus:border-blue-500 transition-all text-[13px] md:text-base" value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Ex: Seagate" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase ml-1">Linha</label>
                <input className="w-full bg-gray-50 dark:bg-zinc-950 border-2 border-transparent rounded-xl p-3 font-bold outline-none focus:border-blue-500 transition-all text-[13px] md:text-base" value={newLine} onChange={e => setNewLine(e.target.value)} placeholder="Ex: Linha Exos" />
              </div>
            </div>

            <button type="submit" disabled={formProcessing} className="w-full mt-6 md:mt-8 py-3.5 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-400">
              {formProcessing ? <Loader2 className="animate-spin mx-auto" size={18}/> : <div className="flex items-center justify-center gap-2"><Save size={16}/> <span>Salvar no Catálogo</span></div>}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}