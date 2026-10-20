// components/dashboard/KPICards.tsx
import { DollarSign, Package } from "lucide-react";
import { useUser } from "@/lib/context/UserContext";

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  accent: "teal" | "blue";
}

function KPICard({ icon, label, value, subtitle, accent }: KPICardProps) {
  const bg = accent === "teal" ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group flex flex-col justify-between">
      <div className={`absolute top-0 right-0 p-8 ${accent === "teal" ? "text-teal-500/10" : "text-blue-500/10"} group-hover:scale-125 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className={`p-3 rounded-2xl w-fit mb-6 ${bg}`}>{icon}</div>
        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <h2 className="text-3xl font-black text-blue-950 dark:text-white tracking-tighter">{value}</h2>
        {subtitle && <p className="text-sm opacity-50 italic font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function KPICards({ totalValue, totalActives }: { totalValue: number; totalActives: number }) {
  const isDirector = useUser().user?.role === "DIRECTOR";

  if (!isDirector) {
    return (
      <KPICard
        icon={<Package size={24} />}
        label="Total de Ativos"
        value={
          <>
            {totalActives || 0}
            <span className="text-sm opacity-50 italic font-medium">
              {totalActives === 1 ? "unidade" : "unidades"}
            </span>
          </>
        }
        accent="blue"
      />
    );
  }

  return (
    <>
      <KPICard
        icon={<DollarSign size={24} />}
        label="Patrimônio"
        value={
          new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            totalValue || 0
          )
        }
        accent="teal"
      />
      <KPICard
        icon={<Package size={24} />}
        label="Total de Ativos"
        value={
          <>
            {totalActives || 0}
            <span className="text-sm opacity-50 italic font-medium">
              {totalActives === 1 ? "unidade" : "unidades"}
            </span>
          </>
        }
        accent="blue"
      />
    </>
  );
}
