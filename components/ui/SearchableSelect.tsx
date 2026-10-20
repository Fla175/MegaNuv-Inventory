// components/ui/SearchableSelect.tsx
import React, { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  countDescendants,
  filterOptions,
  getDirectChildren,
  getOptionKind,
  getRootOptions,
  type OptionKind,
  type SearchableSelectOption,
} from "@/lib/searchableSelect";

export type { SearchableSelectOption };

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  /** Recebe o `type` da opção escolhida — o sentinela se identifica como `default`. */
  onChange: (id: string, type?: string) => void;
  placeholder?: string;
  /**
   * Aparência herdada de cada superfície que usava uma cópia própria.
   *
   * `list`  — diálogo de clonagem (`ListSection`): compacto, acento âmbar.
   * `form`  — formulário de ativo (`activeForm`): maior, borda azul.
   *
   * A variante muda **apenas classes**; a lógica de árvore, busca e semântica
   * de tipo é uma só (`lib/searchableSelect.ts`). A divergência visual é
   * deliberada e localizada, não uma segunda implementação.
   */
  variant?: "list" | "form";
}

type SelectVariant = NonNullable<SearchableSelectProps["variant"]>;

const VARIANTS: Record<
  SelectVariant,
  {
    button: string;
    panel: string;
    searchRow: string;
    searchIcon: string;
    searchPlaceholder: string;
    maxHeight: string;
    rowBorder: string;
    rootBorder: string;
    treeLabel: string;
    searchHover: string;
    emptyText: string;
    overlay: string;
    selectedRing: string;
    indent: (depth: number) => string;
  }
> = {
  list: {
    button:
      "w-full bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold text-xs h-[52px] text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-amber-500 flex items-center justify-between transition-all",
    panel:
      "absolute z-[1000] w-full mt-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden",
    searchRow: "p-2 border-b dark:border-zinc-800 flex items-center gap-2",
    searchIcon: "text-zinc-400",
    searchPlaceholder: "Filtrar local...",
    maxHeight: "max-h-60",
    rowBorder: "border-b dark:border-white/5",
    rootBorder: "border-b dark:border-zinc-800",
    treeLabel:
      "text-[8px] uppercase font-black text-gray-400 tracking-wider truncate",
    searchHover: "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
    emptyText: "text-zinc-400",
    overlay: "fixed inset-0 z-[990]",
    selectedRing: "border-b dark:border-zinc-800",
    indent: (depth) =>
      depth > 0 ? "ml-8 border-l-2 dark:border-white/5 pl-4" : "",
  },
  form: {
    button:
      "w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold text-sm h-[52px] dark:text-white border-2 border-transparent focus:border-blue-600/30 flex items-center justify-between transition-all",
    panel:
      "absolute z-[600] w-full mt-2 bg-white dark:bg-zinc-900 border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden",
    searchRow: "p-2 border-b dark:border-white/5 flex items-center gap-2",
    searchIcon: "text-gray-400",
    searchPlaceholder: "Filtrar por nome...",
    maxHeight: "max-h-72",
    rowBorder: "border-b dark:border-white/5",
    rootBorder: "border-b dark:border-white/5",
    treeLabel:
      "text-[8px] uppercase font-black text-gray-400 tracking-wider truncate",
    searchHover: "hover:bg-blue-50 dark:hover:bg-blue-600/10",
    emptyText: "text-gray-400",
    overlay: "fixed inset-0 z-[590]",
    selectedRing: "border-b dark:border-white/5",
    indent: (depth) =>
      depth > 0 ? "ml-4 border-l-2 dark:border-white/5 pl-2" : "",
  },
};

/**
 * Acento de cada categoria. O sentinela é **neutro** — pintá-lo de azul, como
 * a cópia do `ListSection` fazia, sugeria que "Manter no espaço original" era
 * um espaço. A reconciliação da Etapa 2 (ADR-001) escolheu o contrário: um
 * sentinela não é local e não se veste de local.
 */
const ACCENTS: Record<
  OptionKind,
  {
    dot: string;
    hover: string;
    expandHover: string;
    chevron: string;
    badge: string;
    count: string;
  }
