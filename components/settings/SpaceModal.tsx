// components/settings/SpaceModal.tsx
import { CirclePlus, Loader2, X } from "lucide-react";
import { PatternFormat } from "react-number-format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import ImageUpload from "@/components/imageUpload";
import { toLocalMediaUrl } from "@/lib/mediaUrl";
import type { SettingsSpace } from "@/components/settings/types";

interface SpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  selectedSpace: SettingsSpace | null;
  spaceImageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export default function SpaceModal({
  isOpen,
  onClose,
  onSubmit,
  saving,
  selectedSpace,
  spaceImageUrl,
  onImageChange,
}: SpaceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        overlayClassName="z-[100] bg-blue-950/40 dark:bg-black/80 backdrop-blur-md"
        className="z-[100] w-full max-w-lg sm:max-w-lg rounded-[2.5rem] p-10 bg-white dark:bg-zinc-900 border border-white/10 shadow-2xl"
      >
        <form onSubmit={onSubmit}>
          <div className="flex justify-between items-center mb-8">
            <DialogTitle className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
              {selectedSpace ? "Editar Espaço" : "Novo Espaço Pai"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário de dados do espaço pai.
            </DialogDescription>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-red-500"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6 mb-10">
            <input
              name="name"
              placeholder="Nome do Local"
              defaultValue={selectedSpace?.name || ""}
              className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold"
              required
            />
            <textarea
              name="notes"
              rows={4}
              defaultValue={selectedSpace?.notes || ""}
              className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold resize-none"
              placeholder="Notas..."
            />
            <ImageUpload
              value={toLocalMediaUrl(spaceImageUrl || selectedSpace?.imageUrl)}
              onChange={onImageChange}
              label="Imagem do Espaço"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="address"
                placeholder="Endereço"
                defaultValue={selectedSpace?.address || ""}
                className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm"
              />
              <input
                type="text"
                name="responsible"
                placeholder="Responsável"
                defaultValue={selectedSpace?.responsible || ""}
                className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PatternFormat
                type="tel"
                name="phone"
                placeholder="Telefone"
                format="(##) #####-####"
                mask="_"
                defaultValue={selectedSpace?.phone || ""}
                className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <CirclePlus size={18} />}{" "}
            Confirmar Espaço
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
