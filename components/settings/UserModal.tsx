// components/settings/UserModal.tsx
import { CheckCircle, KeyRound, Loader2, Mail, UserCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoleOption } from "@/lib/settings/roleOptions";
import type { SettingsUser } from "@/components/settings/types";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  selectedUser: SettingsUser | null;
  currentUserId: string;
  role: string;
  roleOptions: RoleOption[];
  onRoleChange: (role: string) => void;
}

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  saving,
  selectedUser,
  currentUserId,
  role,
  roleOptions,
  onRoleChange,
}: UserModalProps) {
  const isSelf = selectedUser?.id === currentUserId; // covers "new" as false
  const title = isSelf ? "Meu Perfil" : selectedUser ? "Editar Membro" : "Novo Membro";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName="z-[100] bg-blue-950/40 dark:bg-black/80 backdrop-blur-md"
        className="z-[100] w-full max-w-[calc(100%-2rem)] sm:max-w-md rounded-[2.5rem] p-10 bg-white dark:bg-zinc-900 border border-white/10 shadow-2xl"
      >
        <form onSubmit={onSubmit}>
          <div className="flex justify-between items-center mb-8">
            <DialogTitle className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário de dados do membro da equipe.
            </DialogDescription>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-red-500"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <div className="space-y-1">
              <label
                htmlFor="user-name"
                className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"
              >
                <UserCircle size={10} /> Nome Completo
              </label>
              <input
                id="user-name"
                name="name"
                defaultValue={selectedUser?.name || ""}
                className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="user-email"
                className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"
              >
                <Mail size={10} /> Email
              </label>
              <input
                id="user-email"
                name="email"
                type="email"
                defaultValue={selectedUser?.email || ""}
                className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="user-password"
                className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"
              >
                <KeyRound size={10} />{" "}
                {selectedUser ? "Mudar Senha (Opcional)" : "Senha"}
              </label>
              <input
                id="user-password"
                name="password"
                type="password"
                className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold"
                required={!selectedUser}
              />
            </div>

            {!isSelf && (
              <div className="space-y-1">
                <label
                  htmlFor="user-role"
                  className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"
                >
                  Nível de Permissão
                </label>
                <input type="hidden" name="role" value={role} />
                <Select value={role} onValueChange={onRoleChange}>
                  <SelectTrigger
                    id="user-role"
                    className="w-full h-[52px] data-[size=default]:h-[52px] bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border-none font-bold dark:text-white"
                  >
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${option.indicatorColor}`} />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}{" "}
            Confirmar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
