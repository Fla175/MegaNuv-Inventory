// components/settings/SettingsHeader.tsx
import { Settings } from "lucide-react";
import RevertHistory from "@/components/settings/RevertHistory";
import QRCodeBatchDownload from "@/components/settings/QRCodeBatchDownload";
import type { useRevertHistory } from "@/lib/hooks/useRevertHistory";
import type { SettingsSpace } from "@/components/settings/types";

interface SettingsHeaderProps {
  revert: ReturnType<typeof useRevertHistory>;
  spacesList?: SettingsSpace[];
}

export default function SettingsHeader({ revert, spacesList = [] }: SettingsHeaderProps) {
  const hasPhysicalSpaces = spacesList.length > 0; // Verificado pelo endpoint

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 lg:mb-10">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 lg:p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20">
          <Settings className="w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-blue-950 dark:text-white italic tracking-tighter uppercase">
            Configurações
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Painel de Controle e personalização
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <QRCodeBatchDownload hasPhysicalSpaces={hasPhysicalSpaces} />
        <RevertHistory
          revertItems={revert.revertItems}
          selectedReverts={revert.selectedReverts}
          isRevertMenuOpen={revert.isRevertMenuOpen}
          isReverting={revert.isReverting}
          onToggleMenu={() => revert.setIsRevertMenuOpen((open) => !open)}
          onCloseMenu={() => revert.setIsRevertMenuOpen(false)}
          onToggleItem={revert.toggleRevertItem}
          onQuickUndo={revert.handleQuickUndo}
          onRevertSelected={() => revert.handleRevertSelected()}
        />
      </div>
    </div>
  );
}