> = {
  space: {
    dot: "bg-blue-500",
    hover: "hover:bg-blue-50/50 dark:hover:bg-blue-600/5",
    expandHover: "hover:bg-blue-100 dark:hover:bg-blue-900/40",
    chevron: "text-blue-500",
    badge: "bg-blue-100 text-blue-600 dark:bg-blue-900/40",
    count: "text-blue-500 bg-blue-50 dark:bg-blue-900/30",
  },
  active: {
    dot: "bg-emerald-500",
    hover: "hover:bg-emerald-50/50 dark:hover:bg-emerald-600/5",
    expandHover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    chevron: "text-emerald-500",
    badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40",
    count: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
  },
  sentinel: {
    dot: "bg-zinc-400 dark:bg-zinc-500",
    hover: "hover:bg-zinc-50 dark:hover:bg-white/5",
    expandHover: "hover:bg-zinc-100 dark:hover:bg-white/10",
    chevron: "text-zinc-400",
    badge: "",
    count: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800/30",
  },
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  variant = "list",
}: SearchableSelectProps) {
  const skin = VARIANTS[variant];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSpaces, setExpandedSpaces] = useState<
    Record<string, boolean>
  >({});

  const selectedOption = options.find((option) => option.id === value);

  const rootElements = useMemo(() => getRootOptions(options), [options]);
  const filteredAll = useMemo(
    () => filterOptions(options, searchTerm),
    [searchTerm, options]
  );

  const toggleExpand = (id: string) => {
    setExpandedSpaces((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectOption = (option: SearchableSelectOption) => {
    // O `type` faz parte do contrato: o formulário grava `locationType` e o
    // diálogo de clonagem usa o sentinela `default` como "manter original".
    onChange(option.id, option.type);
    setIsOpen(false);
    setSearchTerm("");
  };

  const renderChildren = (parentId: string, depth: number): React.ReactNode => {
    const children = getDirectChildren(options, parentId);
    if (children.length === 0) return null;

    return (
      <div className={`${skin.indent(depth)} flex flex-col`}>
        {children.map((child) => {
          const hasGrandChildren =
            getDirectChildren(options, child.id).length > 0;
          const isExpanded = expandedSpaces[child.id];
          const kind = getOptionKind(child);
          const accent = ACCENTS[kind];

          return (
            <div key={child.id} className="w-full flex flex-col">
              <div
                className={`w-full flex items-center justify-between ${skin.rowBorder} transition-colors ${accent.hover}`}
              >
                <button
                  type="button"
                  onClick={() => selectOption(child)}
                  className="flex-1 text-left py-3 px-3 min-w-0"
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent.dot}`}
                    />

                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs font-bold dark:text-zinc-200 truncate">
                        {child.name}
                      </span>
                      {kind !== "sentinel" && (
                        <span className={skin.treeLabel}>
                          {kind === "space" ? "Espaço Pai" : "Espaço Físico"}
                        </span>
                      )}
                    </div>

                    {hasGrandChildren && (
                      <span
                        className={`ml-2 text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${accent.count}`}
                      >
                        {getDirectChildren(options, child.id).length}
                      </span>
                    )}
                  </div>
                </button>

                {hasGrandChildren && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(child.id)}
                    className={`shrink-0 p-2 mr-2 transition-colors rounded-lg ${accent.expandHover}`}
                    aria-label={`Expandir ${child.name}`}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${accent.chevron} ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {hasGrandChildren &&
                isExpanded &&
                renderChildren(child.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={skin.button}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {selectedOption ? (
            <>
              {getOptionKind(selectedOption) !== "sentinel" && (
                <span
                  className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase ${
                    ACCENTS[getOptionKind(selectedOption)].badge
                  }`}
                >
                  {getOptionKind(selectedOption) === "space" ? "PAI" : "FÍSICO"}
                </span>
              )}
              <span className="truncate">{selectedOption.name}</span>
            </>
          ) : (
            <span className="text-zinc-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>

      {isOpen && (
        <div className={skin.panel}>
          <div className={skin.searchRow}>
            <Search size={14} className={`${skin.searchIcon} ml-2`} />
            <input
              autoFocus
              className="w-full bg-transparent p-2 text-xs font-bold outline-none dark:text-white"
              placeholder={skin.searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div
            className={`${skin.maxHeight} overflow-y-auto overflow-x-hidden custom-scrollbar`}
          >
            {searchTerm ? (
              filteredAll.length > 0 ? (
                <div>
                  {filteredAll.map((option) => {
                    const kind = getOptionKind(option);
                    const accent = ACCENTS[kind];

                    return (
                      <div key={option.id} className={skin.selectedRing}>
                        <button
                          type="button"
                          onClick={() => selectOption(option)}
                          className={`w-full text-left px-3 py-3 ${skin.searchHover} transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${accent.dot} shrink-0`}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold dark:text-zinc-200">
                                {option.name}
                              </span>
                              {kind !== "sentinel" && (
                                <span className="text-[8px] uppercase font-black text-gray-400">
                                  {kind === "space"
                                    ? "ESP. PAI"
                                    : "ESP. FÍSICO"}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={`p-4 text-center text-[10px] font-black uppercase ${skin.emptyText}`}
                >
                  Nenhum local encontrado
                </div>
              )
            ) : (
              <div>
                {rootElements.length > 0 &&
                  rootElements.map((item) => {
                    const descendantsCount = countDescendants(options, item.id);
                    const isExpanded = expandedSpaces[item.id];
                    const kind = getOptionKind(item);
                    const accent = ACCENTS[kind];

                    return (
                      <div key={item.id} className="w-full flex flex-col">
                        <div
                          className={`w-full flex items-center justify-between ${skin.rootBorder} transition-colors ${accent.hover}`}
                        >
                          <button
                            type="button"
                            onClick={() => selectOption(item)}
                            className="flex-1 text-left py-3 px-3 min-w-0"
                          >
                            <div className="flex items-center gap-2 w-full min-w-0">
                              <div
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${accent.dot}`}
                              />

                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-bold dark:text-zinc-200 truncate">
                                  {item.name}
                                </span>
                                {kind !== "sentinel" && (
                                  <span className={skin.treeLabel}>
                                    {kind === "space"
                                      ? "Espaço Pai"
                                      : "Espaço Físico"}
                                  </span>
                                )}
                              </div>

                              {descendantsCount > 0 && (
                                <span
                                  className={`ml-2 text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${accent.count}`}
                                >
                                  {descendantsCount}
                                </span>
                              )}
                            </div>
                          </button>

                          {descendantsCount > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className={`shrink-0 p-2 mr-2 transition-colors rounded-lg ${accent.expandHover}`}
                              aria-label={`Expandir ${item.name}`}
                            >
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${accent.chevron} ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {descendantsCount > 0 &&
                          isExpanded &&
                          renderChildren(item.id, 1)}
                      </div>
                    );
                  })}

                {rootElements.length === 0 && (
                  <div
                    className={`p-4 text-center text-[10px] font-black uppercase ${skin.emptyText}`}
                  >
                    Nenhum local encontrado
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {isOpen && (
        <div className={skin.overlay} onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
