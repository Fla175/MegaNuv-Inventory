// components/settings/EnterAccountModal.tsx
import { Loader2, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SettingsUser } from "@/components/settings/types";

interface EnterAccountModalProps {
  isOpen: boolean;
  targetUser: SettingsUser | null;
  password: string;
  onPasswordChange: (password: string) => void;
  isEntering: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function EnterAccountModal({
  isOpen,
  targetUser,
  password,
  onPasswordChange,
  isEntering,
  onConfirm,
  onClose,
}: EnterAccountModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName="z-[100] bg-blue-950/40 dark:bg-black/80 backdrop-blur-md"
        className="z-[100] w-full max-w-md sm:max-w-md bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 text-amber-500 mb-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-2xl">
            <LogIn size={24} />
          </div>
          <div>
            <DialogTitle className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
              Entrar na Conta
            </DialogTitle>
            <DialogDescription className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              Confirmação de segurança
            </DialogDescription>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">
          Para entrar na conta de{" "}
          <strong className="text-zinc-900 dark:text-white">
            {targetUser?.name || targetUser?.email}
          </strong>
          , confirme a sua senha de criador:
        </p>

        <input
          type="password"
          value={password}
          autoComplete="current-password"
          autoFocus
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Sua senha..."
          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 mb-6"
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
            disabled={isEntering}
            onClick={onConfirm}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
          >
            {isEntering ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Confirmar Entrada
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
