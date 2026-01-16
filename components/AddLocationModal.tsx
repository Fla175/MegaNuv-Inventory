// components/AddLocationModal.tsx
import React, { useState } from "react";
import { X, Warehouse, Loader2 } from "lucide-react";

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Ajustado para aceitar a função simplificada que o index.tsx usa
  onLocationAdded: (name: string) => Promise<void> | void; 
  isLoading: boolean;
  error: string | null;
}

const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onLocationAdded,
  isLoading,
}) => {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Chama a função e limpa o campo
    await onLocationAdded(name);
    setName("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
        
        {/* Header do Modal */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <Warehouse size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-950 tracking-tighter">Novo Espaço Pai</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Cadastro de Espaço Físico</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-500 text-gray-300 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
              Nome do Espaço
            </label>
            <input
              autoFocus
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl p-4 font-bold text-blue-950 outline-none transition-all"
              placeholder="Ex: Almoxarifado Central"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-black text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Criar Espaço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationModal;