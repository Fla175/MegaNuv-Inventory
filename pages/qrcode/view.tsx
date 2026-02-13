// pages/qrcode/view.tsx
/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  Layers,
  Loader2,
  AlertCircle,
  PackageOpen,
  CornerDownRight,
  DollarSign,
  X,
  FileText,
  Info,
  PackageX,
  Hash
} from "lucide-react";

interface AssetItem {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  sku?: string;
  serialNumber?: string;
  image?: string;
  tag: string
  color?: string;
  datasheetUrl?: string;
}

interface Section {
  id: string;
  name: string;
  fixedValue?: number;
  items: AssetItem[];
}

export default function SpacePublicView() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<{
    root: {
      imageUrl: string;
      name: string;
      id: string;
      fixedValue?: number;
    };
    sections: Section[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o Modal de Detalhes
  const [selectedItem, setSelectedItem] = useState<AssetItem | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/qrcode/public-get?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Local não encontrado");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err instanceof Error ? err.message : "Erro desconhecido"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={32} />
        <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">
          Carregando Inventário...
        </p>
      </div>
    );

  if (error || !data)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-zinc-950">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h1 className="text-xl font-black text-gray-800 dark:text-gray-200">
          Local Inválido
        </h1>
        <p className="text-xs text-gray-500 mt-2">
          O QR Code escaneado não corresponde a um local ativo.
        </p>
      </div>
    );

  const totalAssets = data.sections.reduce((acc, sec) => acc + sec.items.length, 0);
  const totalValue = (data.root.fixedValue || 0) + 
    data.sections.reduce((acc, sec) => acc + (sec.fixedValue || 0), 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <>
      <Head>
        <title>{data?.root?.name || "Carregando..."}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 pb-12 font-sans transition-colors">
        
        {/* CABEÇALHO */}
        <div className="bg-indigo-700 dark:bg-indigo-900 pb-12 pt-12 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
          {data.root.imageUrl && (
            <div className="absolute top-0 right-0 w-3/4 h-full pointer-events-none">
              <div className="absolute inset-0 z-10 bg-gradient-to-r from-indigo-700 via-indigo-700/40 to-transparent dark:from-indigo-900 dark:via-indigo-900/40" />
              <img src={data.root.imageUrl} alt="" className="w-full h-full object-cover opacity-90" />
            </div>
          )}

          <div className="relative z-20">
            <h1 className="text-4xl font-black text-white leading-none mb-2 drop-shadow-md tracking-tighter">
              {data.root.name}
            </h1>
            <div className="flex flex-col gap-1">
                <p className="text-indigo-100/80 text-xs font-bold uppercase tracking-widest">
                  {totalAssets === 1 ? `${totalAssets} ativo listado` : totalAssets >= 2 ? `${totalAssets} ativos listados` : ""}
                </p>
                {totalValue > 0 && (
                    <div className="inline-flex items-center gap-2 mt-2 self-start bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                        <DollarSign size={14} className="text-green-300"/>
                        <span className="text-sm font-black text-white">{formatCurrency(totalValue)}</span>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* LISTAGEM OU EMPTY STATE */}
        <div className="max-w-xl mx-auto px-4 -mt-6 space-y-6 relative z-30">
          {totalAssets > 0 ? (
            data.sections.map((section, index) => (
              section.items.length > 0 && (
                <div key={section.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                  {section.id !== data.root.id && (
                    <div className="flex items-center justify-between mb-3 ml-2 mt-6">
                      <div className="flex items-center gap-2">
                          <CornerDownRight size={16} className="text-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest bg-gray-200 dark:bg-zinc-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                            {section.name}
                          </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border border-gray-200/50 dark:border-white/5 overflow-hidden">
                    {section.items.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left p-4 flex gap-4 active:bg-gray-50 dark:active:bg-zinc-800 transition-colors ${
                          idx !== section.items.length - 1 ? "border-b border-gray-100 dark:border-white/5" : ""
                        }`}
                      >
                        <div className="h-14 w-14 rounded-xl bg-gray-50 dark:bg-zinc-950 shrink-0 border border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Layers size={20} className="text-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-black text-gray-800 dark:text-gray-200 text-sm truncate pr-2">
                              {item.name}
                            </h3>
                            <Info size={14} className="text-gray-300 shrink-0" />
                          </div>
                          <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {item.manufacturer || "Fabricante desconhecido"} {item.model != null ? `• ${item.model}` : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-400">
                               {item.sku || 'Sem SKU'}
                             </span>
                            {item.serialNumber && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border dark:border-gray-400/45">
                                <Hash size={8} className="rotate-12" />
                                <span className="text-[8px] font-bold uppercase tracking-tight">
                                  {item.serialNumber || ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-gray-200/50 dark:border-white/5">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full" />
                <PackageX size={80} className="text-indigo-200 dark:text-zinc-800 relative z-10" />
              </div>
              
              <h2 className="text-lg font-black text-gray-800 dark:text-gray-200 tracking-tighter italic uppercase">
                Local Vazio
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 max-w-[220px] font-medium leading-relaxed">
                Nenhum ativo ou equipamento foi registrado neste local até o momento.
              </p>
              
              <div className="mt-8 flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400/50" />
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400/20" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
            {/* Botão Fechar */}
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Imagem de Destaque no Modal */}
            <div className="h-64 bg-gray-100 dark:bg-zinc-800 relative">
              {selectedItem.image ? (
                <img src={selectedItem.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <PackageOpen size={64} />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
            </div>

            <div className="px-8 pb-10 -mt-8 relative z-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {selectedItem.manufacturer != null ? selectedItem.manufacturer : "Fabricante desconhecido"} {selectedItem.model != null ? `• ${selectedItem.model}` : ""}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {selectedItem.name}
                  </h2>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                  selectedItem.tag === "IN-STOCK" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                }`}>
                  {selectedItem.tag === "IN-STOCK" ? "Estoque" : "Em Uso"}
                </span>
              </div>

              {/* Grid de Especificações */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="space-y-1 border-r border-r-gray-300">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Código SKU</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedItem.sku || 'Não informado'}</p>
                </div>

                <div className="space-y-1 border-r border-r-gray-300">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Cor</p>
                  <div className="flex items-center gap-2">
                    {selectedItem.color ? (
                      <><span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{selectedItem.color}</span></>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 italic">Não definida</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 group">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Número de Série</p>
                  <div className="flex">
                    <Hash size={13} className="group-hover:rotate-12 transition-all" />
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedItem.serialNumber || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {/* Botão Datasheet */}
              {selectedItem.datasheetUrl && (
                <a 
                  href={selectedItem.datasheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                >
                  <FileText size={18} className="rotate-12" />
                  VISUALIZAR DATASHEET PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}