import Layout from "../components/Layout";
import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import {
  LineChart, Package, Warehouse, DollarSign, Activity, Loader2,
  Layers, Box, AlertCircle, TrendingUp, ArrowRight, Clock, ArrowDownAZ
} from "lucide-react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/context/UserContext";

interface DashboardStats {
  totalValue: number;
  totalAtivos: number;
  totalEspacos: number;
  espacosPai: number;
  subEspacos: number;
  recentAtivos: {
    imageUrl: string;
    id: string;
    name: string;
    tag: string;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Falha na API");
        const data = await res.json();
        setStats(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // ORDENAÇÃO DOS RECENTES RESPEITANDO O CONTEXTO
  const sortedRecent = useMemo(() => {
    if (!stats?.recentAtivos) return [];
    const list = [...stats.recentAtivos];
    if (user?.defaultSort === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list; // Padrão 'newest' já vem do backend ou é cronológico
  }, [stats, user?.defaultSort]);

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

  const percentSub = stats.totalEspacos > 0 ? (stats.subEspacos / stats.totalEspacos) * 100 : 0;

  return (
    <Layout title="Dashboard Geral">
      <Head><title>Dashboard | Inventory</title></Head>

      <div className="max-w-7xl mx-auto space-y-8 pb-10 transition-colors">
        
        {/* HEADER */}
        <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="bg-blue-600 p-4 rounded-xl md:rounded-2xl text-white shadow-lg"><LineChart size={28} /></div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-blue-950 dark:text-white italic leading-none">Dashboard</h1>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Status do Patrimônio</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-950 rounded-full border border-gray-100 dark:border-white/10">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Modo:</span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              {user?.defaultSort === 'newest' ? <><Clock size={12}/> Recentes</> : <><ArrowDownAZ size={12}/> Nome</>}
            </span>
          </div>
        </div>

        {/* CARDS KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Valor Total */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 p-8 text-teal-500/10 group-hover:scale-125 transition-transform duration-500"><TrendingUp size={80} /></div>
            <div className="relative z-10">
                <div className="p-3 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl w-fit mb-6"><DollarSign size={24} /></div>
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Patrimônio</p>
                <h2 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
                </h2>
            </div>
          </div>

          {/* Total Ativos */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm transition-colors">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl w-fit mb-6"><Package size={24} /></div>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Ativos</p>
            <h2 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">{stats.totalAtivos} <span className="text-sm opacity-50 italic">unidades</span></h2>
          </div>

          {/* Espaços */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm sm:col-span-2 lg:col-span-1 transition-colors">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-6"><Warehouse size={24} /></div>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Espaços</p>
            <h2 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">{stats.totalEspacos} <span className="text-sm opacity-50 italic">locais</span></h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LISTA RECENTES */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 transition-colors">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-blue-950 dark:text-white flex items-center gap-3 italic"><Activity className="text-blue-600" size={24}/> Atividade</h3>
                <button onClick={() => router.push('/actives')} className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase hover:underline">Ver Todos</button>
            </div>
            <div className="space-y-3">
              {sortedRecent.length > 0 ? sortedRecent.map((ativo) => (
                <div key={ativo.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-blue-500 shadow-sm group-hover:scale-110 transition-transform"><Box size={18}/></div>
                    <h4 className="font-black text-blue-950 dark:text-gray-200 text-sm uppercase truncate">{ativo.name}</h4>
                  </div>
                  <span className="text-[9px] font-black px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 rounded-lg shrink-0">{ativo.tag}</span>
                </div>
              )) : <div className="text-center py-10 opacity-30 font-black uppercase text-xs">Sem movimentações</div>}
            </div>
          </div>

          {/* CARD ESTRUTURA (PREMIUM DARK) */}
          <div className="lg:col-span-2 bg-blue-950 dark:bg-zinc-900 p-8 md:p-10 rounded-[2.5rem] shadow-xl text-white flex flex-col transition-all border dark:border-white/5">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30"><Layers size={28} className="text-blue-400" /></div>
                <h3 className="text-2xl font-black italic">Estrutura</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Espaços Pai</span>
                    <span className="text-4xl font-black">{stats.espacosPai}</span>
                </div>
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Subespaços</span>
                    <span className="text-4xl font-black text-blue-400">{stats.subEspacos}</span>
                </div>
              </div>
            </div>
            <div className="mt-12">
              <div className="h-2.5 w-full bg-blue-900/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)] transition-all duration-1000" style={{ width: `${percentSub}%` }} />
              </div>
              <button onClick={() => router.push('/')} className="mt-8 w-full py-4 bg-white/10 hover:bg-white hover:text-blue-950 transition-all rounded-2xl font-black text-[10px] uppercase border border-white/10 flex items-center justify-center gap-2">
                Gerenciar Estrutura <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}