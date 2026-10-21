// components/settings/ThemeTab.tsx
import { Monitor, Moon, Sun } from "lucide-react";
import type { Theme } from "@/types/inventory";

interface ThemeTabProps {
  currentTheme: Theme | string | undefined;
  onSelect: (theme: Theme) => void;
}

const OPTIONS: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "LIGHT", label: "Claro", icon: Sun },
  { value: "DARK", label: "Escuro", icon: Moon },
  { value: "SYSTEM", label: "Sistema", icon: Monitor },
];

export default function ThemeTab({ currentTheme, onSelect }: ThemeTabProps) {
  return (
    <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic mb-10 tracking-tighter">
        Tema
      </h3>
      <div className="space-y-4 mb-12">
        <div className="grid grid-cols-3 gap-4">
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onSelect(value)}
              className={`flex flex-col items-center gap-3 p-6 border rounded-[2rem] transition-all ${
                currentTheme === value
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-inner"
                  : "border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-black uppercase">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
