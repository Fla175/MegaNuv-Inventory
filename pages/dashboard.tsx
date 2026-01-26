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
  ChevronRight
} from "lucide-react";

interface DashboardStats {
  totalValue: number;
  totalAtivos: number;
  totalEspacos: number;
  espacosPai: number;
  subEspacos: number;
  recentAtivos: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex h-screen items-center justify-center text-blue-950 font-black animate-pulse">
        <Loader2 className="animate-spin mr-3" size={32} /> ATUALIZANDO DASHBOARD...
      </div>
    </Layout>
  );

  return (
    <Layout title="Dashboard">
      <Head><title>Dashboard</title></Head>

      <div className="max-w-6xl mx-auto py-6 md:py-10 px-4">
        
        {/* Header */}
        <div className="flex items-center gap-6 mb-10 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100">
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-blue-950 italic">Dashboard</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Controle Patrimonial Meganuv</p>
          </div>
        </div>

        {/* Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="p-4 bg-teal-50 text-teal-600 rounded-[1.5rem] w-fit mb-4"><DollarSign size={28} /></div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Valor Total</p>
            <h2 className="text-3xl font-black text-blue-950 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalValue || 0)}
            </h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] w-fit mb-4"><Package size={28} /></div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Ativos</p>
            <h2 className="text-3xl font-black text-blue-950 tracking-tight">{stats?.totalAtivos} <span className="text-sm text-gray-400 font-bold italic">unidades</span></h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] w-fit mb-4"><Warehouse size={28} /></div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Espaços Físicos</p>
            <h2 className="text-3xl font-black text-blue-950 tracking-tight">{stats?.totalEspacos}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Últimas Movimentações (Ativos) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-blue-950 flex items-center gap-3 mb-8 italic">
              <Activity className="text-blue-600" size={24}/> Últimos Ativos
            </h3>
            <div className="space-y-4">
              {stats?.recentAtivos.map((ativo: any) => (
                <div key={ativo.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><Box size={20}/></div>
                    <div>
                      <h4 className="font-black text-blue-950 text-sm leading-none mb-1">{ativo.name}</h4>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-black px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md uppercase">{ativo.tag}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Análise de Espaço Real */}
          <div className="bg-blue-950 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <Layers size={40} className="text-blue-400" />
                <h3 className="text-2xl font-black italic">Análise de Espaço</h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Espaços Pai</span>
                    <span className="text-3xl font-black text-white">{stats?.espacosPai}</span>
                  </div>
                  <p className="text-xs text-blue-200/60 font-medium">Locais, móveis ou ativos que podem ter peças dentro (Ex: Rack)</p>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Subespaços</span>
                    <span className="text-3xl font-black text-white">{stats?.subEspacos}</span>
                  </div>
                  <p className="text-xs text-blue-200/60 font-medium">Divisões internas dentro dos espaços-pai (Prateleiras, Salas, Gavetas)</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10 relative z-10">
              <p className="text-[9px] font-black text-blue-400 uppercase mb-2">Distribuição de Inventário</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-blue-900 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-400" 
                    style={{ width: `${(stats!.espacosPai / stats!.totalEspacos) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-black">{stats?.totalEspacos} Total</span>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}