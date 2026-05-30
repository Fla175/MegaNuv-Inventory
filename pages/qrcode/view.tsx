// pages/qrcode/view.tsx
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Layers, Loader2, AlertCircle, PackageOpen, CornerDownRight, 
  DollarSign, X, Info, PackageX, Hash, 
  Boxes, Tag, FileText, FileImage, File, ExternalLink, 
  User, Calendar, Box, ChevronDown
} from "lucide-react";

interface AssetActive {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  sku?: string;
  serialNumber?: string;
  image?: string;
  tag: string;
  fileUrl?: string;
  category: string;
  createdBy?: Date;
  createdAt?: string;
  isPhysicalSpace?: boolean | number;
  depth?: number;
}

interface Section {
  id: string;
  name: string;
  fixedValue?: number;
  actives: AssetActive[];
}

interface ViewData {
  root: {
    id: string;
    name: string;
    category: string;
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
    createdBy?: Date;
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
  const [selectedItem, setSelectedItem] = useState<AssetActive | null>(null);
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    fetch(`/api/qrcode/public-get?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Registro não encontrado");
        return res.json();
      })
      .then((json: ViewData) => {
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

  const parseFileUrls = (fileUrlString?: string | null): string[] => {
    if (!fileUrlString) return [];
    try {
      const parsed = JSON.parse(fileUrlString);
      if (Array.isArray(parsed)) return parsed.map((u: string) => u.trim()).filter(Boolean);
    } catch {
    }
    return fileUrlString
      .split(',')
      .map((url: string) => url.trim())
      .filter(Boolean);
  };

  const getFileDetails = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'pdf':
        return { icon: FileText, bgColor: 'bg-red-600 hover:bg-red-700' };
      case 'doc':
      case 'docx':
        return { icon: File, bgColor: 'bg-blue-600 hover:bg-blue-700' };
      case 'jpg':
      case 'jpeg':
      case 'png':
        return { icon: FileImage, bgColor: 'bg-emerald-600 hover:bg-emerald-700' };
      default:
        return { icon: File, bgColor: 'bg-indigo-600 hover:bg-indigo-700' };
    }
  };

  const getCreatorName = (creator: unknown): string => {
    if (!creator) return 'Sistema';
    if (typeof creator === 'string') return creator;
    
    if (typeof creator === 'object' && 'name' in creator) {
      const nameValue = (creator as { name: unknown }).name;
      if (nameValue) {
        return String(nameValue);
      }
    }
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
  const sections: Section[] = data.sections || [];

  const hasSubItems = sections.length > 0 && sections.some(s => s.actives.length > 0);
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
          {active.imageUrl ? (
            <Image src={active.imageUrl} fill className="w-full h-full object-cover" alt="" />
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

          {active.fileUrl && parseFileUrls(active.fileUrl).length > 0 && (
            <div className="space-y-3 w-full">
              <p className="text-[9px] font-black text-zinc-400 uppercase italic tracking-wider mb-1">
                Documentos & Anexos ({parseFileUrls(active.fileUrl).length})
              </p>
              {parseFileUrls(active.fileUrl).map((url: string, index: number) => {
                const { icon: Icon, bgColor } = getFileDetails(url);
                return (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-3 text-white py-4 rounded-[1.5rem] font-black text-xs uppercase shadow-lg transition-colors ${bgColor}`}
                  >
                    <Icon size={18} /> Documento #{index + 1}
                    <ExternalLink size={12} className="opacity-50" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // MODO 2: VISUALIZAÇÃO DE ESPAÇO (LISTAGEM)
  // ==========================================
  const totalAssets = sections.reduce((acc, sec) => acc + (sec.actives?.length || 0), 0);
  const totalValue = (active.fixedValue || 0) + sections.reduce((acc, sec) => acc + (sec.fixedValue || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getDirectChildren = (parentId: string) => {
    const sec = sections.find(s => s.id === parentId);
    return sec ? sec.actives || [] : [];
  };

  const renderChildren = (parentId: string, depth: number) => {
    const children = getDirectChildren(parentId);
    if (children.length === 0) return null;

    const indentClass = depth > 0 ? "ml-4 border-l-2 dark:border-white/5 pl-2" : "";

    return (
      <div className={`${indentClass} w-full flex flex-col`}>
        {children.map((item) => {
          const grandChildren = getDirectChildren(item.id);
          const hasGrandChildren = grandChildren.length > 0;
          const isExpanded = expandedSpaces[item.id];
          const isSpace = !!item.isPhysicalSpace;

          return (
            <div key={item.id} className="w-full flex flex-col">
              <div className="w-full flex items-center justify-between border-b dark:border-white/5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="flex-1 text-left p-5 flex items-center gap-4 group min-w-0"
                >
                  {depth > 0 && (
                    <div className="text-zinc-300 dark:text-zinc-700 flex items-center -ml-2 mr-1 shrink-0">
                      <CornerDownRight size={14} className="shrink-0" />
                    </div>
                  )}

                  <div className={`h-11 w-11 rounded-xl shrink-0 border flex items-center justify-center overflow-hidden ${
                    isSpace
                      ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-400"
                      : "bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-950 dark:border-white/5 dark:text-zinc-600"
                  }`}>
                    {isSpace ? <Layers size={20} /> : <Box size={20} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-zinc-800 dark:text-zinc-100 text-xs uppercase truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                        {item.category || "Geral"}
                      </span>
                      {isSpace && (
                        <span className="text-[8px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Espaço Físico
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    <span
                      className="text-[9px] font-mono font-black text-zinc-400 bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 px-2 py-1 rounded-lg"
                      style={depth > 0 && !hasGrandChildren ? { marginRight: `${depth * 0.75}rem` } : undefined}
                    >
                      #{item.tag}
                    </span>
                  </div>
                </button>

                {hasGrandChildren && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="shrink-0 p-3 mr-3 transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {hasGrandChildren && isExpanded && renderChildren(item.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>{active.name}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 pb-16 font-sans">
        <div className="bg-indigo-700 dark:bg-indigo-900 pb-16 pt-12 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
          {active.imageUrl && (
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-30">
              <Image src={active.imageUrl} fill alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative z-20">
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white/20 text-white uppercase tracking-widest mb-3 inline-block">
              {active.category}
            </span>
            <h1 className="text-4xl font-black text-white leading-none mb-6 tracking-tighter uppercase italic">
              {active.name}
            </h1>
            <div className="flex flex-wrap gap-2">
                <div className="bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Boxes size={14} className="text-indigo-200"/>
                    <span className="text-xs font-black text-white">{totalAssets} Itens vinculados</span>
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
          {getDirectChildren(active.id).length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl overflow-hidden animate-in fade-in duration-300">
              {renderChildren(active.id, 0)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <PackageX size={64} className="text-zinc-200 dark:text-zinc-800 mb-4" />
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Espaço Vazio</h2>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl">
            <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 z-50 p-3 bg-black/20 text-white rounded-2xl backdrop-blur-xl">
              <X size={20} />
            </button>
            <div className="h-72 bg-zinc-100 dark:bg-zinc-800 relative">
              {selectedItem.image ? (
                <Image src={selectedItem.image} fill className="w-full h-full object-cover" alt="" />
              ) : selectedItem.isPhysicalSpace ? (
                <div className="w-full h-full flex items-center justify-center text-amber-500 bg-amber-50/50 dark:bg-amber-950/10">
                  <Layers size={80} strokeWidth={1} />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                  <PackageOpen size={80} strokeWidth={1} />
                </div>
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
              {selectedItem.fileUrl && parseFileUrls(selectedItem.fileUrl).length > 0 && (
                <div className="space-y-2 w-full mt-4">
                  <p className="text-[9px] font-black text-zinc-400 uppercase italic tracking-wider">
                    Documentos do Item ({parseFileUrls(selectedItem.fileUrl).length})
                  </p>
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                    {parseFileUrls(selectedItem.fileUrl).map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-[1.2rem] font-black text-xs uppercase hover:bg-indigo-700 transition-colors"
                      >
                        <FileText size={18} /> Ver Documento #{index + 1}
                        <ExternalLink size={12} className="opacity-50" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}