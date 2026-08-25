/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import QRCode from "react-qr-code";
import {
  Pencil, Trash2, Copy, Printer, Move, Eye, 
  MapPin, Box, Layers, Hash, X, ChevronRight, Barcode, Ghost, SearchX, LinkIcon, Image as ImageIcon, Boxes,
  FileText, FileIcon, Tag, Factory, Cpu, Loader2, Search, ChevronDown
} from "lucide-react";
import { useEscapeKey } from "../lib/hooks/useEscapeKey";
import { useIsMobile } from "../lib/hooks/useMediaQuery";
import { UseToast } from "../lib/context/ToastContext";
import { getItemColors, getParentSpaceColors } from "../lib/constants/colors";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { ListSectionProps } from "../lib/types";
import { useUser } from "@/lib/context/UserContext";
import Image from "next/image";
import { toLocalMediaUrl } from "@/lib/mediaUrl";

const getFileDetails = (url: string) => {
  const rawFilename = url.split('/').pop()?.split('?')[0] || 'link-anexado';
  const displayName = decodeURIComponent(rawFilename);
  
  const extMatch = displayName.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extMatch ? extMatch[1].toLowerCase() : 'link';

  let Icon = LinkIcon;
  let colorClass = 'text-gray-500';
  let bgClass = 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700';

  if (extension === 'pdf') {
    Icon = FileText;
    colorClass = 'text-red-500';
    bgClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
  } else if (['doc', 'docx'].includes(extension)) {
    Icon = FileIcon;
    colorClass = 'text-blue-500';
    bgClass = 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
  } else if (['png', 'jpg', 'jpeg'].includes(extension)) {
    Icon = ImageIcon;
    colorClass = 'text-emerald-500';
    bgClass = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50';
  }

  return { displayName, extension, Icon, colorClass, bgClass };
};

