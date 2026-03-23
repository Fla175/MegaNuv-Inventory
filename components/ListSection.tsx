// components/ListSection.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import {
  Pencil, Trash2, Copy, Printer, Move, Eye, 
  MapPin, Box, Layers, Hash, ChevronDown, X, ChevronRight, Barcode, Ghost, SearchX
} from "lucide-react";

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
  
  const menuRef = useRef<HTMLDivElement>(null);

  // --- FECHAMENTO E POSICIONAMENTO DO MENU ---
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, item: any, isPhysicalSpace: boolean) => {
    e.preventDefault();
    e.stopPropagation();

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
    const area = filters.area || "";
    const manufacturer = filters.manufacturer?.toLowerCase() || "";
    const model = filters.model?.toLowerCase() || "";

    const hasFilters = query !== "" || area !== "" || manufacturer !== "" || model !== "";

    const matchesDirectly = (a: any) => {
      const nameMatch = query === "" || 
                        a.name?.toLowerCase().includes(query) || 
                        a.serialNumber?.toLowerCase().includes(query) ||
                        a.sku?.toLowerCase().includes(query);
                        
      const areaMatch = area === "" || a.areaId === area || a.area?.name === area || a.area === area;
      const manufacturerMatch = manufacturer === "" || a.manufacturer?.toLowerCase().includes(manufacturer);
      const modelMatch = model === "" || a.model?.toLowerCase().includes(model);

      return nameMatch && areaMatch && manufacturerMatch && modelMatch;
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMovingLoading(false);
    }
  };

  const handleCloneClick = (item: any) => {
    onClone({ ...item, id: undefined, serialNumber: "", quantity: 1 });
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Deseja remover "${item.name}" permanentemente?`)) return;
    try {
      const res = await fetch(`/api/actives/delete?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) { onRefresh(); }
    } catch (err) { alert(`Erro ao excluir: ${err}`); }
  };

  // --- RENDERIZAÇÃO DA ÁRVORE ---
  const renderActiveTree = (parentId: string | null, spaceId: string, level: number = 0) => {
    const children = filteredData.actives.filter(a => {
      const isTopLevel = !a.parentId || a.parentId === "";
      if (parentId === null) return isTopLevel && a.fatherSpaceId === spaceId;
      return a.parentId === parentId;
    });

    // EMPTY STATE DO ESPAÇO PAI (Quando não há ativos dentro deste espaço específico)
    if (children.length === 0 && level === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 opacity-30 group-hover:opacity-50 transition-opacity">
          <Ghost size={32} className="mb-2 text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nenhum ativo neste local</p>
        </div>
      );
    }

    return (
      <div className={`${level > 0 ? "ml-6 border-l-2 dark:border-white/5 pl-2" : ""}`}>
        {children.map((active) => {
          const isExpanded = expandedNodes[active.id];
          const hasSubItems = actives.some(a => a.parentId === active.id);

          return (
            <div key={active.id} className="animate-in slide-in-from-left-2 duration-300">
              <div 
                onContextMenu={(e) => handleContextMenu(e, active, false)}
                onClick={() => {
                   if(hasSubItems) setExpandedNodes(p => ({ ...p, [active.id]: !p[active.id] }));
                   else setSelectedViewItem(active);
                }}
                className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer border-b last:border-0 dark:border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border dark:border-white/10 ${hasSubItems ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                    {hasSubItems ? <Layers size={18} /> : <Box size={18} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-800 dark:text-zinc-200 uppercase tracking-tight">{active.name}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Hash size={10}/> SN: {active.serialNumber || 'SEM SN'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                        <p className="text-[9px] font-black text-green-400/80 uppercase">Valor:</p>
                        <p className="text-[10px] font-black dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(active.fixedValue || 0)}
                        </p>
                    </div>
                    {hasSubItems ? <ChevronDown size={16} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /> : <ChevronRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100" />}
                </div>
              </div>
              {(isExpanded || filteredData.hasFilters) && renderActiveTree(active.id, spaceId, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  // Estados de Empty State
  const isBaseCompletelyEmpty = fatherSpaces.length === 0;
  const hasNoResultsFromFilter = fatherSpaces.length > 0 && filteredData.spaces.length === 0;

  return (
    <>
      <div className="w-full pb-32 print:hidden">
        <div className="space-y-6">
          
          {/* EMPTY STATE: GLOBAL OU FILTRO */}
          {isBaseCompletelyEmpty || hasNoResultsFromFilter ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 bg-gray-50/50 dark:bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/5 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-full"></div>
                  <div className="relative w-24 h-24 bg-white dark:bg-zinc-800 rounded-[2rem] shadow-xl flex items-center justify-center border dark:border-white/10">
                      {hasNoResultsFromFilter ? (
                          <SearchX size={40} className="text-red-400" />
                      ) : (
                          <MapPin size={40} className="text-blue-500" />
                      )}
                  </div>
              </div>
              
              <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase italic tracking-tight mb-2 text-center">
                  {hasNoResultsFromFilter ? "Nenhum resultado encontrado" : "Nenhum Espaço Cadastrado"}
              </h3>
              
              <p className="text-[15px] font-bold text-gray-400 dark:text-zinc-500 text-center max-w-xs leading-relaxed">
                  {hasNoResultsFromFilter 
                      ? "Tente ajustar seus termos de busca ou limpar os filtros aplicados." 
                      : "Para começar a organizar seu inventário, adicione primeiro um Espaço Pai."
                  }
              </p>
              {!hasNoResultsFromFilter &&
                <p
                className="text-[14px] font-bold text-blue-500 text-center max-w-xs italic leading-relaxed"
                
                >
                  + Adicionar novo espaço pai 
                </p>
              }

              {hasNoResultsFromFilter && (
                  <button 
                      onClick={() => onRefresh()} 
                      className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform"
                  >
                      Limpar Filtros
                  </button>
              )}
            </div>
          ) : (
            <>
              {/* LISTA DE ESPAÇOS E SEUS ATIVOS */}
              {filteredData.spaces.map((space) => (
                <div key={space.id} className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] border-b dark:border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                        <MapPin size={20} />
                      </div>
                      <h2 className="text-xl font-black italic text-gray-500 dark:text-white uppercase">{space.name}</h2>
                    </div>
                  </div>
                  <div onContextMenu={(e) => handleContextMenu(e, space, true)} className="bg-white dark:bg-zinc-900/50">
                    {renderActiveTree(null, space.id)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* --- MODAIS (EXATAMENTE COMO NO ORIGINAL) --- */}
      {selectedViewItem && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] border dark:border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02]">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Eye size={24}/></div>
                  <div>
                    <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest">Detalhes do Ativo</h3>
                    <p className="text-xl font-black dark:text-white uppercase italic">{selectedViewItem.name}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedViewItem(null)} className="p-3 hover:text-red-500 transition-colors"><X/></button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <InfoItem icon={<Hash size={16}/>} label="Número de Série" Class="" value={selectedViewItem.serialNumber || "N/A"} />
                  <InfoItem icon={<Layers size={16}/>} label="Quantidade" Class="" value={selectedViewItem.quantity || "1"} />
                  <InfoItem icon={<MapPin size={16}/>} label="Espaço de Origem" Class="" value={fatherSpaces.find(s => s.id === selectedViewItem.fatherSpaceId)?.name || "Não definido"} />
                  <InfoItem icon={<Barcode size={16}/>} label="ID do Sistema" Class="font-mono text-[10px]" value={selectedViewItem.id} />
               </div>
               <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-white/[0.03] rounded-[2rem] border dark:border-white/5">
                  <div className="bg-white p-4 rounded-3xl shadow-xl mb-4">
                    <QRCode value={`${window.location.origin}/qrcode/view?id=${selectedViewItem.id}`} size={140} />
                  </div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">QR Code de Identificação</p>
               </div>
            </div>

            <div className="p-8 bg-zinc-50 dark:bg-white/[0.02] flex gap-4">
               <button onClick={() => { setSelectedViewItem(null); onEdit(selectedViewItem, 'edit'); }} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"><Pencil size={16}/> Editar Ativo</button>
            </div>
          </div>
        </div>
      )}

      {selectedPrintItem && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md print:hidden">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b dark:border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Preview da Etiqueta</span>
              <button onClick={() => setSelectedPrintItem(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-10 flex flex-col items-center">
              <div id="printable-area" className="w-full bg-white dark:bg-zinc-800 p-8 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center shadow-inner text-black dark:text-white">
                <div className="w-16 h-16 bg-[#38B6FF] rounded-2xl mb-4 p-3">
                  <Image src="/logo-inventory.svg" alt="logo" width={64} height={64} className="w-full h-full" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 italic">MegaNuv Inventory™</h3>
                <div className="bg-white p-4 rounded-3xl shadow-xl mb-6"><QRCode value={`${window.location.origin}/qrcode/view?id=${selectedPrintItem.id}`} size={160} fgColor="#000000" /></div>
                <h4 className="text-lg font-black uppercase text-center mb-2">{selectedPrintItem.name}</h4>
                <p className="text-[10px] font-mono text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 rounded-full">ID: {selectedPrintItem.id}</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-white/[0.02]">
                <button onClick={() => setSelectedPrintItem(null)} className="py-4 font-black uppercase text-[10px] text-zinc-500">Voltar</button>
                <button onClick={() => window.print()} className="bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Printer size={14} /> Imprimir</button>
            </div>
          </div>
        </div>
      )}

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

              <div className="p-4 max-h-[500px] overflow-y-auto space-y-2">
                {fatherSpaces.map(space => {
                    const isExpanded = moveExpanded[space.id];
                    const subActives = actives.filter(a => a.fatherSpaceId === space.id && a.isPhysicalSpace && a.id !== movingItem.id);

                    return (
                        <div key={space.id} className="border dark:border-white/5 rounded-2xl overflow-hidden">
                            <div className="flex items-center">
                                <button onClick={() => setMoveExpanded(p => ({ ...p, [space.id]: !p[space.id] }))} className="p-4 text-zinc-400 hover:text-blue-500">
                                    <ChevronRight size={18} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                <button 
                                    disabled={space.id === movingItem.fatherSpaceId && !movingItem.parentId}
                                    onClick={() => handleMoveAction(space.id)}
                                    className="flex-1 flex items-center justify-between p-4 pl-0 text-left disabled:opacity-30"
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin size={18} className="text-blue-500" />
                                        <span className="text-sm font-bold dark:text-zinc-300 uppercase">{space.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase">Mover para Raiz</span>
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="bg-zinc-50 dark:bg-white/[0.01] border-t dark:border-white/5 p-2 space-y-1">
                                    {subActives.length > 0 ? subActives.map(sub => (
                                        <button key={sub.id} onClick={() => handleMoveAction(space.id, sub.id)} className="w-full flex items-center gap-3 p-3 pl-8 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all group">
                                            <Box size={14} className="text-zinc-400 group-hover:text-blue-500" />
                                            <span className="text-xs font-bold dark:text-zinc-400 group-hover:text-blue-500 uppercase">Dentro de: {sub.name}</span>
                                        </button>
                                    )) : (
                                      <p className="text-[10px] text-zinc-500 italic p-3 pl-8">Nenhum local físico neste espaço.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
              </div>
           </div>
        </div>
      )}

      {contextMenu && (
        <div 
             ref={menuRef}
             className="fixed z-[600] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border dark:border-white/10 shadow-2xl rounded-[1.5rem] py-2 w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
             style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="px-4 py-2 border-b dark:border-white/5">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Ações do Item</p>
            <p className="text-[10px] font-black dark:text-white truncate uppercase">{contextMenu.item.name}</p>
          </div>
          <ContextBtn icon={<Eye size={16}/>} label="Visualizar Detalhes" onClick={() => setSelectedViewItem(contextMenu.item)} />
          <ContextBtn icon={<Pencil size={16}/>} label="Editar Registro" onClick={() => onEdit(contextMenu.item, 'edit')} />
          {!contextMenu.isPhysicalSpace && (
            <>
              <ContextBtn icon={<Move size={16}/>} label="Mover para outro local" onClick={() => setMovingItem(contextMenu.item)} />
              <ContextBtn icon={<Copy size={16}/>} label="Clonar Ativo" onClick={() => handleCloneClick(contextMenu.item)} />
            </>
          )}
          <ContextBtn icon={<Printer size={16}/>} label="Imprimir Etiqueta" onClick={() => setSelectedPrintItem(contextMenu.item)} />
          <div className="mt-1 pt-1 border-t dark:border-white/5">
            <ContextBtn icon={<Trash2 size={16}/>} label="Remover Registro" onClick={() => handleDelete(contextMenu.item)} danger />
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: fixed; left: 0; top: 0; width: 100% !important; background: white !important; color: black !important; padding: 0 !important; border: none !important; }
        }
      `}</style>
    </>
  );
}

// --- COMPONENTES AUXILIARES ---
function InfoItem({ icon, label, Class, value }: { icon: any, label: string, Class: string, value: string }) {
    return (
        <div className="flex items-start gap-4 group">
            <div className="p-2 bg-zinc-100 dark:bg-white/5 rounded-lg text-zinc-400 group-hover:text-blue-500 transition-colors">{icon}</div>
            <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">{label}</p>
                <p className={`text-sm font-bold ${Class} dark:text-zinc-200 uppercase`}>{value}</p>
            </div>
        </div>
    );
}

function ContextBtn({ icon, label, onClick, danger }: any) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase transition-all ${danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white'}`}>
      {icon} {label}
    </button>
  );
}