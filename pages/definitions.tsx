// pages/definitions.tsx
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import {
  Tags,
  Pencil,
  Trash2,
  PlusCircle,
  PackageOpen,
  ArrowUpRight
} from 'lucide-react';

interface ItemDefinition {
  id: string;
  name: string;
  sku: string;
  cost: number | null;
  depreciationRate: number; 
}

export default function ProductsPage() {
  const [definitions, setDefinitions] = useState<ItemDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCost, setNewCost] = useState<number | ''>('');
  const [newDepRate, setNewDepRate] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchDefs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/item-definitions/list');
      const data = await res.json();

      console.log("DADOS RECEBIDOS DA API:", data);

      if (data.items) {
        setDefinitions(data.items);
      } else if (Array.isArray(data)) {
        setDefinitions(data);
      } else {
        setDefinitions([]);
      }
    } catch (err) { 
      console.error("Erro ao carregar:", err);
      setDefinitions([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchDefs(); }, []);

  const resetForm = () => {
    setNewName('');
    setNewSku('');
    setNewCost('');
    setNewDepRate('');
    setEditingId(null);
  };

  // NOVA FUNÇÃO: Linkada ao botão de deletar
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a definição de "${name}"?`)) return;

    try {
      const res = await fetch(`/api/item-definitions/delete?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchDefs(); 
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Não é possível excluir: existem itens vinculados a esta definição.");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newName,
      sku: newSku.toUpperCase(),
      cost: newCost !== '' ? Number(newCost) : null,
      depreciationRate: Number(newDepRate) / 100,
      depreciationMethod: 'STRAIGHT_LINE'
    };

    const url = editingId ? `/api/item-definitions/${editingId}` : '/api/item-definitions/create';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchDefs();
      } else {
        const errorData = await res.json();
        alert("Erro ao salvar: " + errorData.message);
      }
    } catch (err) { 
      alert("Erro de conexão: " + err); 
    }
  };

  const startEdit = (def: ItemDefinition) => {
    setEditingId(def.id);
    setNewName(def.name);
    setNewSku(def.sku);
    setNewCost(def.cost || '');
    setNewDepRate(def.depreciationRate * 100);
    setIsModalOpen(true);
  };

  if (loading) return <Layout><div className="p-20 text-center font-black text-blue-900 animate-pulse">CARREGANDO...</div></Layout>;

  return (
    <Layout title="Def. de Produtos">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-blue-950 flex items-center">
            <Tags className="mr-3 text-blue-600"/> Definições de Produto
          </h1>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <PlusCircle size={20}/> Nova Def. de Produto
          </button>
        </div>

        {/* Lista de Definições */}
        {definitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {definitions.map((def) => {
              const costValue = def.cost ? Number(def.cost) : 0;
              const rateValue = def.depreciationRate ? Number(def.depreciationRate) * 100 : 0;

              return (
                <div key={def.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:border-blue-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">
                      {def.sku || 'SEM SKU'}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => startEdit(def)} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(def.id, def.name)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-blue-950 mb-4">{def.name}</h3>

                  <div className="flex justify-between border-t border-gray-50 pt-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Custo Base</p>
                      <p className="font-bold text-gray-700">
                        R$ {costValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Taxa Deprec.</p>
                      <p className="font-bold text-blue-600">
                        {rateValue.toFixed(1)}% /ano
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio */
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <PackageOpen size={48} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-blue-950">Nenhuma definição encontrada</h2>
            <p className="text-gray-500 mb-6 text-center max-w-xs">
              Sua lista de produtos está vazia devido ao reset do sistema. Comece criando um novo item.
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-bold animate-bounce">
              <ArrowUpRight size={20} />
              <span>Clique em "Nova Def. de Produto"</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 z-50 flex items-center justify-center backdrop-blur-md p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-2xl font-black text-blue-950">{editingId ? 'Editar' : 'Nova'} Definição</h3>
            
            <div className="space-y-4">
              <input 
                className="w-full bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="Nome do Produto" 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                required 
              />
              <input 
                className="w-full bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="Número de Série / SKU" 
                value={newSku} 
                onChange={e => setNewSku(e.target.value)} 
                required 
              />
              <div className="flex gap-4">
                <input 
                  type="number" 
                  className="w-full bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="Custo (R$)" 
                  value={newCost} 
                  onChange={e => setNewCost(e.target.value === '' ? '' : Number(e.target.value))} 
                />
                <input 
                  type="number" 
                  step="0.1"
                  className="w-full bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  placeholder="Deprec. %" 
                  value={newDepRate} 
                  onChange={e => setNewDepRate(e.target.value === '' ? '' : Number(e.target.value))} 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}