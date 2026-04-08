// components/SearchSection.tsx
import React from "react";
import { Search, Factory, Cpu, LayoutGrid, ChevronDown, Trash } from "lucide-react";

interface SearchFilters {
  query: string;
  searchCategory: string;
  manufacturer: string;
  model: string;
  category: string;
  tag: string;
}

interface SearchSectionProps {
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
}

export default function SearchSection({ filters, setFilters }: SearchSectionProps) {
  
  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-5">
      
      {/* Linha Principal: Busca Global e Área */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            className="w-full bg-gray-50 dark:bg-zinc-950 p-4 pl-12 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-600/20 dark:text-white transition-all"
            placeholder="Buscar por nome, SKU ou SN..."
            value={filters.query}
            onChange={(e) => handleInputChange("query", e.target.value)}
          />
        </div>

        <div className="relative">
          <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            className="w-full bg-gray-50 dark:bg-zinc-950 p-4 pl-12 rounded-2xl outline-none font-bold text-sm appearance-none dark:text-white cursor-pointer border-2 border-transparent focus:border-blue-600/20"
            value={filters.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
          >
            <option value="" disabled>Selecione</option>
            <option value="ENERGETICA">Energética</option>
            <option value="REDES">Redes</option>
            <option value="SERVIDOR">Servidor</option>
            <option value="MANUTENCAO">Manutenção</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Fabricante e Modelo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative group">
          <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            className="w-full bg-gray-50 dark:bg-zinc-950 p-4 pl-12 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-600/20 dark:text-white transition-all"
            placeholder="Fabricante"
            value={filters.manufacturer}
            onChange={(e) => handleInputChange("manufacturer", e.target.value)}
          />
        </div>

        <div className="relative group">
          <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            className="w-full bg-gray-50 dark:bg-zinc-950 p-4 pl-12 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-600/20 dark:text-white transition-all"
            placeholder="Modelo ou Série"
            value={filters.model}
            onChange={(e) => handleInputChange("model", e.target.value)}
          />
        </div>
      </div>

      {/* Indicador de Filtros Ativos (Opcional - Visual) */}
      {(filters.query || filters.category || filters.manufacturer || filters.model) && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-600/10 px-3 py-1 rounded-full">
            Filtros Ativos
          </span>
          <button 
            onClick={() => setFilters({ query: "", searchCategory: "", manufacturer: "", model: "", category: "", tag: "" })}
            className="text-[9px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors flex"
          >
            <div className="mr-1"><Trash size={10} /></div>
            Limpar Tudo
          </button>
        </div>
      )}
    </div>
  );
}