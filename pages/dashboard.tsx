// pages/dashboard.tsx
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import Head from "next/head";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  DollarSign,
  Activity,
  Loader2,
  Layers,
  Box,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/router";

interface DashboardStats {
  totalValue: number;
  totalAtivos: number;
  totalEspacos: number;
  espacosPai: number;
  subEspacos: number;
  recentAtivos: {
    id: string;
    name: string;
    tag: string;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
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
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex h-screen flex-col items-center justify-center text-blue-950 font-black animate-pulse">
        <div className="relative mb-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <div className="absolute inset-0 blur-xl bg-blue-400/20 animate-pulse"></div>
        </div>
        <span className="tracking-[0.3em] text-xs uppercase">Sincronizando Inteligência...</span>
      </div>
    </Layout>
  );

  if (error || !stats) return (
    <Layout>
      <div className="flex flex-col h-[80vh] items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-6 rounded-[2.5rem] mb-6">
            <AlertCircle size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-blue-950 italic">Sistemas Offline</h2>
        <p className="text-gray-500 font-bold text-sm mt-2 max-w-xs uppercase tracking-tight">
          Não conseguimos estabelecer conexão com o banco de dados de inventário.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-blue-200 active:scale-95 transition-all"
        >
          Reiniciar Conexão
        </button>
      </div>
    </Layout>
  );

  const percentSub = stats.totalEspacos > 0 
    ? (stats.subEspacos / stats.totalEspacos) * 100 
    : 0;

  return (
    <Layout title="Dashboard Geral">
      <Head><title>Dashboard | Meganuv</title></Head>

      <div className="max-w-7xl mx-auto py-6 md:py-10 px-4 space-y-8">
        
        {/* HEADER DINÂMICO */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="bg-blue-600 p-4 rounded-[1.5rem] md:rounded-[2rem] text-white shadow-2xl shadow-blue-200">
              <LayoutDashboard size={28} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-black text-blue-950 italic leading-none">Visão Geral</h1>
              <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1 truncate">Status do Patrimônio Real</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
             <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Sistemas Operacionais</span>
          </div>
        </div>

        {/* CARDS PRINCIPAIS (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* VALOR TOTAL */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-teal-500/10 group-hover:scale-125 transition-transform duration-500">
                <TrendingUp size={80} />
            </div>
            <div className="relative z-10">
                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl w-fit mb-6">
                    <DollarSign size={24} />
                </div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Patrimônio Estimado</p>
                <h2 className="text-3xl font-black text-blue-950 tracking-tighter">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
                </h2>
            </div>
          </div>

          {/* TOTAL ATIVOS */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Package size={24} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Ativos em Inventário</p>
            <h2 className="text-3xl font-black text-blue-950 tracking-tighter">
              {stats.totalAtivos} <span className="text-sm text-gray-400 font-bold italic tracking-normal">unidades</span>
            </h2>
          </div>

          {/* TOTAL ESPAÇOS */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm sm:col-span-2 lg:col-span-1 group">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Warehouse size={24} />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Espaços Físicos</p>
            <h2 className="text-3xl font-black text-blue-950 tracking-tighter">
                {stats.totalEspacos} <span className="text-sm text-gray-400 font-bold italic tracking-normal">espaços</span>
            </h2>
          </div>
        </div>

        {/* SEÇÃO ANALÍTICA */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* ÚLTIMOS MOVIMENTOS (3/5 da tela) */}
          <div className="lg:col-span-3 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-blue-950 flex items-center gap-3 italic">
                <Activity className="text-blue-600" size={24}/> Atividade Recente
                </h3>
                <button onClick={() => router.push('/actives')} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Ver Todos</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {stats.recentAtivos.length > 0 ? stats.recentAtivos.map((ativo) => (
                <div key={ativo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white border border-transparent hover:border-blue-100 transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                      <Box size={18}/>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-blue-950 text-sm truncate uppercase tracking-tight">{ativo.name}</h4>
                    </div>
                  </div>
                  <span className="text-[9px] font-black px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-lg group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shrink-0">
                    {ativo.tag}
                  </span>
                </div>
              )) : (
                <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                  <p className="text-gray-300 font-black uppercase text-[10px] tracking-[0.2em]">Sem movimentações</p>
                </div>
              )}
            </div>
          </div>

          {/* ANÁLISE DE HIERARQUIA (2/5 da tela) */}
          <div className="lg:col-span-2 bg-blue-950 p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
                  <Layers size={28} className="text-blue-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-black italic leading-none">Estrutura</h3>
                    <p className="text-blue-400/60 text-[9px] font-black uppercase tracking-widest mt-1">Níveis de Profundidade</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div>
                      <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">Espaços Pai</span>
                    </div>
                    <span className="text-4xl font-black tracking-tighter">{stats.espacosPai}</span>
                </div>

                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div>
                      <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em]">Subespaços</span>
                    </div>
                    <span className="text-4xl font-black tracking-tighter text-blue-400">{stats.subEspacos}</span>
                </div>
              </div>
            </div>

            {/* PROGRESSO VISUAL */}
            <div className="mt-12 relative z-10">
              <div className="flex justify-between items-end mb-3">
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Densidade de Subespaços</p>
                 <span className="text-[10px] font-black text-white/40">{Math.round(percentSub)}% do total</span>
              </div>
              <div className="h-2.5 w-full bg-blue-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-[2000ms] shadow-[0_0_20px_rgba(96,165,250,0.4)]" 
                  style={{ width: `${percentSub}%` }}
                />
              </div>
              <button 
                onClick={() => router.push('/')}
                className="mt-8 w-full py-4 bg-white/10 hover:bg-white hover:text-blue-950 transition-all rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/10"
              >
                Gerenciar Estrutura <ArrowRight size={14}/>
              </button>
            </div>

            {/* DECORAÇÃO TECH */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
          </div>

        </div>
      </div>
    </Layout>
  );
}