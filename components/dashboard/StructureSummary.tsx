// components/dashboard/StructureSummary.tsx
interface StructureSummaryProps {
  fatherSpaces: number;
  PhysicalSpaces: number;
  totalSpaces: number;
}

export default function StructureSummary({
  fatherSpaces,
  PhysicalSpaces,
  totalSpaces,
}: StructureSummaryProps) {
  const percentSub = totalSpaces > 0 ? (PhysicalSpaces / totalSpaces) * 100 : 0;

  return (
    <div className="bg-blue-950 dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col border dark:border-white/5 h-[27rem]">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
            <Layers size={20} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-black italic">Estrutura</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-black text-blue-400 uppercase">Espaços Pai</span>
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-blue-600">
              {fatherSpaces}
            </span>
          </div>
          <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-black text-indigo-400 uppercase">Espaços Físicos</span>
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-blue-600">
              {PhysicalSpaces}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-4 border-t border-white/10">
        <div className="flex justify-between items-end mb-3">
          <p className="text-[10px] font-black text-gray-400 uppercase">Volume Total</p>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {totalSpaces} <span className="text-xs opacity-50 italic">{totalSpaces === 1 ? "espaço" : "espaços"}</span>
          </h2>
        </div>
        <div className={`h-2 w-full ${totalSpaces > 0 ? "bg-blue-500" : "bg-blue-900/50"} rounded-full overflow-hidden`}>
          <div className="h-full bg-indigo-500 rounded-r-full" style={{ width: `${percentSub}%` }} />
        </div>
      </div>
    </div>
  );
}

import { Layers } from "lucide-react";
