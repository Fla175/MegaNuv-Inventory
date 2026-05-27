// components/SearchSection.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Search, Factory, Cpu, Trash } from "lucide-react";
import CustomSelect from "./customSelect";
import { UseToast } from "@/lib/context/ToastContext";

interface Category {
  id: string;
  name: string;
  color?: string;
}

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
  const [categories, setCategories] = useState<Category[]>([]);
  const toast = UseToast();
  
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories/list');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch {
        toast.showError("Erro na listagem de categorias.");
      }
    }
    fetchCategories();
  }, [toast]);
  
  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const categoriesOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      indicatorColor: cat.color, 
    }));
  }, [categories]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-5">

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
          <CustomSelect 
            options={categoriesOptions} 
            value={filters.category} 
            onChange={(val) => handleInputChange("category", val)} 
            placeholder="Todas as Categorias" 
          />
        </div>
      </div>

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