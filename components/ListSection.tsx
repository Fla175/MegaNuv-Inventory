// components/ListSection.tsx
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import {
  Pencil, Trash2, Copy, Printer, Move, Eye, 
  MapPin, Box, Layers, Hash, X, ChevronRight, Barcode, Ghost, SearchX, Image as ImageIcon
} from "lucide-react";
import { useEscapeKey } from "../lib/hooks/useEscapeKey";
import { getItemColors, getCategoryColor, getParentSpaceColors } from "../lib/constants/colors";

interface ListSectionProps {
  filters: any;
  onEdit: (item: any, mode: 'view' | 'edit') => void; 
  onClone: (item: any) => void;
  onRefresh: () => void;
  onMove?: (item: any) => void;
  actives: any[];
  fatherSpaces: any[];
}

export default function ListSection({ filters, onEdit, onClone, onRefresh, actives, fatherSpaces }: ListSectionProps) {
  // --- ESTADOS ---
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, isPhysicalSpace: boolean } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedPrintItem, setSelectedPrintItem] = useState<any | null>(null);
  const [selectedViewItem, setSelectedViewItem] = useState<any | null>(null);
  const [movingItem, setMovingItem] = useState<any | null>(null);
  const [moveExpanded, setMoveExpanded] = useState<Record<string, boolean>>({}); 
  const [isMovingLoading, setIsMovingLoading] = useState(false);
  
  // ESTADO NOVO: Guardar as áreas para cruzar com o categoryId dos ativos
  const [categories, setCategories] = useState<any[]>([]);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar modais com Esc
  useEscapeKey(() => setSelectedViewItem(null), !!selectedViewItem);
  useEscapeKey(() => setSelectedPrintItem(null), !!selectedPrintItem);
  useEscapeKey(() => setMovingItem(null), !!movingItem);
  useEscapeKey(() => setContextMenu(null), !!contextMenu);

  // --- BUSCA DE ÁREAS PARA MAPEAMENTO ---
  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories/list');
        const data = await res.json();
        if (res.ok && isMounted) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Erro ao carregar áreas no ListSection:", err);
      }
    }
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  // --- FECHAMENTO E POSICIONAMENTO DO MENU ---
  useEffect(() => {
    if (!contextMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    
    const closeMenu = () => setContextMenu(null);
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', closeMenu);
    window.addEventListener('resize', closeMenu);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeMenu);
      window.removeEventListener('resize', closeMenu);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, item: any, isPhysicalSpace: boolean) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBaseCompletelyEmpty || hasNoResultsFromFilter) return;

    const menuWidth = 256; 
    const menuHeight = 280; 
    
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = x - menuWidth;
    if (y + menuHeight > window.innerHeight) y = y - menuHeight;

    setContextMenu({ x, y, item, isPhysicalSpace });
  };

  // --- LÓGICA DE FILTRO ---
  const filteredData = useMemo(() => {
    const query = filters.query?.toLowerCase() || "";
    const category = filters.category || "";
    const manufacturer = filters.manufacturer?.toLowerCase() || "";
    const model = filters.model?.toLowerCase() || "";

    const hasFilters = query !== "" || category !== "" || manufacturer !== "" || model !== "";

    const matchesDirectly = (a: any) => {
      const nameMatch = query === "" || 
                        a.name?.toLowerCase().includes(query) || 
                        a.serialNumber?.toLowerCase().includes(query) ||
                        a.sku?.toLowerCase().includes(query);
                        
      const categoryMatch = category === "" || a.categoryId === category || a.category?.name === category || a.category === category;
      const manufacturerMatch = manufacturer === "" || a.manufacturer?.toLowerCase().includes(manufacturer);
      const modelMatch = model === "" || a.model?.toLowerCase().includes(model);

      return nameMatch && categoryMatch && manufacturerMatch && modelMatch;
    };

    const visibleActiveIds = new Set<string>();
    
    actives.forEach(active => {
      if (matchesDirectly(active)) {
        visibleActiveIds.add(active.id);
        let currentParentId = active.parentId;
        while (currentParentId) {
          visibleActiveIds.add(currentParentId);
          const parent = actives.find(a => a.id === currentParentId);
          currentParentId = parent?.parentId;
        }
      }
    });

    const filteredActives = actives.filter(a => visibleActiveIds.has(a.id));

    const filteredSpaces = fatherSpaces.filter((space) => {
      const hasVisibleActives = filteredActives.some(a => a.fatherSpaceId === space.id);
      if (hasFilters) {
        const spaceNameMatch = query !== "" && space.name?.toLowerCase().includes(query);
        return hasVisibleActives || spaceNameMatch;
      }
      return true;
    });

    return { 
      spaces: filteredSpaces, 
      actives: filteredActives, 
      hasFilters 
    };
  }, [filters, actives, fatherSpaces]);

  // --- AÇÕES ---
  const handleMoveAction = async (targetSpaceId: string, targetParentId?: string) => {
    if (!movingItem) return;
    setIsMovingLoading(true);

    try {
      const res = await fetch('/api/actives/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: movingItem.id,
          newFatherSpaceId: targetSpaceId,
          newParentId: targetParentId || null, 
        }),
      });

      if (res.ok) {
        onRefresh();
        setMovingItem(null);
        if (selectedViewItem) setSelectedViewItem(null); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMovingLoading(false);
    }
  };

  const handleCloneClick = (item: any) => {
    onClone({ ...item, id: undefined, serialNumber: "", quantity: 1 });
    if (selectedViewItem) setSelectedViewItem(null);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Deseja remover "${item.name}" permanentemente?`)) return;
    try {
      const res = await fetch(`/api/actives/delete?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) { 
        onRefresh(); 
        if (selectedViewItem) setSelectedViewItem(null);
      }
    } catch (err) { alert(`Erro ao excluir: ${err}`); }
  };

  // --- RENDERIZAÇÃO DA ÁRVORE ---
  const renderActiveTree = (parentId: string | null, spaceId: string, level: number = 0) => {
    const children = filteredData.actives.filter(a => {
      const isTopLevel = !a.parentId || a.parentId === "";
      if (parentId === null) return isTopLevel && a.fatherSpaceId === spaceId;
      return a.parentId === parentId;
    });

    if (children.length === 0 && level >= 0) {
      return (
        <div className={`flex flex-col items-center justify-center py-8 px-6 opacity-40 group-hover:opacity-60 transition-opacity ${level > 0 ? "ml-6 border-l-2 dark:border-white/5" : ""}`}>
          <Ghost size={24} className="mb-2 text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
            {level === 0 ? "Nenhum ativo neste local" : "Este espaço físico está vazio"}
          </p>
        </div>
      );
    }

    return (
      <div className={`${level > 0 ? "ml-6 border-l-2 dark:border-white/5 pl-2" : ""}`}>
        {children.map((active) => {
          const isExpanded = expandedNodes[active.id];
          const hasSubItems = actives.some(a => a.parentId === active.id);
          
          // SOLUÇÃO: Pega a área diretamente do backend (se o include estiver ativo) OU busca da nossa lista pelo ID!
          const a = active.category || categories.find(ar => ar.id === active.categoryId);

          return (
            <div key={active.id} className="animate-in slide-in-from-left-2 duration-300">
              <div 
                onContextMenu={(e) => handleContextMenu(e, active, active.isPhysicalSpace)}
                onClick={() => setSelectedViewItem({ ...active, hasSubItems })} 
                className="group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer border-b last:border-0 dark:border-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      if (hasSubItems || active.isPhysicalSpace) {
                        setExpandedNodes(p => ({ ...p, [active.id]: !p[active.id] }));
                      }
                    }}
                    className={`relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform ${hasSubItems || active.isPhysicalSpace ? "cursor-pointer hover:scale-105 active:scale-95 border-2 border-blue-500/30" : "border dark:border-white/10"} ${
                      getItemColors(active.isPhysicalSpace, hasSubItems).bg
                    } ${
                      getItemColors(active.isPhysicalSpace, hasSubItems).text
                    }`}
                  >
                    {active.isPhysicalSpace ? <Layers size={20} /> : <Box size={20} />}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-gray-800 dark:text-zinc-200 uppercase tracking-tight line-clamp-1">{active.name}</h4>
                    <div className="flex items-center mt-0.5">
                      {active.isPhysicalSpace &&
                        <p className={`text-[9px] font-bold uppercase tracking-widest mr-2 ${getItemColors(true, hasSubItems).text}`}>Espaço Físico</p>
                      }
                      
                      {a && (
                        <p 
                          className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border mr-2"
                          style={{ 
                            color: getCategoryColor(a.id, categories), 
                            backgroundColor: `${getCategoryColor(a.id, categories)}15`, 
                            borderColor: `${getCategoryColor(a.id, categories)}40` 
                          }}
                        >
                          {a.name}
                        </p>
                      )}

                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Hash size={10}/> SN: {active.serialNumber || 'SEM SN'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 text-right pr-2 ${!active.isPhysicalSpace && "mr-8"}`}>
                    <div className="hidden sm:block">
                        <p className="text-[9px] font-black text-emerald-500/80 uppercase">Valor</p>
                        <p className="text-xs font-black dark:text-white tracking-tighter">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(active.fixedValue || 0)}
                        </p>
                      </div>
                    {active.isPhysicalSpace &&
                      <ChevronRight size={16} className={`text-gray-300 opacity-50 group-hover:opacity-100 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ${isExpanded && "rotate-90"}`} />
                    }
                </div>
              </div>

              {(isExpanded || filteredData.hasFilters) && renderActiveTree(active.id, spaceId, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const isBaseCompletelyEmpty = fatherSpaces.length === 0;
  const hasNoResultsFromFilter = fatherSpaces.length > 0 && filteredData.spaces.length === 0;

  return (
    <>
      <div className="w-full pb-32 print:hidden">
        <div className="space-y-6">
          
          {isBaseCompletelyEmpty || hasNoResultsFromFilter ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 bg-gray-50/50 dark:bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-full"></div>
                  <div className="relative w-24 h-24 bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl flex items-center justify-center border dark:border-white/10">
                      {hasNoResultsFromFilter ? <SearchX size={40} className="text-red-400" /> : <MapPin size={40} className="text-blue-500" />}
                  </div>
              </div>
              <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase italic tracking-tight mb-2 text-center">
                  {hasNoResultsFromFilter ? "Nenhum resultado encontrado" : "Nenhum Espaço Cadastrado"}
              </h3>
              <p className="text-[15px] font-bold text-gray-400 dark:text-zinc-500 text-center max-w-xs leading-relaxed">
                  {hasNoResultsFromFilter ? "Tente ajustar seus termos de busca ou limpar os filtros aplicados." : "Para começar a organizar seu inventário, adicione primeiro um Espaço Pai."}
              </p>
            </div>
          ) : (
            <>
              {filteredData.spaces.map((space) => {
                const hasActives = filteredData.actives.some(a => a.fatherSpaceId === space.id);
                const spaceColors = getParentSpaceColors(hasActives);
                return (
                <div key={space.id} className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] border-b dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${spaceColors.bg} ${spaceColors.text}`}>
                        <MapPin size={20} />
                      </div>
                      <h2 className="text-xl font-black italic text-gray-500 dark:text-white uppercase">{space.name}</h2>
                    </div>
                  </div>
                  <div onContextMenu={(e) => handleContextMenu(e, space, true)} className="bg-white dark:bg-zinc-900/50">
                    {renderActiveTree(null, space.id)}
                  </div>
                </div>
              )})}
            </>
          )}
        </div>
      </div>

      {/* --- MODAL VIEW REDESENHADO --- */}
      {selectedViewItem && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            {/* Cabeçalho */}
            <div className="p-6 border-b dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02] shrink-0">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${getItemColors(selectedViewItem.isPhysicalSpace, selectedViewItem.hasSubItems).bg} ${getItemColors(selectedViewItem.isPhysicalSpace, selectedViewItem.hasSubItems).text}`}>
                    {selectedViewItem.isPhysicalSpace ? <MapPin size={24}/> : <Box size={24}/>}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                      {selectedViewItem.isPhysicalSpace ? 'Espaço Físico' : 'Ativo Cadastrado'}
                    </h3>
                    <p className="text-xl font-black dark:text-white uppercase tracking-tighter">{selectedViewItem.name}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedViewItem(null)} className="p-3 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><X/></button>
            </div>
            
            {/* Conteúdo Rolável */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-6">
               
               <div className="flex-1 space-y-6">
                  <div className="w-full h-48 sm:h-64 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border dark:border-white/5 overflow-hidden flex items-center justify-center relative group">
                    {selectedViewItem.imageUrl ? (
                      <img src={selectedViewItem.imageUrl} alt={selectedViewItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-300 dark:text-zinc-700">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={<Hash size={16}/>} label="Série" Class="truncate" value={selectedViewItem.serialNumber || "N/A"} />
                    <InfoItem icon={<MapPin size={16}/>} label="Localização" Class="truncate" value={fatherSpaces.find(s => s.id === selectedViewItem.fatherSpaceId)?.name || "Não definido"} />
                    <InfoItem icon={<Barcode size={16}/>} label="ID do Sistema" Class="font-mono text-[10px] truncate" value={selectedViewItem.id} />
                  </div>
               </div>

               <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                 <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border dark:border-white/5 h-full">
                    <div className="bg-white p-3 rounded-2xl shadow-md mb-4 border border-zinc-100">
                      <QRCode value={`${window.location.origin}/qrcode/view?id=${selectedViewItem.id}`} size={160} />
                    </div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-4 text-center">QR Code de Identificação</p>
                    
                    <button 
                      onClick={() => {
                        setSelectedPrintItem(selectedViewItem);
                        setSelectedViewItem(false);
                      }} 
                      className="w-full py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors"
                    >
                      <Printer size={14}/> Imprimir Etiqueta
                    </button>
                 </div>
               </div>
            </div>

            <div className="p-4 border-t dark:border-white/5 bg-white dark:bg-zinc-900 shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar">
               <button onClick={() => { setSelectedViewItem(false); onEdit(selectedViewItem, 'edit'); }} className="flex-1 sm:flex-none px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                 <Pencil size={16}/> <span className="hidden sm:inline">Editar Registro</span>
               </button>

               <button onClick={() => {setMovingItem(selectedViewItem); setSelectedViewItem(false);}} className="flex-1 sm:flex-none px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                  <Move size={16}/> <span className="hidden sm:inline">Mover</span>
               </button>

               <button onClick={() => {handleCloneClick(selectedViewItem); setSelectedViewItem(false);}} className="flex-1 sm:flex-none px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                  <Copy size={16}/> <span className="hidden sm:inline">Clonar</span>
               </button>


               <div className="hidden sm:block flex-1"></div>

               <button onClick={() => handleDelete(selectedViewItem)} className="flex-1 sm:flex-none px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                 <Trash2 size={16}/> <span className="hidden sm:inline">Excluir</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE IMPRESSÃO --- */}
      {selectedPrintItem && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md print:absolute print:inset-0 print:bg-white print:z-[9999] print:p-0 print:backdrop-blur-none">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl p-6 print:w-auto print:max-w-none print:border-none print:shadow-none print:rounded-none print:p-0" id="qrcode-print-container">
              
              {/* CABEÇALHO - Escondido na impressão */}
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h3 className="font-black uppercase text-sm dark:text-white">Imprimir Etiqueta</h3>
                <button onClick={() => setSelectedPrintItem(null)} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <X size={20}/>
                </button>
              </div>
              
              {/* ÁREA DA ETIQUETA - O que realmente será impresso */}
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700 print:border-2 print:border-black print:rounded-lg print:m-4 print:p-4 text-black" id="qrcode-print-area">
                
                {/* Fundo branco forçado para garantir a leitura do QR Code */}
                <div className="bg-white p-3 rounded-xl border-2 border-zinc-100 shadow-sm">
                  <QRCode
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/qrcode/view?id=${selectedPrintItem.id}`}
                    size={180}
                    level="H"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>
                
                <div className="mt-4 text-center">
                  <h4 className="font-black text-lg uppercase tracking-tight leading-tight max-w-[200px]">{selectedPrintItem.name}</h4>
                  <p className="text-[10px] font-mono text-zinc-400 mt-2 uppercase tracking-widest">ID: {selectedPrintItem.id.slice(0, 8).toUpperCase()}</p>
                  {selectedPrintItem.serialNumber && (
                    <p className="text-[10px] font-mono text-zinc-500 mt-1">SN: {selectedPrintItem.serialNumber}</p>
                  )}
                  {selectedPrintItem.sku && (
                    <p className="text-[10px] font-mono text-zinc-400 mt-1">SKU: {selectedPrintItem.sku}</p>
                  )}
                </div>
              </div>

              {/* BOTÃO DE AÇÃO - Escondido na impressão */}
              <button 
                onClick={() => window.print()} 
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white p-3 rounded-xl font-bold uppercase text-xs flex justify-center items-center gap-2 print:hidden"
              >
                <Printer size={20} /> 
                Imprimir Etiqueta
              </button>
          </div>
        </div>
      )}

      {/* --- MODAL DE MOVER --- */}
      {movingItem && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
           <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl">
            {isMovingLoading && (
              <div className="absolute inset-0 z-[800] flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
              <div className="p-6 border-b dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-blue-500 tracking-widest">Mover Ativo</h3>
                  <p className="text-sm font-bold dark:text-white">{movingItem.name}</p>
                </div>
                <button onClick={() => setMovingItem(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl"><X/></button>
              </div>

              <div className="p-4 max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
                {fatherSpaces.map(space => {
                    const isExpanded = moveExpanded[space.id];
                    const subActives = actives.filter(a => a.fatherSpaceId === space.id && a.isPhysicalSpace && a.id !== movingItem.id);

                    return (
                        <div key={space.id} className="border dark:border-white/5 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
                            <div className="flex items-center p-1">
                                <button 
                                  onClick={() => handleMoveAction(space.id, undefined)} 
                                  className="flex-1 flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group text-left"
                                >
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-200 transition-colors">
                                    <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase group-hover:text-blue-600 transition-colors">
                                    {space.name}
                                  </span>
                                </button>

                                {subActives.length > 0 && (
                                  <button 
                                    onClick={() => setMoveExpanded(p => ({ ...p, [space.id]: !p[space.id] }))} 
                                    className="p-4 mr-1 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                  >
                                    <ChevronRight size={18} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  </button>
                                )}
                            </div>

                            {isExpanded && subActives.length > 0 && (
                                <div className="border-t dark:border-white/5 p-2 space-y-1 bg-white dark:bg-zinc-900">
                                    {subActives.map(sub => (
                                        <button 
                                          key={sub.id} 
                                          onClick={() => handleMoveAction(space.id, sub.id)} 
                                          className="w-full flex items-center gap-3 p-3 pl-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                              <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-600 uppercase">
                                                {sub.name}
                                              </span>
                                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                                Espaço Físico
                                              </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
              </div>
           </div>
        </div>
      )}

      {/* --- MENU DE CONTEXTO --- */}
      {contextMenu && (
        <div 
             ref={menuRef}
             className="fixed z-[600] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border dark:border-white/10 shadow-2xl rounded-[1.5rem] py-2 w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
             style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="px-4 py-2 border-b dark:border-white/5">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Ações do Item</p>
            <p className="text-[10px] font-black dark:text-white truncate uppercase">{contextMenu.item.name}</p>
          </div>
           <ContextBtn icon={<Eye size={16}/>} label="Visualizar Detalhes" onClick={() => setSelectedViewItem({ ...contextMenu.item, hasSubItems: actives.some(a => a.parentId === contextMenu.item.id) })} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Pencil size={16}/>} label="Editar Registro" onClick={() => onEdit(contextMenu.item, 'edit')} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Move size={16}/>} label="Mover para outro local" onClick={() => setMovingItem(contextMenu.item)} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Copy size={16}/>} label="Clonar Ativo" onClick={() => handleCloneClick(contextMenu.item)} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Printer size={16}/>} label="Imprimir Etiqueta" onClick={() => setSelectedPrintItem(contextMenu.item)} onClose={() => setContextMenu(null)} />
          <div className="mt-1 pt-1 border-t dark:border-white/5">
            <ContextBtn icon={<Trash2 size={16}/>} label="Remover Registro" onClick={() => handleDelete(contextMenu.item)} danger onClose={() => setContextMenu(null)} />
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #qrcode-print-area,
          #qrcode-print-area * {
            visibility: visible !important;
          }
          #qrcode-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            color: black !important;
            border: 2px solid black !important;
            border-radius: 8px !important;
            margin: 0 !important;
            padding: 16px !important;
            box-shadow: none !important;
          }
          #qrcode-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            z-index: 9999 !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}

// --- COMPONENTES AUXILIARES ---
function InfoItem({ icon, label, Class, value }: { icon: any, label: string, Class: string, value: string }) {
    return (
        <div className="flex items-start gap-3 group w-full overflow-hidden">
            <div className="p-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
                <p className={`text-sm font-bold ${Class} dark:text-zinc-200 uppercase truncate`}>{value}</p>
            </div>
        </div>
    );
}

function ContextBtn({ icon, label, onClick, danger, onClose }: { icon: any, label: string, onClick: () => void, danger?: boolean, onClose: () => void }) {
  return (
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        onClick(); 
        onClose();
      }} 
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase transition-all ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white'}`}
    >
      {icon} {label}
    </button>
  );
}
