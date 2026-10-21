// components/settings/CategoryModal.tsx
import { CirclePlus, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SettingsCategory } from "@/components/settings/types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  selectedCategory: SettingsCategory | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  saving,
  selectedCategory,
}: CategoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName="z-[100] bg-blue-950/40 dark:bg-black/80 backdrop-blur-md"
        className="z-[100] w-full max-w-md sm:max-w-md rounded-[2.5rem] p-10 bg-white dark:bg-zinc-900 border border-white/10 shadow-2xl"
      >
        <form onSubmit={onSubmit}>
          <div className="flex justify-between items-center mb-8">
            <DialogTitle className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
              {selectedCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário de nome da categoria.
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
            <input
              name="name"
              placeholder="Nome da Categoria"
              defaultValue={selectedCategory?.name || ""}
              className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <CirclePlus size={18} />}{" "}
            Salvar Categoria
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
