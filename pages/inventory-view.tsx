// pages/inventory-view.tsx
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { Box, MapPin, Layers, ArrowLeft, Trash2, Calendar, TrendingDown, Plus, X, DollarSign } from 'lucide-react';

export default function InventoryView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  
  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form States para Novo Subespaço
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState('');
  const [newUsefulLife, setNewUsefulLife] = useState('');

  const fetchInventory = useCallback(async () => {
    const { location: id } = router.query;
    if (!router.isReady || !id) return;
    setLoading(true);
    try {
      // Chama a API corrigida que traz _count e children recursivos
      const res = await fetch(`/api/item-instances/list?id=${id}&fetchChildren=true&includeItems=true`);
      const data = await res.json();
      setCurrentLocation(data.itemInstances ? data.itemInstances[0] : null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [router.query.location, router.isReady]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const calculateDepreciation = (cost: number | null, date: string | null, months: number | null) => {
    if (!cost || !date || !months) return cost ? Number(cost) : 0;
    const start = new Date(date);
    const now = new Date();
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diff <= 0) return Number(cost);
    if (diff >= months) return 0;
    return Number(cost) - (Number(cost) / months * diff);
  };

  const handleCreateSubspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await fetch('/api/item-instances/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          parentId: currentLocation.id,
          cost: newCost,
          purchaseDate: newPurchaseDate,
          usefulLifeMonths: newUsefulLife
        })
      });
      if (!res.ok) throw new Error('Erro ao criar');
      setIsCreateModalOpen(false);
      setNewName(''); setNewCost(''); setNewPurchaseDate(''); setNewUsefulLife('');
      fetchInventory();
    } catch (err) { alert('Erro ao criar subespaço.'); }
    finally { setProcessing(false); }
  };

  const handleDeleteSubspace = async (id: string, name: string) => {
    if (!confirm(`Deseja remover o espaço "${name}"?`)) return;
    try {
      const res = await fetch(`/api/item-instances/delete?id=${id}`, { method: 'DELETE' });
      if (res.status === 409) {
        const data = await res.json();
        if (confirm(`ATENÇÃO: O espaço contém itens.\n${data.message}\n\nDeseja FORÇAR a exclusão de TUDO?`)) {
             await fetch(`/api/item-instances/delete?id=${id}&force=true`, { method: 'DELETE' });
             fetchInventory();
        }
      } else if (!res.ok) throw new Error('Erro');
      else fetchInventory();
    } catch (err: any) { alert("Erro ao excluir."); }
  };

  if (loading) return <Layout><div className="p-20 text-center font-black animate-pulse text-blue-900">CARREGANDO...</div></Layout>;
  if (!currentLocation) return <Layout><div className="p-20 text-center">Local não encontrado.</div></Layout>;

  // Cálculos de Totais
  const itemsValue = currentLocation?.items?.reduce((acc: any, item: any) => 
    acc + calculateDepreciation(item.definition.cost, item.purchaseDate, item.usefulLifeMonths), 0) || 0;
  
  // Valor do próprio local (ex: Rack)
  const locationValue = calculateDepreciation(currentLocation.cost, currentLocation.purchaseDate, currentLocation.usefulLifeMonths);

  return (
    <Layout title={currentLocation?.name}>
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header com Valor Total (Itens + O Próprio Espaço) */}
        <div className="bg-white rounded-[2.5rem] p-8 mb-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <button onClick={() => router.push('/')} className="text-blue-600 font-bold flex items-center mb-2 text-sm"><ArrowLeft size={16} className="mr-1"/> Voltar ao Início</button>
            <h1 className="text-3xl font-black text-blue-950 flex items-center gap-3">
              <MapPin className="text-blue-600"/> {currentLocation?.name}
            </h1>
            {locationValue > 0 && (
              <span className="text-xs font-bold text-gray-400 mt-1 block">
                Valor Residual deste Espaço: R$ {locationValue.toFixed(2)}
              </span>
            )}
          </div>
          <div className="bg-blue-600 p-5 rounded-2xl text-center shadow-lg shadow-blue-100 min-w-[200px]">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Valor Total (Ativos + Espaço)</p>
            <p className="text-2xl font-black text-white">
              R$ {(itemsValue + locationValue).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subespaços */}
          <section>
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-black text-blue-900 flex items-center gap-2"><Layers size={20} className="text-indigo-500"/> Subespaços</h2>
               <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors">
                 <Plus size={16}/> Novo
               </button>
            </div>
            {currentLocation?.children?.map((sub: any) => (
              <div key={sub.id} className="group bg-white p-4 rounded-2xl border mb-3 flex justify-between items-center hover:shadow-md transition-all">
                <div onClick={() => router.push(`/inventory-view?location=${sub.id}`)} className="flex-1 cursor-pointer">
                    <p className="font-bold text-blue-950">{sub.name}</p>
                    <div className="flex gap-3 text-[10px] text-gray-400 font-bold uppercase mt-1">
                      <span>{sub._count?.items || 0} Itens</span>
                      {sub.cost && <span>• Valor Próprio</span>}
                    </div>
                </div>
                <button onClick={() => handleDeleteSubspace(sub.id, sub.name)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 size={18}/></button>
              </div>
            ))}
          </section>

          {/* Ativos */}
          <section>
            <h2 className="text-xl font-black text-blue-900 mb-4 flex items-center gap-2"><Box size={20} className="text-teal-500"/> Ativos no Local</h2>
            {currentLocation?.items?.map((item: any) => {
              const currentVal = calculateDepreciation(item.definition.cost, item.purchaseDate, item.usefulLifeMonths);
              return (
                <div key={item.id} className="bg-white p-5 rounded-2xl border mb-3 shadow-sm hover:border-teal-400 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-gray-800">{item.definition.name}</p>
                    <p className="text-lg font-black text-teal-600">R$ {currentVal.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold text-gray-400 uppercase">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(item.purchaseDate).toLocaleDateString()}</span>
                    <span className="bg-gray-50 px-2 py-1 rounded text-gray-500 font-mono">SN: {item.serialNumber}</span>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
           <form onSubmit={handleCreateSubspace} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-600"><X/></button>
              <h3 className="text-xl font-black text-blue-950 mb-1">Novo Subespaço</h3>
              <p className="text-xs text-gray-400 mb-6 uppercase font-bold">Em: {currentLocation.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Espaço</label>
                  <input className="w-full bg-gray-50 border rounded-xl p-3 font-bold" placeholder="Ex: Rack A1" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                
                <div className="pt-4 border-t border-dashed">
                  <p className="text-xs font-black text-blue-600 mb-3 flex items-center gap-1"><DollarSign size={14}/> Dados de Ativo (Opcional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" className="w-full bg-gray-50 border rounded-xl p-3 text-sm" placeholder="Custo (R$)" value={newCost} onChange={(e) => setNewCost(e.target.value)} />
                    <input type="number" className="w-full bg-gray-50 border rounded-xl p-3 text-sm" placeholder="Vida (Meses)" value={newUsefulLife} onChange={(e) => setNewUsefulLife(e.target.value)} />
                    <div className="col-span-2">
                       <input type="date" className="w-full bg-gray-50 border rounded-xl p-3 text-sm" value={newPurchaseDate} onChange={(e) => setNewPurchaseDate(e.target.value)} />
                       <p className="text-[9px] text-gray-400 mt-1 ml-1">Data de Aquisição do Espaço</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button type="submit" disabled={processing} className="w-full mt-6 py-4 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all">
                {processing ? 'Salvando...' : 'Criar Espaço'}
              </button>
           </form>
        </div>
      )}
    </Layout>
  );
}