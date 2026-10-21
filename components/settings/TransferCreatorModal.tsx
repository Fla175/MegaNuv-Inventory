// components/settings/TransferCreatorModal.tsx
import { KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SettingsUser } from "@/components/settings/types";

interface TransferCreatorModalProps {
  isOpen: boolean;
  targetUser: SettingsUser | null;
  confirmInput: string;
  onConfirmInputChange: (value: string) => void;
  isTransferring: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function TransferCreatorModal({
  isOpen,
  targetUser,
  confirmInput,
  onConfirmInputChange,
  isTransferring,
  onConfirm,
  onClose,
}: TransferCreatorModalProps) {
  const expected = (targetUser?.name || targetUser?.email || "").trim();
  const canConfirm = confirmInput.trim() === expected && !isTransferring;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName="z-[100] bg-blue-950/40 dark:bg-black/80 backdrop-blur-md"
        className="z-[100] w-full max-w-[calc(100%-2rem)] sm:max-w-md bg-white dark:bg-zinc-900 border border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-2xl">
            <KeyRound size={24} />
          </div>
          <div>
            <DialogTitle className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
              Ceder Título de Criador
            </DialogTitle>
            <DialogDescription className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
              Ação irreversível
            </DialogDescription>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">
          Ao transferir o título para{" "}
          <strong className="text-zinc-900 dark:text-white">
            {targetUser?.name || targetUser?.email}
          </strong>
          , você perderá a capacidade de entrar nas contas dos usuários. Digite o nome ou e-mail
          exato do destinatário para confirmar:
        </p>

        <div className="mb-4 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
          <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">
            Confirme digitando:
          </p>
          <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
            {expected}
          </p>
        </div>

        <input
          type="text"
          value={confirmInput}
          onChange={(event) => onConfirmInputChange(event.target.value)}
          placeholder="Digite exatamente o texto acima..."
          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-red-500 mb-6"
        />

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
          >
            {isTransferring ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <KeyRound size={16} />
            )}
            Confirmar Transferência
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
