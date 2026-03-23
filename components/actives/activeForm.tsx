// components/actives/activeForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { X, Copy, Pencil, CirclePlus, ChevronDown, MapPin, Briefcase, Hash, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import ImageUpload from "@/components/imageUpload";
import FileUpload from "@/components/FileUpload";

export default function ActiveForm({ mode, initialData, onClose, fatherSpace, activeContainers }: any) {
  const router = useRouter();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  
  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    isPhysicalSpace: false,
    name: "",
    areaId: "" as string,
    sku: "",
    manufacturer: "",
    model: "",
    serialNumbers: [""] as string[],
    fixedValue: 0,
    quantity: 1,
    tag: "IN-STOCK",
    notes: "",
    imageUrl: null as string | null,
    fileUrl: null as string | null,
    locationId: "", 
    locationType: "" as "space" | "active" | "", 
  });

  const tags = ["IN-STOCK", "IN-USE"];

  // Busca as Áreas do Banco
  useEffect(() => {
    async function fetchAreas() {
      try {
        const res = await fetch('/api/areas/list');
        const data = await res.json();
        if (res.ok) {
          setAreas(data);
          if (mode === 'create' && data.length > 0 && !formData.areaId) {
            setFormData(prev => ({ ...prev, areaId: data[0].id }));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar áreas:", err);
      } finally {
        setLoadingAreas(false);
      }
    }
    fetchAreas();
  }, [mode, formData.areaId]);

  useEffect(() => {
    if (initialData) {
      const locId = initialData.fatherSpaceId || initialData.parentId || "";
      const locType = initialData.fatherSpaceId ? "space" : (initialData.parentId ? "active" : "");

      setFormData({
        ...initialData,
        areaId: initialData.areaId || "",
        isPhysicalSpace: initialData.isPhysicalSpace ?? false,
        locationId: locId,
        locationType: locType,
        id: mode === "clone" ? undefined : initialData.id,
        serialNumbers: mode === "clone" 
          ? Array(initialData.quantity || 1).fill("") 
          : [initialData.serialNumber || ""],
      });
    }
  }, [initialData, mode]);

  // Lógica de Grid Adaptável
  const gridConfig = useMemo(() => {
    const len = areas.length;
    if (len === 0) return "grid-cols-1";
    if (len <= 4) return `grid-cols-${len}`;
    return "grid-cols-2 sm:grid-cols-4 justify-center"; 
  }, [areas]);

  function SearchableSelect({ options, value, onChange, placeholder }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const selectedOption = options.find((opt: any) => opt.id === value);
    const filteredOptions = options.filter((opt: any) => opt.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="relative">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold text-sm h-[52px] dark:text-white border-2 border-transparent focus:border-blue-600/30 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2 overflow-hidden">
            {selectedOption ? (
              <>
                <span className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase ${selectedOption.type === 'space' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'}`}>{selectedOption.type === 'space' ? 'PAI' : 'FÍSICO'}</span>
                <span className="truncate">{selectedOption.name}</span>
              </>
            ) : <span className="text-gray-400">{placeholder}</span>}
          </div>
          <ChevronDown className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={16} />
        </button>
        {isOpen && (
          <div className="absolute z-[600] w-full mt-2 bg-white dark:bg-zinc-900 border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b dark:border-white/5 flex items-center gap-2">
              <Search size={14} className="text-gray-400 ml-2" />
              <input autoFocus className="w-full bg-transparent p-2 text-xs font-bold outline-none dark:text-white" placeholder="Filtrar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? filteredOptions.map((opt: any) => (
                <button key={opt.id} type="button" onClick={() => { onChange(opt.id, opt.type); setIsOpen(false); setSearchTerm(""); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-600/10 transition-colors flex items-center gap-3 border-b last:border-none dark:border-white/5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${opt.type === 'space' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold dark:text-zinc-200">{opt.name}</span>
                    <span className="text-[8px] uppercase font-black text-gray-400">{opt.type === 'space' ? 'Espaço Pai' : 'Espaço Físico'}</span>
                  </div>
                </button>
              )) : <div className="p-4 text-center text-[10px] font-black text-gray-400 uppercase">Nenhum local encontrado</div>}
            </div>
          </div>
        )}
        {isOpen && <div className="fixed inset-0 z-[590]" onClick={() => setIsOpen(false)} />}
      </div>
    );
  }

  const handleQuantityChange = (val: number) => {
    const newQty = Math.max(1, val);
    setFormData(prev => {
      const newSerials = [...prev.serialNumbers];
      if (newQty > prev.serialNumbers.length) {
        for (let i = prev.serialNumbers.length; i < newQty; i++) newSerials.push("");
      } else {
        newSerials.splice(newQty);
      }
      return { ...prev, quantity: newQty, serialNumbers: newSerials };
    });
  };

  const handleSerialUpdate = (index: number, value: string) => {
    const updatedSerials = [...formData.serialNumbers];
    updatedSerials[index] = value;
    setFormData({ ...formData, serialNumbers: updatedSerials });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...formData, 
      serialNumbers: formData.serialNumbers, 
      isPhysicalSpace: !!formData.isPhysicalSpace,
      fatherSpaceId: formData.locationType === "space" ? formData.locationId : null,
      parentId: formData.locationType === "active" ? formData.locationId : null
    };
    try {
      const isEdit = mode === "edit";
      const url = isEdit ? `/api/actives/update` : `/api/actives/create`;
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Erro na operação");
      onClose();
    } catch (error: any) { alert("ERRO: " + error.message); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border dark:border-white/10">
        
        {/* HEADER */}
        <div className="p-6 border-b dark:border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white shadow-lg ${mode === 'clone' ? 'bg-amber-500 shadow-amber-500/20' : mode === 'edit' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
              {mode === "create" ? <CirclePlus size={18} /> : mode === "edit" ? <Pencil size={18} /> : <Copy size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-tighter dark:text-white">
                {mode === "create" ? "Novo" : mode === "edit" ? "Editar" : "Clonar"} {formData.isPhysicalSpace ? 'Espaço Físico' : 'Ativo'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {mode === "create" && (
            <div className="flex bg-gray-100 dark:bg-zinc-950 p-1.5 rounded-2xl border dark:border-white/5 shadow-inner">
              <button type="button" onClick={() => setFormData(p => ({ ...p, isPhysicalSpace: false }))} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${!formData.isPhysicalSpace ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-md border dark:border-white/10" : "text-gray-400 dark:text-zinc-600"}`}><Briefcase size={14} /> Ativo</button>
              <button type="button" onClick={() => setFormData(p => ({ ...p, isPhysicalSpace: true }))} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${formData.isPhysicalSpace ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-md border dark:border-white/10" : "text-gray-400 dark:text-zinc-600"}`}><MapPin size={14} /> Espaço Físico</button>
            </div>
          )}

          {/* AREA DE FOCO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 block tracking-widest">Área de Foco</label>
              <button 
                type="button" 
                onClick={() => router.push("/settings?tab=areas")}
                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/10 rounded-lg transition-all"
              >
                <Pencil size={12} />
              </button>
            </div>

            {loadingAreas ? (
               <div className="flex items-center gap-2 py-4 px-2 text-zinc-500 text-[10px] font-bold italic uppercase"><Loader2 className="animate-spin" size={12}/> Carregando áreas...</div>
            ) : (
              <div className={`grid gap-2 ${gridConfig}`}>
                {areas.map((area) => {
                  const isSelected = formData.areaId === area.id;
                  const color = area.color || '#2563eb';
                  
                  return (
                    <button 
                      key={area.id} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, areaId: area.id })} 
                      style={isSelected ? { 
                        borderColor: color, 
                        backgroundColor: `${color}15`, 
                        color: color 
                      } : {}}
                      className={`w-full py-3.5 rounded-2xl text-[9px] font-black transition-all border-2 text-center uppercase tracking-tighter ${!isSelected ? "border-transparent bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800" : ""}`}
                    >
                      {area.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 block">Nome do Registro</label>
              <input required className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold border-2 border-transparent focus:border-blue-600/30 text-sm dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="relative">
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 block">Status Atual</label>
              <button type="button" onClick={() => setIsStatusOpen(!isStatusOpen)} className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold text-sm h-[52px] dark:text-white border-2 border-transparent focus:border-blue-600/30 flex items-center justify-between transition-all">
                <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.tag === 'IN-STOCK' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {formData.tag === "IN-STOCK" ? "Em Estoque" : "Em Uso"}
                </span>
                <ChevronDown className={`shrink-0 transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} size={16} />
              </button>
              {isStatusOpen && (
                <>
                  <div className="absolute z-[600] w-full mt-2 bg-white dark:bg-zinc-900 border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                      {tags.map((tag) => (
                        <button key={tag} type="button" onClick={() => { setFormData({ ...formData, tag: tag }); setIsStatusOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 mb-1 last:mb-0 ${formData.tag === tag ? "bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-white/5 dark:text-zinc-200"}`}>
                          <div className={`w-2 h-2 rounded-full ${tag === 'IN-STOCK' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-sm font-bold">{tag === "IN-STOCK" ? "Em Estoque" : "Em Uso"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="fixed inset-0 z-[590]" onClick={() => setIsStatusOpen(false)} />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 block">Localização</label>
              <SearchableSelect 
                options={[
                  ...(fatherSpace || []).map((s: any) => ({ id: s.id, name: s.name, type: "space" })),
                  ...(activeContainers || []).map((c: any) => ({ id: c.id, name: c.name, type: "active" }))
                ]}
                value={formData.locationId}
                onChange={(id: string, type: any) => setFormData({ ...formData, locationId: id, locationType: type })}
                placeholder="Selecione local..."
              />
            </div>
            <div className={`grid ${mode === 'edit' ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 block">Vlr. Unitário</label>
                <input type="number" className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl font-bold text-sm dark:text-white outline-none border-2 border-transparent focus:border-blue-600/30" value={formData.fixedValue} onChange={e => setFormData({...formData, fixedValue: parseFloat(e.target.value) || 0})} />
              </div>
              {mode !== "edit" && (
                <div>
                  <label className="text-[10px] font-black uppercase text-blue-600 ml-1 mb-1 block">Quantidade</label>
                  <input type="number" className="w-full bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl font-black text-blue-600 dark:text-blue-400 border-2 border-blue-600/20 text-sm outline-none focus:border-blue-600" value={formData.quantity} onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t dark:border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 block">Fabricante</label>
                  <input className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl font-bold text-sm dark:text-white outline-none border-2 border-transparent focus:border-blue-600/30" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 block">Modelo</label>
                  <input className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl font-bold text-sm dark:text-white outline-none border-2 border-transparent focus:border-blue-600/30" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 flex items-center gap-2">
                  <Hash size={12} /> {mode === "edit" ? "Número de Série" : `Números de Série (${formData.quantity})`}
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-zinc-950/50 rounded-2xl border dark:border-white/5 p-2">
                  {formData.serialNumbers.map((sn, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {mode !== "edit" && <span className="text-[9px] font-black text-zinc-400 w-4">#{idx + 1}</span>}
                      <input className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-lg font-mono uppercase placeholder:normal-case text-xs border border-transparent focus:border-blue-600/30 outline-none dark:text-white shadow-sm" placeholder="Insira o serial..." value={sn} onChange={e => handleSerialUpdate(idx, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <ImageUpload value={formData.imageUrl} onChange={(url) => setFormData({...formData, imageUrl: url})} label="Foto do Ativo" />
            <FileUpload value={formData.fileUrl} onChange={(url) => setFormData({...formData, fileUrl: url})} label="Documento" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 ml-1 mb-1 block">Observações Adicionais</label>
            <textarea className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold h-24 resize-none text-sm dark:text-white border-2 border-transparent focus:border-blue-600/30" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
        </form>

        <div className="p-6 border-t dark:border-white/5 shrink-0 bg-white dark:bg-zinc-900">
          <button type="submit" onClick={handleSubmit} className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all ${mode === 'clone' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : mode === 'edit' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'} text-white`}>
            {mode === "clone" ? <Copy size={18} /> : mode === "edit" ? <Pencil size={18} /> : <CirclePlus size={18} />}
            {mode === "clone" ? "Gerar Clones" : mode === "edit" ? "Salvar Alterações" : "Confirmar Cadastro"}
          </button>
        </div>
      </div>
    </div>
  );
}