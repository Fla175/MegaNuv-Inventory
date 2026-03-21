// pages/dashboard.tsx
import Layout from "../components/Layout";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Package, DollarSign, Activity, Loader2,
  Layers, Box, AlertCircle, TrendingUp, PackageOpen, Clock, 
  ArrowDownAZ, ArrowLeftRight, ChevronLeft, ChevronRight, X, Zap, Cpu, Server, Settings2, Inbox
} from "lucide-react";
import { useUser } from "@/lib/context/UserContext";

// Interface do componente interno de Empty State para reutilização
const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-300">
    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full text-gray-300 dark:text-gray-700 mb-4">
      <Inbox size={32} strokeWidth={1.5} />
    </div>
    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
      {message}
    </p>
  </div>
);

interface ActiveItem {
  id: string;
  name: string;
  tag: string;
  quantity?: number;
  area?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface DashboardStats {
  totalValue: number;
  totalActives: number;
  totalActivesQuantity: number;
  totalSpaces: number;
  fatherSpaces: number;
  PhysicalSpaces: number;
  recentActives: ActiveItem[];
  recentMovements?: ActiveItem[];
  assetsByArea: Record<string, ActiveItem[]>;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [creationPage, setCreationPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Falha na API");
        const data = await res.json();
        setStats({
          ...data,
          recentMovements: data.recentMovements || data.recentActives.slice().reverse() 
        });
      } catch (err) {
        console.error("Erro:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const areaConfig: Record<string, { icon: any, color: string, bg: string }> = {
    ENERGETICA: { icon: <Zap size={20}/>, color: "text-amber-500", bg: "bg-amber-500/10" },
    REDES: { icon: <Cpu size={20}/>, color: "text-blue-500", bg: "bg-blue-500/10" },
    SERVIDOR: { icon: <Server size={20}/>, color: "text-purple-500", bg: "bg-purple-500/10" },
    MANUTENCAO: { icon: <Settings2 size={20}/>, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  };
  
  const sortedCreations = useMemo(() => {
    const list = stats?.recentActives || [];
    if (!list.length) return [];
    const copy = [...list];
    if (user?.defaultSort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [stats?.recentActives, user?.defaultSort]);

  const sortedMovements = useMemo(() => {
    const list = stats?.recentMovements || [];
    if (!list.length) return [];
    const copy = [...list];
    if (user?.defaultSort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [stats?.recentMovements, user?.defaultSort]);

  const paginatedCreations = sortedCreations.slice((creationPage - 1) * itemsPerPage, creationPage * itemsPerPage);
  const paginatedMovements = sortedMovements.slice((movementPage - 1) * itemsPerPage, movementPage * itemsPerPage);
  const totalCreationPages = Math.ceil(sortedCreations.length / itemsPerPage);
  const totalMovementPages = Math.ceil(sortedMovements.length / itemsPerPage);

  if (loading) return (
    <Layout>
      <div className="flex h-[80vh] flex-col items-center justify-center text-blue-950 dark:text-blue-400 font-black animate-pulse">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <span className="tracking-[0.3em] text-xs uppercase">Sincronizando...</span>
      </div>
    </Layout>
  );

  if (error || !stats) return (
    <Layout>
      <div className="flex flex-col h-[80vh] items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-blue-950 dark:text-white italic uppercase">Sistemas Offline</h2>
        <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Reiniciar Conexão</button>
      </div>
    </Layout>
  );

  const percentSub = stats.totalSpaces > 0 ? (stats.PhysicalSpaces / stats.totalSpaces) * 100 : 0;

  return (
    <Layout title="Dashboard">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-10 transition-colors">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="bg-blue-600 p-4 rounded-xl md:rounded-2xl text-white shadow-lg"><LineChart size={28} /></div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-blue-950 dark:text-white italic leading-none">Dashboard</h1>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Visão Geral do Patrimônio</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-950 rounded-full border border-gray-100 dark:border-white/10">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ordenação:</span>
            <span className={`text-[10px] font-bold ${user?.defaultSort === "newest" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"} flex items-center gap-1`}>
              {user?.defaultSort === 'newest' ? <><Clock size={12}/> Recentes</> : <><ArrowDownAZ size={12}/> A-Z</>}
            </span>
          </div>
        </div>

        {/* CARDS KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-teal-500/10 group-hover:scale-125 transition-transform duration-500"><TrendingUp size={80} /></div>
            <div className="relative z-10">
                <div className="p-3 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl w-fit mb-6"><DollarSign size={24} /></div>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Patrimônio</p>
                <h2 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
                </h2>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:scale-125 transition-transform duration-500"><PackageOpen size={80} /></div>
            <div className="relative z-10">
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl w-fit mb-6"><Package size={24} /></div>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total de Ativos</p>
              {
                stats.totalActives >= 1 ?
                <h2 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">{ stats.totalActives } <span className="text-sm opacity-50 italic font-medium">{ stats.totalActives === 1 ? "unidade" : "unidades" }</span></h2>
                :
                <h2 className="text-lg font-black text-blue-950 dark:text-white tracking-tighter">Nenhum ativo registrado</h2>
              }
            </div>
          </div>
        </div>

        {/* ÁREAS DE FOCO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(areaConfig).map((area) => (
            <button 
              key={area} 
              onClick={() => setSelectedArea(area)}
              className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm hover:border-blue-500/30 transition-all flex flex-col items-center group"
            >
              <div className={`p-3 rounded-xl mb-3 ${areaConfig[area].bg} ${areaConfig[area].color} group-hover:scale-110 transition-transform`}>
                {areaConfig[area].icon}
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{area === "ENERGETICA" ? "Energética" : area === "MANUTENCAO" ? "MANUTENÇÃO" : area}</span>
              <span className="text-xl font-black text-blue-950 dark:text-white">
                {stats.assetsByArea[area]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* SEÇÕES DE LISTAGEM E ESTRUTURA */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* CRIAÇÕES COM EMPTY STATE */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col h-full">
            <h3 className="text-lg font-black text-blue-950 dark:text-white flex items-center gap-3 italic mb-6"><Activity className="text-blue-600" size={20}/> Novas Criações</h3>
            <div className="space-y-3 flex-1">
              {paginatedCreations.length > 0 ? (
                paginatedCreations.map((ativo, idx) => (
                  <div key={`${ativo.id}-c-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-blue-500 shadow-sm"><Box size={16}/></div>
                      <div className="truncate"><h4 className="font-black text-blue-950 dark:text-gray-200 text-xs uppercase truncate">{ativo.name}</h4></div>
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded-lg">{ativo.tag === "IN-USE" ? "Em Uso" : "Em Estoque"}</span>
                  </div>
                ))
              ) : (
                <EmptyState message="Nenhum ativo criado recentemente" />
              )}
            </div>
            {totalCreationPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <button onClick={() => setCreationPage(p => Math.max(1, p - 1))} disabled={creationPage === 1} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronLeft size={16}/></button>
                <span className="text-[10px] font-black text-gray-400 uppercase">Pág {creationPage}</span>
                <button onClick={() => setCreationPage(p => Math.min(totalCreationPages, p + 1))} disabled={creationPage === totalCreationPages} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronRight size={16}/></button>
              </div>
            )}
          </div>

          {/* MOVIMENTAÇÕES COM EMPTY STATE */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col h-full">
            <h3 className="text-lg font-black text-blue-950 dark:text-white flex items-center gap-3 italic mb-6"><ArrowLeftRight className="text-amber-500" size={20}/> Movimentações</h3>
            <div className="space-y-3 flex-1">
              {paginatedMovements.length > 0 ? (
                paginatedMovements.map((ativo, idx) => (
                  <div key={`${ativo.id}-m-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-amber-500/20 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-amber-500 shadow-sm"><Box size={16}/></div>
                      <div className="truncate"><h4 className="font-black text-blue-950 dark:text-gray-200 text-xs uppercase truncate">{ativo.name}</h4></div>
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded-lg">{ativo.tag === "IN-USE" ? "Em Uso" : "Em Estoque"}</span>
                  </div>
                ))
              ) : (
                <EmptyState message="Sem movimentações registradas" />
              )}
            </div>
            {totalMovementPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <button onClick={() => setMovementPage(p => Math.max(1, p - 1))} disabled={movementPage === 1} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronLeft size={16}/></button>
                <span className="text-[10px] font-black text-gray-400 uppercase">Pág {movementPage}</span>
                <button onClick={() => setMovementPage(p => Math.min(totalMovementPages, p + 1))} disabled={movementPage === totalMovementPages} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronRight size={16}/></button>
              </div>
            )}
          </div>

          {/* ESTRUTURA */}
          <div className="bg-blue-950 dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col border dark:border-white/5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30"><Layers size={20} className="text-blue-400" /></div>
                <h3 className="text-xl font-black italic">Estrutura</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-400 uppercase">Espaços Pai</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-blue-600">{stats.fatherSpaces}</span>
                </div>
                <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase">Espaços Físicos</span>
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-blue-600">{stats.PhysicalSpaces}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10">
              <div className="flex justify-between items-end mb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase">Volume Total</p>
                {
                  stats.totalSpaces >= 1 ?
                  <h2 className="text-3xl font-black text-white tracking-tight">{stats.totalSpaces} <span className="text-xs opacity-50 italic">{stats.totalSpaces === 1 ? "espaço" : "espaços"}</span></h2>
                  :
                  <span className="text-xs opacity-50 italic">Nenhum espaço criado.</span>
                }
              </div>
              <div className={`h-2 w-full ${stats.totalSpaces > 0 ? "bg-blue-500" : "bg-blue-900/50"} rounded-full overflow-hidden`}>
                <div className="h-full bg-indigo-500 rounded-r-full" style={{ width: `${percentSub}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POP-UP / MODAL DE ATIVOS POR ÁREA */}
      {selectedArea && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] border dark:border-white/10">
            <div className="p-8 border-b dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${areaConfig[selectedArea].bg} ${areaConfig[selectedArea].color}`}>
                  {areaConfig[selectedArea].icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic">{selectedArea === "ENERGETICA" ? "ENERGÉTICA" : selectedArea === "MANUTENCAO" ? "MANUTENÇÃO" : selectedArea}</h3>
                  {
                    selectedArea?.length >= 1 ?
                    <p className="text-[10px] font-black text-gray-400 uppercase">Total: {stats.assetsByArea[selectedArea]?.length} {stats.assetsByArea[selectedArea]?.length === 1 ? "Ativo" : "Ativos"}</p>
                    :
                    <p className="text-[10px] font-black text-gray-400 uppercase">Nenhum ativo desta área</p>
                  }
                </div>
              </div>
              <button onClick={() => setSelectedArea(null)} className="p-4 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-3">
              {stats.assetsByArea[selectedArea]?.length > 0 ? (
                stats.assetsByArea[selectedArea].map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-blue-600"><Box size={18}/></div>
                      <div>
                        <h4 className="font-black text-blue-950 dark:text-gray-200 text-sm uppercase">{asset.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Tag: {asset.tag === "IN-USE" ? "Em Uso" : "Em Estoque"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full italic">
                        Qtd: {asset.quantity || 1}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="Nenhum ativo registrado nesta área" />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}