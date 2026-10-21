// components/settings/SettingsNav.tsx
import { ChevronRight, ClipboardList, Group, LayoutDashboard, Palette, Users } from "lucide-react";
import type { SettingsTab } from "@/components/settings/types";

interface SettingsNavProps {
  activeTab: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
  canManageAll: boolean;
  canManageUsers: boolean;
  canSeeLogs: boolean;
}

export default function SettingsNav({
  activeTab,
  onSelect,
  canManageAll,
  canManageUsers,
  canSeeLogs,
}: SettingsNavProps) {
  const tabs = [
    { id: "users", label: "Acessos e Equipe", icon: Users, show: true },
    { id: "spaces", label: "Espaços Pai", icon: LayoutDashboard, show: canManageAll },
    { id: "categories", label: "Categorias", icon: Group, show: canManageUsers },
    { id: "logs", label: "Logs", icon: ClipboardList, show: canSeeLogs },
    { id: "theme", label: "Tema", icon: Palette, show: true },
  ] as const;

  return (
    <div className="w-full lg:w-72 2xl:w-80 space-y-2 shrink-0">
      {tabs
        .filter((tab) => tab.show)
        .map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`w-full flex items-center justify-center lg:justify-between px-3 lg:px-5 py-3 lg:py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-tight ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-xl translate-x-2"
                : "bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 hover:text-blue-600 border border-gray-100 dark:border-white/5"
            }`}
          >
            <tab.icon size={18} className="shrink-0" />
            <span className="hidden lg:inline truncate ml-3">{tab.label}</span>
            {activeTab === tab.id && <ChevronRight size={14} className="hidden lg:inline" />}
          </button>
        ))}
    </div>
  );
}
