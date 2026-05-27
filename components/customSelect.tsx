// components/customSelect.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  indicatorColor?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl outline-none font-bold text-sm h-[52px] dark:text-white border-2 border-transparent focus:border-blue-600/30 flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2">
          {selectedOption?.indicatorColor && (
            <div className={`w-2 h-2 rounded-full ${selectedOption.indicatorColor}`} />
          )}
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          size={16} 
        />
      </button>

      {isOpen && !disabled && (
        <>
          <div className="absolute z-[600] w-full mt-2 bg-white dark:bg-zinc-900 border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-1">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 mb-1 last:mb-0 ${
                      isSelected
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400"
                        : "hover:bg-gray-50 dark:hover:bg-white/5 dark:text-zinc-200"
                    }`}
                  >
                    {opt.indicatorColor && (
                      <div className={`w-2 h-2 rounded-full ${opt.indicatorColor}`} />
                    )}
                    <span className="text-sm font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="fixed inset-0 z-[590]" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
}