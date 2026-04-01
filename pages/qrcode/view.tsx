// pages/qrcode/view.tsx
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Layers, Loader2, AlertCircle, PackageOpen, CornerDownRight,
  DollarSign, X, FileText, Info, PackageX, Hash, 
  Boxes, Tag, ExternalLink, User, Calendar
} from "lucide-react";

interface AssetItem {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  sku?: string;
  serialNumber?: string;
  image?: string;
  tag: string;
  fileUrl?: string;
  category?: string;
  createdBy?: any;
  createdAt?: string;
  isPhysicalSpace?: boolean | number;
}

interface Section {
  id: string;
  name: string;
  fixedValue?: number;
  items: AssetItem[];
}

interface ViewData {
  root: {
    id: string;
    name: string;
    category?: string;
    imageUrl?: string;
    image?: string;
    fixedValue?: number;
    isPhysicalSpace?: boolean | number;
    sku?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    tag?: string;
    fileUrl?: string;
    createdBy?: any;
    createdAt?: string;
  };
  sections: Section[];
}

export default function SpacePublicView() {
  const router = useRouter();
  const { id } = router.query;
  
  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AssetItem | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/qrcode/public-get?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Registro não encontrado");
        return res.json();
      })
      .then((json: ViewData) => {
        console.log("DADOS RECEBIDOS:", json); // LOG PARA DEBUG
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro de conexão"))
      .finally(() => setLoading(false));
  }, [id]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getCreatorName = (creator: any): string => {
    if (!creator) return 'Sistema';
    if (typeof creator === 'string') return creator;
    if (typeof creator === 'object' && creator.name) return creator.name;
    return 'Sistema';
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Sincronizando Dados...</p>
    </div>
  );

  if (error || !data) return (
    <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h1 className="text-xl font-black text-zinc-800 dark:text-zinc-200 uppercase italic tracking-tighter">Erro de Acesso</h1>
      <p className="text-xs text-zinc-500 mt-2 font-medium">{error}</p>
    </div>
  );

  const active = data.root;

  /**
   * LÓGICA DE DETECÇÃO REFORÇADA
   * 1. Se existir um array de 'sections' com conteúdo, é um espaço.
   * 2. Se isPhysicalSpace for true OU 1, é um espaço.
   * 3. Caso contrário, é um ativo individual.
   */
  const hasSubItems = data.sections && data.sections.length > 0 && data.sections.some(s => s.items.length > 0);
  const isPhysicalSpace = active.isPhysicalSpace === true || active.isPhysicalSpace === 1 || hasSubItems;

  // ==========================================
  // MODO 1: VISUALIZAÇÃO DE ATIVO (INDIVIDUAL)
  // ==========================================
  if (!isPhysicalSpace) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans pb-16">
        <Head>
          <title>{active.name} | Especificações</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </Head>

        <div className="h-80 bg-zinc-100 dark:bg-zinc-900 relative rounded-b-[3rem] overflow-hidden shadow-2xl">
          {active.imageUrl || active.image ? (
            <img src={active.imageUrl || active.image} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <PackageOpen size={80} strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent opacity-90" />
        </div>

        <div className="px-6 -mt-16 relative z-10 max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={12} className="text-indigo-500" />
            <span className={`text-[10px] font-black px-2 py-0.5 rounded bg-white/50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 uppercase backdrop-blur-md ${
              active.tag === "IN-STOCK" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}>
              {active.tag === "IN-STOCK" ? "Em Estoque" : "Em Operação"}
            </span>
          </div>

          <h1 className="text-4xl font-black text-zinc-900 dark:text-white leading-none uppercase italic tracking-tighter mb-2">
            {active.name}
          </h1>
          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-8 uppercase tracking-widest">
            {active.manufacturer || "Genérico"} {active.model && `• ${active.model}`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-sm">
              <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 flex items-center gap-1.5 italic">
                <Hash size={12}/> Identificador SKU
              </p>
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{active.sku || 'N/A'}</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-sm">
              <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 flex items-center gap-1.5 italic">
                <User size={12}/> Criado por
              </p>
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{getCreatorName(active.createdBy)}</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-sm col-span-2 flex justify-between items-center">
               <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 flex items-center gap-1.5 italic">
                    <Info size={12}/> Número de Série
                  </p>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">{active.serialNumber || 'N/A'}</p>
               </div>
               <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 flex items-center gap-1.5 italic justify-end">
                    <Calendar size={12}/> Cadastro
                  </p>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{formatDate(active.createdAt)}</p>
               </div>
            </div>
          </div>

          {active.fileUrl && (
            <a href={active.fileUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase shadow-2xl"
            >
              <FileText size={20} /> Visualizar Documentação PDF
              <ExternalLink size={14} className="opacity-50" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MODO 2: VISUALIZAÇÃO DE ESPAÇO (LISTAGEM)
  // ==========================================
  const sections: Section[] = data.sections || [];
  const totalAssets = sections.reduce((acc, sec) => acc + (sec.items?.length || 0), 0);
  const totalValue = (active.fixedValue || 0) + sections.reduce((acc, sec) => acc + (sec.fixedValue || 0), 0);

  return (
    <>
      <Head>
        <title>{active.name} | Inventário</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 pb-16 font-sans">
        <div className="bg-indigo-700 dark:bg-indigo-900 pb-16 pt-12 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
          {active.imageUrl && (
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-30">
              <img src={active.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative z-20">
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/20 text-white uppercase tracking-widest mb-3 inline-block">
              {active.category || 'Infraestrutura'}
            </span>
            <h1 className="text-4xl font-black text-white leading-none mb-6 tracking-tighter uppercase italic">
              {active.name}
            </h1>
            <div className="flex flex-wrap gap-2">
                <div className="bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Boxes size={14} className="text-indigo-200"/>
                    <span className="text-xs font-black text-white">{totalAssets} Itens</span>
                </div>
                {totalValue > 0 && (
                    <div className="bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                        <DollarSign size={14} className="text-emerald-300"/>
                        <span className="text-xs font-black text-white">{formatCurrency(totalValue)}</span>
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-8 space-y-6 relative z-30">
          {totalAssets > 0 ? (
            sections.map((section, index) => (
              <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                {section.id !== active.id && (
                  <div className="flex items-center gap-2 mb-3 ml-2 mt-10">
                    <CornerDownRight size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-500 border border-zinc-200 dark:border-white/5">
                      {section.name}
                    </span>
                  </div>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl overflow-hidden">
                  {section.items.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full text-left p-5 flex gap-5 active:bg-zinc-50 dark:active:bg-zinc-800 ${
                        idx !== section.items.length - 1 ? "border-b border-zinc-100 dark:border-white/5" : ""
                      }`}
                    >
                      <div className="h-16 w-16 rounded-2xl bg-zinc-50 dark:bg-zinc-950 shrink-0 border border-zinc-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <Layers size={24} className="text-zinc-300 dark:text-zinc-700" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-zinc-800 dark:text-zinc-100 text-sm truncate uppercase tracking-tight">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase">
                          {item.manufacturer || "Genérico"} {item.model && `• ${item.model}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <PackageX size={64} className="text-zinc-200 dark:text-zinc-800 mb-4" />
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Espaço Vazio</h2>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES (SUB-ITENS) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl">
            <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 z-50 p-3 bg-black/20 text-white rounded-2xl backdrop-blur-xl">
              <X size={20} />
            </button>
            <div className="h-72 bg-zinc-100 dark:bg-zinc-800 relative">
              {selectedItem.image ? (
                <img src={selectedItem.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300"><PackageOpen size={80} strokeWidth={1} /></div>
              )}
            </div>
            <div className="px-10 pb-12 -mt-10 relative z-10 bg-white dark:bg-zinc-900 rounded-t-[3rem]">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white leading-none uppercase italic tracking-tighter mb-6 pt-8">
                {selectedItem.name}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-white/5">
                  <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 flex items-center gap-1.5 italic"><Hash size={12}/> SKU</p>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{selectedItem.sku || 'N/A'}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-white/5">
                  <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 flex items-center gap-1.5 italic"><User size={12}/> Criador</p>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{getCreatorName(selectedItem.createdBy)}</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-white/5 col-span-2 flex justify-between">
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 italic">Número de Série</p>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{selectedItem.serialNumber || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-400 uppercase mb-1 italic">Data Registro</p>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{formatDate(selectedItem.createdAt)}</p>
                  </div>
                </div>
              </div>
              {selectedItem.fileUrl && (
                <a href={selectedItem.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase">
                  <FileText size={20} /> Ver PDF
                  <ExternalLink size={14} className="opacity-50" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}