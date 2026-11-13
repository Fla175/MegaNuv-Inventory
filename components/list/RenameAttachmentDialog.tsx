// components/list/RenameAttachmentDialog.tsx
import { useState } from "react";
import { SquarePen, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface RenameAttachmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    id: string;
    alias: string;
    fileUrl: string;
  };
  onSave: (alias: string) => void | Promise<void>;
  isLoading?: boolean;
}

export default function RenameAttachmentDialog({
  isOpen,
  onClose,
  attachment,
  onSave,
  isLoading = false,
}: RenameAttachmentDialogProps) {
  const [alias, setAlias] = useState(attachment.alias);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = alias.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[600] bg-black/60 backdrop-blur-sm"
        className="z-[600] w-full max-w-[calc(100%-2rem)] sm:max-w-md rounded-[2rem] border dark:border-white/10 p-0 shadow-2xl shadow-black/20 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <SquarePen size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-black text-blue-950 dark:text-white uppercase italic tracking-tight mb-2">
                Renomear documento
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Novo nome amigável para o anexo:
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="shrink-0 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="rename-alias-input"
                className="text-[10px] font-black text-gray-400 dark:text-zinc-500 ml-1 mb-1 block uppercase tracking-tighter"
              >
                Nome do documento
              </label>
              <input
                id="rename-alias-input"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                autoFocus
                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl pl-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none"
                placeholder="Ex: Contrato de Fornecedor"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 sm:flex-none px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-black uppercase text-[10px] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !alias.trim()}
                className="flex-1 sm:flex-none px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-900/40 rounded-xl font-black uppercase text-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