function SearchableSelect({ options, value, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
  
  const selectedOption = options.find((opt: any) => opt.id === value);

  const rootElements = useMemo(() => {
    return options.filter((opt: any) => !opt.parentId);
  }, [options]);

  const filteredAll = useMemo(() => {
     if (!searchTerm) return [];
     const term = searchTerm.toLowerCase();
     return options.filter((opt: any) => opt.name.toLowerCase().includes(term));
  }, [searchTerm, options]);

  const getDirectChildren = (parentId: string) => {
    return options.filter((opt: any) => opt.parentId === parentId);
  };

  const getAllDescendants = (parentId: string): string[] => {
    const directChildren = getDirectChildren(parentId);
    let descendants: string[] = [];
    for (const child of directChildren) {
      descendants.push(child.id);
      descendants = descendants.concat(getAllDescendants(child.id));
    }
    return descendants;
  };

  const getDescendantsCount = (parentId: string) => {
    return getAllDescendants(parentId).length;
  };

  const toggleExpand = (id: string) => {
    setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderChildren = (parentId: string, depth: number) => {
    const children = getDirectChildren(parentId);
    if (children.length === 0) return null;
  
    const indentClass = depth > 0 ? "ml-4 border-l-2 dark:border-white/5 pl-2" : "";

    return (
      <div className={`${indentClass} flex flex-col`}>
        {children.map((child: any) => {
          const grandChildren = getDirectChildren(child.id);
          const hasGrandChildren = grandChildren.length > 0;
          const isExpanded = expandedSpaces[child.id];
          const isSpace = child.type === 'space' || child.type === 'default';
  
          return (
            <div key={child.id} className="w-full flex flex-col">
              <div 
                className={`w-full flex items-center justify-between border-b dark:border-white/5 transition-colors ${
                  isSpace ? 'hover:bg-blue-50/50 dark:hover:bg-blue-600/5' : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-600/5'
                }`}
              >
                <button 
                  type="button" 
                  onClick={() => { onChange(child.id, child.type); setIsOpen(false); setSearchTerm(""); }} 
                  className="flex-1 text-left py-3 px-3 min-w-0"
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSpace ? 'bg-blue-500' : 'bg-emerald-500'}`} />

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs font-bold dark:text-zinc-200 truncate">{child.name}</span>
                      {child.type !== 'default' && (
                        <span className="text-[8px] uppercase font-black text-gray-400 tracking-wider truncate">
                          {isSpace ? 'Espaço Pai' : 'Espaço Físico'}
                        </span>
                      )}
                    </div>
      
                    {hasGrandChildren && (
                      <span className={`ml-2 text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                        isSpace ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                      }`}>
                        {grandChildren.length}
                      </span>
                    )}
                  </div>
                </button>
                
                {hasGrandChildren && (
                  <button 
                    type="button" 
                    onClick={() => toggleExpand(child.id)}
                    className={`shrink-0 p-2 mr-2 transition-colors rounded-lg ${
                      isSpace ? 'hover:bg-blue-100 dark:hover:bg-blue-900/40' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    }`}
                  >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isSpace ? 'text-blue-500' : 'text-emerald-500'} ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              
              {hasGrandChildren && isExpanded && renderChildren(child.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold text-xs h-[52px] text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-amber-500 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedOption ? (
            <>
              {selectedOption.type !== 'default' && (
                <span className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase ${selectedOption.type === 'space' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'}`}>
                  {selectedOption.type === 'space' ? 'PAI' : 'FÍSICO'}
                </span>
              )}
              <span className="truncate">{selectedOption.name}</span>
            </>
          ) : <span className="text-zinc-400">{placeholder}</span>}
        </div>
        <ChevronDown className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
      </button>
      
      {isOpen && (
        <div className="absolute z-[1000] w-full mt-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b dark:border-zinc-800 flex items-center gap-2">
            <Search size={14} className="text-zinc-400 ml-2" />
            <input autoFocus className="w-full bg-transparent p-2 text-xs font-bold outline-none dark:text-white" placeholder="Filtrar local..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {searchTerm ? (
              filteredAll.length > 0 ? (
                <div>
                  {filteredAll.map((opt: any) => (
                    <div key={opt.id} className="border-b dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => { onChange(opt.id, opt.type); setIsOpen(false); setSearchTerm(""); }}
                        className="w-full text-left px-3 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${opt.type === 'space' || opt.type === 'default' ? 'bg-blue-500' : 'bg-emerald-500'} shrink-0`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold dark:text-zinc-200">{opt.name}</span>
                            {opt.type !== 'default' && (
                              <span className="text-[8px] uppercase font-black text-gray-400">
                                {opt.type === 'space' ? 'ESP. PAI' : 'ESP. FÍSICO'}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-[10px] font-black text-zinc-400 uppercase">Nenhum local encontrado</div>
              )
            ) : (
              <div>
                {rootElements.length > 0 && rootElements.map((item: any) => {
                  const descendantsCount = getDescendantsCount(item.id);
                  const isExpanded = expandedSpaces[item.id];
                  const isSpace = item.type === 'space' || item.type === 'default';

                  return (
                    <div key={item.id} className="w-full flex flex-col">
                      <div className={`w-full flex items-center justify-between border-b dark:border-zinc-800 transition-colors ${
                        isSpace ? 'hover:bg-blue-50/50 dark:hover:bg-blue-600/5' : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-600/5'
                      }`}>
                        <button 
                          type="button" 
                          onClick={() => { onChange(item.id, item.type); setIsOpen(false); setSearchTerm(""); }} 
                          className="flex-1 text-left py-3 px-3 min-w-0"
                        >
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSpace ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                            
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-bold dark:text-zinc-200 truncate">{item.name}</span>
                              {item.type !== 'default' && (
                                <span className="text-[8px] uppercase font-black text-gray-400 tracking-wider truncate">
                                  {isSpace ? 'Espaço Pai' : 'Espaço Físico'}
                                </span>
                              )}
                            </div>

                            {descendantsCount > 0 && (
                              <span className={`ml-2 text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                                isSpace ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                              }`}>{descendantsCount}</span>
                            )}
                          </div>
                        </button>

                        {descendantsCount > 0 && (
                          <button 
                            type="button" 
                            onClick={() => toggleExpand(item.id)}
                            className={`shrink-0 p-2 mr-2 transition-colors rounded-lg ${
                              isSpace ? 'hover:bg-blue-100 dark:hover:bg-blue-900/40' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                            }`}
                          >
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isSpace ? 'text-blue-500' : 'text-emerald-500'} ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {descendantsCount > 0 && isExpanded && renderChildren(item.id, 1)}
                    </div>
                  );
                })}
                
                {rootElements.length === 0 && (
                  <div className="p-4 text-center text-[10px] font-black text-zinc-400 uppercase">Nenhum local encontrado</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {isOpen && <div className="fixed inset-0 z-[990]" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

function ListSection({ filters, onEdit, onClone, onRefresh, actives, fatherSpaces }: ListSectionProps) {
  const isMobile = useIsMobile();
  const { user } = useUser();
  const isViewer = user?.role === 'VIEWER';
  
  // --- ESTADOS DE SELEÇÃO MÚLTIPLA ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [longPressItem, setLongPressItem] = useState<string | null>(null);
  
  // --- ESTADOS DE CONTROLE ---
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: any, isPhysicalSpace: boolean, selectedCount?: number } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedPrintItem, setSelectedPrintItem] = useState<any | null>(null);
  const [selectedViewItem, setSelectedViewItem] = useState<any | null>(null);
  const [movingItem, setMovingItem] = useState<any | null>(null);
  const [moveExpanded, setMoveExpanded] = useState<Record<string, boolean>>({}); 
  const [isMovingLoading, setIsMovingLoading] = useState(false);
  
  // --- ESTADOS DE SELEÇÃO E CLONAGEM ---
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isCloneBatchOpen, setIsCloneBatchOpen] = useState(false);
  const [cloneQuantity, setCloneQuantity] = useState<number>(1);
  const [cloneDestinationSpaceId, setCloneDestinationSpaceId] = useState<string>("");
  const [isCloning, setIsCloning] = useState(false);

  // Estado do Dialog de Confirmação
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

  const cloneLocationOptions = useMemo(() => {
    return [
      { id: "", name: "Manter no espaço original de cada um", type: "default", parentId: null },
      ...fatherSpaces.map(s => ({ id: s.id, name: s.name, type: "space", parentId: null })),
      ...actives
        .filter(a => a.isPhysicalSpace)
        .map(a => ({
          id: a.id,
          name: a.name,
          type: "active",
          parentId: a.parentId || a.fatherSpaceId || null
        }))
    ];
  }, [fatherSpaces, actives]);
  
  const activateSelectionMode = (itemId: string) => {
    setIsSelectionMode(true);
    setSelectedItems(new Set([itemId]));
    setContextMenu(null);
  };
  
  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
    setSelectedViewItem(null);
  };

  const executeIframePrint = (item: any) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
  
    const qrCodeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/qrcode/view?id=${item.id}`;
  
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Imprimir Etiqueta</title>
          <style>
            @page { size: auto; margin: 0mm; }
            html, body {
              margin: 0; padding: 0;
              background: #ffffff !important; color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex; justify-content: center; align-items: center;
              min-height: 100vh; width: 100vw;
            }
            .print-label {
              background: #ffffff !important; color: #000000 !important;
              border: none !important; padding: 24px; text-align: center;
              box-sizing: border-box; max-width: 90%;
            }
            .qrcode-wrapper {
              background: #ffffff !important; padding: 12px;
              border-radius: 12px; display: inline-block; margin-bottom: 16px;
            }
            .title {
              font-size: 18px; font-weight: 900; text-transform: uppercase;
              margin: 0 0 6px 0; line-height: 1.2;
            }
            .info-text {
              font-size: 10px; font-family: monospace; color: #444444;
              margin: 4px 0 0 0; text-transform: uppercase;
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </head>
        <body>
          <div class="print-label">
            <div class="qrcode-wrapper" id="qrcode-canvas"></div>
            <h4 class="title">${item.name}</h4>
            <p class="info-text">ID: ${item.id.slice(0, 8).toUpperCase()}</p>
            ${item.serialNumber ? `<p class="info-text">SN: ${item.serialNumber}</p>` : ''}
            ${item.sku ? `<p class="info-text">SKU: ${item.sku}</p>` : ''}
          </div>
  
          <script>
            new QRCode(document.getElementById("qrcode-canvas"), {
              text: "${qrCodeUrl}",
              width: 180,
              height: 180,
              colorDark : "#000000",
              colorLight : "#ffffff",
              correctLevel : QRCode.CorrectLevel.H
            });

            window.onload = function() {
              setTimeout(() => {
                window.focus();
                window.print();
                setTimeout(() => { window.frameElement.remove(); }, 500);
              }, 550);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const getCategory = (categoryId: string, categoriesList: any[]) => {
    const foundCategory = categoriesList.find(cat => cat.id === categoryId);
    return foundCategory ? foundCategory.name : "Categoria não encontrada";
  };
  
  const [categories, setCategories] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setSelectedViewItem(null), !!selectedViewItem);
  useEscapeKey(() => setSelectedPrintItem(null), !!selectedPrintItem);
  useEscapeKey(() => setMovingItem(null), !!movingItem);
  useEscapeKey(() => setContextMenu(null), !!contextMenu);
  useEscapeKey(exitSelectionMode, isSelectionMode);

  const toast = UseToast();

  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories/list');
        if (!res.ok) {
          toast.showError(`Erro ao carregar categorias (Status: ${res.status}).`);
          return;
        }
        const data = await res.json();
        if (res.ok && isMounted) {
          setCategories(data);
        }
      } catch (error) {
        toast.showError(`Erro na rota de listagem de categorias: ${error}.`);
      }
    }
    fetchCategories();
    return () => { isMounted = false; };
  }, [toast]);

  useEffect(() => {
    if (isViewer && fatherSpaces.length === 0 && actives.length === 0) {
      const testBackendPermissions = async () => {
        try {
          const [resSpaces, resActives] = await Promise.all([
            fetch('/api/father-spaces/list'),
            fetch('/api/actives/list')
          ]);

          if (!resSpaces.ok || !resActives.ok) {
            toast.showError(
              `Bloqueio detectado! A Listagem de espaços Pai retornou Status ${resSpaces.status} e a Listagem de Ativos retornou Status ${resActives.status}.`
            );
          }
        } catch {
          toast.showError("Falha crítica de comunicação com o servidor ao tentar validar as permissões.");
        }
      };

      testBackendPermissions();
    }
  }, [isViewer, fatherSpaces, actives, toast]);

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

    if (isMobile) return;
    if (isBaseCompletelyEmpty || hasNoResultsFromFilter) return;

    const menuWidth = 256; 
    const menuHeight = 280; 
    
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = x - menuWidth;
    if (y + menuHeight > window.innerHeight) y = y - menuHeight;

    setContextMenu({ x, y, item, isPhysicalSpace });
  };

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

    const addAllDescendants = (startParentId: string) => {
      const queue = [startParentId];
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = actives.filter(a => a.parentId === currentId);

        children.forEach(child => {
          if (!visibleActiveIds.has(child.id)) {
            visibleActiveIds.add(child.id);
            queue.push(child.id);
          }
        });
      }
    };

    actives.forEach(active => {
      if (matchesDirectly(active)) {
        visibleActiveIds.add(active.id);

        if (active.isPhysicalSpace) {
          addAllDescendants(active.id);
        }

        let currentParentId = active.parentId;
        while (currentParentId) {
          visibleActiveIds.add(currentParentId);
          const parent = actives.find(a => a.id === currentParentId);
          currentParentId = parent?.parentId ?? null;
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

  useEffect(() => {
    if (filteredData.hasFilters) {
      const newExpanded: Record<string, boolean> = {};
      
      filteredData.actives.forEach((item) => {
        const hasMatchingChildren = filteredData.actives.some(
          (child) => child.parentId === item.id
        );

        if (hasMatchingChildren) {
          newExpanded[item.id] = true;
        }
      });
      
      setExpandedNodes(newExpanded);
    } else {
      setExpandedNodes({});
    }
  }, [filters, filteredData.hasFilters, filteredData.actives]);

  // --- AÇÕES ---
  const handleMoveAction = async (targetSpaceId: string, targetParentId?: string) => {
    if (!movingItem) return;
    setIsMovingLoading(true);
  
    try {
      const isBatch = movingItem.isBatch;
      const payload = isBatch 
        ? { ids: Array.from(selectedItems), newFatherSpaceId: targetSpaceId, newParentId: targetParentId || null }
        : { id: movingItem.id, newFatherSpaceId: targetSpaceId, newParentId: targetParentId || null };
      
      const res = await fetch('/api/actives/move', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (res.ok) {
        onRefresh();
        setMovingItem(null);
        if (selectedViewItem) setSelectedViewItem(null);
        if (isBatch) exitSelectionMode();
        toast.showSuccess(isBatch ? `${selectedItems.size} ativo(s) movido(s) com sucesso.` : 'Ativo movido com sucesso.');
      } else {
        const errData = await res.json();
        toast.showError(errData.error || 'Erro ao mover o ativo.');
      }
    } catch {
      toast.showError('Não foi possível conectar ao servidor para mover o ativo.');
    } finally {
      setIsMovingLoading(false);
    }
  };

  const handleCloneClick = (item: any) => {
    onClone({ 
      ...item, 
      id: undefined, 
      serialNumber: "", 
      quantity: 1,
      fatherSpaceId: item.fatherSpaceId,
      parentId: item.parentId 
    });
    if (selectedViewItem) setSelectedViewItem(null);
  };

  const handleDelete = async (item: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir "${item.name}"? Esta ação é irreversível e o item será removido permanentemente do sistema.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/actives/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [item.id] })
          });
          
          if (res.ok) { 
            onRefresh(); 
            if (selectedViewItem) setSelectedViewItem(null);
            toast.showSuccess('Item excluído com sucesso.');
          } else {
            const errData = await res.json();
            toast.showError(errData.error || 'Erro ao excluir o item.');
          }
        } catch { 
          toast.showError('Erro de conexão ao tentar excluir o item.'); 
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBatchClone = async () => {
    if (selectedItems.size === 0) return;
  
    try {
      setIsCloning(true);
  
      // Converte a seleção do padrão ActiveForm (space:ID ou active:ID)
      let destSpaceId: string | undefined = undefined;
      if (cloneDestinationSpaceId) {
        const [id] = cloneDestinationSpaceId.split(":");
        // Envia destinationSpaceId se for selecionado um Espaço Pai ou Espaço Físico
        destSpaceId = id;
      }
  
      const response = await fetch('/api/actives/clone-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeIds: Array.from(selectedItems),
          quantity: cloneQuantity,
          destinationSpaceId: destSpaceId,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao clonar em lote');
      }
  
      toast.showSuccess(`${data.count} ativo(s) clonado(s) com sucesso!`);
      setIsCloneBatchOpen(false);
      exitSelectionMode();
      onRefresh();
  
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar clonagem';
      toast.showError(msg);
    } finally {
      setIsCloning(false);
    }
  };
  
  const handleBatchDelete = async () => {
    const count = selectedItems.size;
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmar Exclusão em Massa',
      message: `Tem certeza que deseja excluir ${count} ativo${count > 1 ? 's' : ''}? Esta ação é irreversível e todos os itens selecionados serão removidos permanentemente do sistema.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/actives/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: Array.from(selectedItems) })
          });
          
          if (res.ok) { 
            onRefresh(); 
            exitSelectionMode();
            toast.showSuccess(`${count} ativo${count > 1 ? 's' : ''} excluído${count > 1 ? 's' : ''} com sucesso.`);
          } else {
            const errData = await res.json();
            toast.showError(errData.error || 'Erro ao excluir os itens em lote.');
          }
        } catch { 
          toast.showError('Erro de conexão ao tentar excluir os itens.'); 
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const excludedMoveIds = useMemo(() => {
    if (!movingItem) return new Set<string>();
    const ids = new Set<string>([movingItem.id]);
    const queue = [movingItem.id];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      actives.forEach(a => {
        if (a.parentId === currentId) {
          ids.add(a.id);
          queue.push(a.id);
        }
      });
    }
    return ids;
  }, [movingItem, actives]);

  const renderMoveTree = (parentId: string | null, spaceId: string) => {
    const children = actives.filter(a => {
      if (excludedMoveIds.has(a.id)) return false;
      if (!a.isPhysicalSpace) return false;
      
      if (parentId === null) {
        return a.fatherSpaceId === spaceId && (!a.parentId || a.parentId === "");
      }
      return a.parentId === parentId;
    });

    if (children.length === 0) return null;

    return (
      <div className="space-y-1 w-full">
        {children.map(sub => {
          const isExpanded = moveExpanded[sub.id];
          const hasSubSpaces = actives.some(a => a.parentId === sub.id && a.isPhysicalSpace && !excludedMoveIds.has(a.id));
          
          return (
            <div key={sub.id} className="w-full flex flex-col">
              <div className="flex items-center p-0.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                <button 
                  onClick={() => handleMoveAction(spaceId, sub.id)} 
                  className="flex-1 flex items-center gap-3 p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all text-left min-w-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 uppercase truncate w-full">
                      {sub.name}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      Espaço Físico
                    </span>
                  </div>
                </button>

                {hasSubSpaces && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveExpanded(p => ({ ...p, [sub.id]: !p[sub.id] }));
                    }} 
                    className="p-3 mr-1 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all shrink-0"
                  >
                    <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="border-l dark:border-white/5 ml-5 pl-2 mt-1 space-y-1">
                  {renderMoveTree(sub.id, spaceId)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderActiveTree = (parentId: string | null, spaceId: string, level: number = 0) => {
    const children = filteredData.actives.filter(a => {
      const isTopLevel = !a.parentId || a.parentId === "";
      if (parentId === null) return isTopLevel && a.fatherSpaceId === spaceId;
      return a.parentId === parentId;
    });

    const hasChildren = children.length > 0;
    
    if (!hasChildren && level > 0) {
      const indentClass = level > 0 ? `ml-${level * 6} border-l-2 dark:border-white/5` : "";
      return (
        <div className={`flex flex-col items-center justify-center py-8 px-6 opacity-40 group-hover:opacity-60 transition-opacity ${indentClass}`}>
          <Ghost size={24} className="mb-2 text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
            {level === 0 ? "Nenhum ativo neste local" : "Este espaço físico está vazio"}
          </p>
        </div>
      );
    }

    if (!hasChildren && level === 0) {
      return null;
    }

    const indentClass = level > 0 ? `ml-${level * 4} border-l-2 dark:border-white/5 pl-2` : "";
    return (
      <div className={indentClass}>
        {children.map((active) => {
          const isExpanded = expandedNodes[active.id];
          const hasSubItems = actives.some(a => a.parentId === active.id);
          const categoryObj = categories.find(ar => ar.id === active.categoryId);
          const categoryName = categoryObj ? categoryObj.name : "Sem Categoria";

          const isSelected = selectedItems.has(active.id);
          
          const handleLongPressStart = (e: React.MouseEvent | React.TouchEvent) => {
            if (isSelectionMode) return;
            e.preventDefault();
            const timer = setTimeout(() => {
              activateSelectionMode(active.id);
              if (active.isPhysicalSpace) {
                const childIds = getAllChildIds(active.id);
                setSelectedItems(new Set([active.id, ...childIds]));
              }
              setLongPressItem(null);
            }, 1000);
            setLongPressTimer(timer);
            setLongPressItem(active.id);
          };
          
          const handleLongPressEnd = (_e?: React.MouseEvent | React.TouchEvent) => {
            void _e;
            if (longPressTimer) {
              clearTimeout(longPressTimer);
              setLongPressTimer(null);
            }
            setLongPressItem(null);
          };
          
          const getAllChildIds = (parentId: string): string[] => {
            const children = actives.filter(a => a.parentId === parentId);
            let ids: string[] = [];
            children.forEach(child => {
              ids.push(child.id);
              if (child.isPhysicalSpace) {
                ids = [...ids, ...getAllChildIds(child.id)];
              }
            });
            return ids;
          };
          
          const handleCheckboxChange = (checked: boolean) => {
            const childIds = active.isPhysicalSpace ? getAllChildIds(active.id) : [];
          
            setSelectedItems(prev => {
              const next = new Set(prev);
          
              if (checked) {
                next.add(active.id);
                childIds.forEach(id => next.add(id));
              } else {
                next.delete(active.id);
                childIds.forEach(id => next.delete(id));
              }
          
              return next;
            });
          };
          
          return (
            <div key={active.id} className={`animate-in slide-in-from-left-2 duration-300 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
              <div 
                onContextMenu={(e) => handleContextMenu(e, active, active.isPhysicalSpace)}
                onClick={() => {
                  const childCount = actives.filter(a => a.parentId === active.id && !a.isPhysicalSpace).length;
                  const subSpaceCount = actives.filter(a => a.parentId === active.id && a.isPhysicalSpace).length;
                  if (isSelectionMode) {
                    handleCheckboxChange(!isSelected);
                  } else {
                    setSelectedViewItem({ ...active, hasSubItems, childCount, subSpaceCount });
                  }
                }}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
                className={`group flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer border-b last:border-0 dark:border-white/5 transition-all duration-300 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${longPressItem === active.id ? 'bg-blue-100 dark:bg-blue-900/30 scale-[0.99]' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {isSelectionMode && (
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); handleCheckboxChange(e.target.checked); }}
                      className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      if (hasSubItems || active.isPhysicalSpace) {
                        setExpandedNodes(p => ({ ...p, [active.id]: !p[active.id] }));
                      } else if (!hasSubItems || !active.isPhysicalSpace) {
                        const childCount = actives.filter(a => a.parentId === active.id && !a.isPhysicalSpace).length;
                        const subSpaceCount = actives.filter(a => a.parentId === active.id && a.isPhysicalSpace).length;
                        setSelectedViewItem({ ...active, hasSubItems, childCount, subSpaceCount});
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
                      
                      {categoryObj && (
                        <p 
                          className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border mr-0.5"
                          style={{ 
                            color: getCategoryColor(active.categoryId), 
                            backgroundColor: `${categoryObj.color}15`, 
                            borderColor: `${categoryObj.color}40`,
                          }}
                        >
                          {categoryName}
                        </p>
                      )}

                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center">
                        { active.sku && <span className="ml-1 flex"><Hash size={10}/> SKU: {active.sku}</span> } { active.serialNumber && <span className="ml-1 text-blue-400 flex">{active.sku ? "•" : <Hash size={10}/> } SN: {active.serialNumber}</span> }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 text-right pr-2 ${!active.isPhysicalSpace && "mr-8"}`}>
                    {!isViewer &&
                      <div className="hidden sm:block">
                        <p className="text-[9px] font-black text-emerald-500/80 uppercase">Valor</p>
                        <p className="text-xs font-black dark:text-white tracking-tighter">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(active.fixedValue || 0)}
                        </p>
                      </div>
                    }
                    {active.isPhysicalSpace &&
                      <ChevronRight size={16} className={`text-gray-300 opacity-50 group-hover:opacity-100 group-hover:text-blue-500 group-hover:translate-x-1 transition-all ${isExpanded && "rotate-90"}`} />
                    }
                </div>
              </div>

              {isExpanded && renderActiveTree(active.id, spaceId, level + 1)}
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
                    {hasActives ? renderActiveTree(null, space.id) : (
                      <div className="flex flex-col items-center justify-center py-8 px-6 opacity-40">
                        <Ghost size={24} className="mb-2 text-zinc-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">
                          Nenhum ativo neste local
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </>
          )}
        </div>
      </div>

      {/* --- MODAL DETALHES --- */}
      {selectedViewItem && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02] shrink-0">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${getItemColors(selectedViewItem.isPhysicalSpace, selectedViewItem.hasSubItems).bg} ${getItemColors(selectedViewItem.isPhysicalSpace, selectedViewItem.hasSubItems).text}`}>
                    {selectedViewItem.isPhysicalSpace ? <Layers size={24}/> : <Box size={24}/>}
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
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-6">
                  <div className="w-full h-48 sm:h-64 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border dark:border-white/5 overflow-hidden flex items-center justify-center relative group">
                    {selectedViewItem.imageUrl ? (
                      <Image
                        src={toLocalMediaUrl(selectedViewItem.imageUrl)}
                        alt={selectedViewItem.name}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-300 dark:text-zinc-700">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={<Barcode size={16} />} label="SKU" Class="font-mono truncate" value={selectedViewItem.sku || "N/A"} />
                    <InfoItem icon={<Hash size={16} />} label="Nº Série" Class="font-mono truncate" value={selectedViewItem.serialNumber || "N/A"} />
                    <InfoItem icon={<MapPin size={16} />} label="Localização" Class="truncate" value={selectedViewItem.parentId ? actives.find(a => a.id === selectedViewItem.parentId)?.name || selectedViewItem.fatherSpace?.name : fatherSpaces.find(s => s.id === selectedViewItem.fatherSpaceId)?.name} />
                    <InfoItem icon={<Barcode size={16} />} label="ID do Sistema" Class="font-mono text-[10px] truncate" value={selectedViewItem.id} />
                    <InfoItem icon={<Factory size={16} />} label="Fabricante" Class="font-mono text-[10px] truncate" value={selectedViewItem.manufacturer || "Genérico"} />
                    {selectedViewItem.model && (
                      <InfoItem icon={<Cpu size={16} />} label="Modelo" Class="font-mono text-[10px] truncate" value={selectedViewItem.model} />
                    )}
                    <InfoItem icon={<Tag size={16} />} label="Categoria" Class="truncate" value={getCategory(selectedViewItem.categoryId, categories)} />
                    {(selectedViewItem.isPhysicalSpace || selectedViewItem.hasSubItems) && (
                      <>
                        <InfoItem icon={<Boxes size={16}/>} label="Ativos" Class="truncate" value={`${selectedViewItem.childCount || 0}`} />
                        <InfoItem icon={<Layers size={16}/>} label="Espaços Físicos" Class="truncate" value={`${selectedViewItem.subSpaceCount || 0}`} />
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t dark:border-white/5">
                    <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                      Documentos & Anexos
                    </h4>
                    
                    {(() => {
                      const filesArray = typeof selectedViewItem.fileUrl === 'string'
                        ? selectedViewItem.fileUrl.split(',').map((url: string) => url.trim()).filter(Boolean)
                        : Array.isArray(selectedViewItem.fileUrl)
                          ? selectedViewItem.fileUrl.filter(Boolean)
                          : [];

                      return filesArray.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filesArray.map((url: string, index: number) => {
                            const { displayName, extension, Icon, colorClass, bgClass } = getFileDetails(url);
                            
                            return (
                              <a 
                                key={index}
                                href={toLocalMediaUrl(url)}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center gap-3 border rounded-xl p-3 transition-all hover:scale-[1.01] active:scale-[0.99] ${bgClass}`}
                              >
                                <div className={`p-2 bg-white dark:bg-zinc-950 rounded-lg shadow-sm ${colorClass}`}>
                                  <Icon size={18} />
                                </div>
                                
                                <div className="flex flex-col flex-1 overflow-hidden">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate hover:underline" title={displayName}>
                                    {displayName}
                                  </span>
                                  {extension !== 'link' && (
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${colorClass}`}>
                                      .{extension}
                                    </span>
                                  )}
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 italic pl-1">
                          Nenhum documento anexado a este ativo.
                        </p>
                      );
                    })()}
                  </div>
              </div>

              <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                {selectedViewItem.isPhysicalSpace && (
                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border dark:border-white/5">
                      <div className="bg-white p-3 rounded-2xl shadow-md mb-4 border border-zinc-100">
                        <QRCode value={`${window.location.origin}/qrcode/view?id=${selectedViewItem.id}`} size={160} />
                      </div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-4 text-center">QR Code</p>
                      
                      <button 
                        onClick={() => executeIframePrint(selectedViewItem)}
                        className="w-full py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors"
                      >
                        <Printer size={14}/> Imprimir Etiqueta
                      </button>
                  </div>
                )}

                <div className="flex flex-col p-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border dark:border-white/5 flex-1 min-h-[160px]">
                  <div className="flex items-center gap-2 mb-3 text-gray-400 dark:text-zinc-500">
                    <FileText size={14} />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">
                      Notas
                    </h4>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed overflow-y-auto custom-scrollbar flex-1 w-full whitespace-pre-wrap md:max-h-none">
                    {selectedViewItem.notes ? (
                      selectedViewItem.notes
                    ) : (
                      <p className="italic text-zinc-400 dark:text-zinc-500 font-medium pl-1">
                        Nenhuma observação registrada para este ativo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t dark:border-white/5 bg-white dark:bg-zinc-900 shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar">
               <button onClick={() => { setSelectedViewItem(false); onEdit(selectedViewItem, 'edit'); }} className="flex-1 sm:flex-none px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                 <Pencil size={16}/> <span className="hidden sm:inline">Editar</span>
               </button>

               <button onClick={() => {setMovingItem(selectedViewItem); setSelectedViewItem(false);}} className="flex-1 sm:flex-none px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                  <Move size={16}/> <span className="hidden sm:inline">Mover</span>
               </button>

               <button onClick={() => {handleCloneClick(selectedViewItem); setSelectedViewItem(false);}} className="flex-1 sm:flex-none px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                  <Copy size={16}/> <span className="hidden sm:inline">Clonar</span>
               </button>

               <div className="hidden sm:block flex-1"></div>

               <button onClick={() => {handleDelete(selectedViewItem); setSelectedViewItem(false);}} className="flex-1 sm:flex-none px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                 <Trash2 size={16}/> <span className="hidden sm:inline">Excluir</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE IMPRESSÃO --- */}
      {selectedPrintItem && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md print:relative print:w-full print:h-auto print:bg-white print:z-[9999] print:p-0 print:backdrop-blur-none">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] border dark:border-white/10 overflow-hidden shadow-2xl p-6 print:w-full print:max-w-none print:border-none print:shadow-none print:rounded-none print:p-0" id="qrcode-print-container">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h3 className="font-black uppercase text-sm dark:text-white">Imprimir Etiqueta</h3>
                <button onClick={() => setSelectedPrintItem(null)} className="text-zinc-400 hover:text-red-500 transition-colors">
                  <X size={20}/>
                </button>
              </div>

              <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700 print:border-2 print:border-black print:rounded-lg print:m-4 print:p-4 text-black" id="qrcode-print-label">
                <div className="bg-white p-3">
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

              <button 
                onClick={() => executeIframePrint(selectedPrintItem)}
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
                    const hasTopLevelActives = actives.some(a => 
                      a.fatherSpaceId === space.id && 
                      a.isPhysicalSpace && 
                      (!a.parentId || a.parentId === "") &&
                      !excludedMoveIds.has(a.id)
                    );

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

                                {hasTopLevelActives && (
                                  <button 
                                    onClick={() => setMoveExpanded(p => ({ ...p, [space.id]: !p[space.id] }))} 
                                    className="p-4 mr-1 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                                  >
                                    <ChevronRight size={18} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  </button>
                                )}
                            </div>

                            {isExpanded && hasTopLevelActives && (
                                <div className="border-t dark:border-white/5 p-2 space-y-1 bg-white dark:bg-zinc-900 pl-4">
                                    {renderMoveTree(null, space.id)}
                                </div>
                            )}
                        </div>
                    )
                })}
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL DE CLONAGEM EM LOTE --- */}
      {isCloneBatchOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            
            <div className="flex items-center justify-between border-b dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                  <Copy size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-white">Clonar Ativos</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">{selectedItems.size} ativo(s) selecionado(s)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCloneBatchOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5">
                Quantidade de cópias por ativo
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={cloneQuantity}
                onChange={(e) => setCloneQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[12px] text-zinc-400 mt-1 block">
                Total a ser criado: <strong>{selectedItems.size * cloneQuantity} novos ativos</strong>.
              </span>
            </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1.5">
                  Localização
                </label>
                <SearchableSelect 
                  options={cloneLocationOptions}
                  value={cloneDestinationSpaceId}
                  onChange={(id: string) => setCloneDestinationSpaceId(id)}
                  placeholder="Selecione o espaço de destino..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsCloneBatchOpen(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCloning}
                onClick={handleBatchClone}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {isCloning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Clonando...
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Confirmar Clonagem
                  </>
                )}
              </button>
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
           <ContextBtn icon={<Eye size={16}/>} label="Visualizar Detalhes" onClick={() => {
                const childCount = actives.filter(a => a.parentId === contextMenu.item.id && !a.isPhysicalSpace).length;
                const subSpaceCount = actives.filter(a => a.parentId === contextMenu.item.id && a.isPhysicalSpace).length;
                setSelectedViewItem({ ...contextMenu.item, hasSubItems: actives.some(a => a.parentId === contextMenu.item.id), childCount, subSpaceCount });
              }} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Pencil size={16}/>} label="Editar Ativo" onClick={() => onEdit(contextMenu.item, 'edit')} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Move size={16}/>} label="Mover para outro local" onClick={() => setMovingItem(contextMenu.item)} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Copy size={16}/>} label="Clonar Ativo" onClick={() => handleCloneClick(contextMenu.item)} onClose={() => setContextMenu(null)} />
          <ContextBtn icon={<Printer size={16}/>} label="Imprimir Etiqueta" onClick={() => setSelectedPrintItem(contextMenu.item)} onClose={() => setContextMenu(null)} />
          <div className="mt-1 pt-1 border-t dark:border-white/5">
            <ContextBtn icon={<Trash2 size={16}/>} label="Remover Registro" onClick={() => handleDelete(contextMenu.item)} danger onClose={() => setContextMenu(null)} />
          </div>
        </div>
      )}

      {/* --- BARRA INFERIOR (DESKTOP) / CONTEXTMENU SELETOR MÚLTIPLO (MOBILE) --- */}
      {isSelectionMode && selectedItems.size > 0 && (
        isMobile ? (
          <div 
            className="fixed z-[600] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border dark:border-white/10 shadow-2xl rounded-[1.5rem] py-2 w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="px-4 py-2 border-b dark:border-white/5">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Seleção Múltipla</p>
              <p className="text-[10px] font-black dark:text-white">{selectedItems.size} ativo{selectedItems.size > 1 ? 's' : ''} selecionado{selectedItems.size > 1 ? 's' : ''}</p>
            </div>
            <button 
              onClick={() => {
                setMovingItem({ 
                  id: Array.from(selectedItems)[0], 
                  name: `${selectedItems.size} ativos`,
                  isBatch: true 
                });
              }} 
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase text-gray-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white"
            >
              <Move size={16} /> Mover Ativo{selectedItems.size > 1 && "s"}
            </button>
            <button
              onClick={() => setIsCloneBatchOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <Copy size={16} /> Clonar Ativo{selectedItems.size > 1 && "s"}
            </button>
            <div className="mt-1 pt-1 border-t dark:border-white/5">
              <button 
                onClick={() => handleBatchDelete()} 
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 size={16} /> Deletar Ativo{selectedItems.size > 1 && "s"}
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 z-[500] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border-t dark:border-white/10 shadow-2xl p-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <p className="text-sm font-black text-gray-600 dark:text-zinc-400">
                  <span className="text-blue-600 dark:text-blue-400">{selectedItems.size}</span> ativo{selectedItems.size > 1 ? 's' : ''} selecionado{selectedItems.size > 1 ? 's' : ''}
                </p>
                <button 
                  onClick={exitSelectionMode}
                  className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  Cancelar
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsCloneBatchOpen(true)}
                  className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl font-black uppercase text-[10px] flex items-center gap-2"
                >
                  <Copy size={16} /> Clonar em Lote
                </button>
                <button 
                  onClick={() => {
                    setMovingItem({ 
                      id: Array.from(selectedItems)[0], 
                      name: `${selectedItems.size} ativos`,
                      isBatch: true 
                    });
                  }}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl font-black uppercase text-[10px] flex items-center gap-2"
                >
                  <Move size={16} /> Mover Ativos
                </button>
                <button 
                  onClick={() => handleBatchDelete()}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-black uppercase text-[10px] flex items-center gap-2"
                >
                  <Trash2 size={16} /> Deletar Ativos
                </button>
              </div>
            </div>
          </div>
        )
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel="Excluir"
        cancelLabel="Manter"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
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

export default memo(ListSection);