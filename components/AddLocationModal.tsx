// components/AddLocationModal.tsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { X, MapPin, Calculator, Info } from "lucide-react";

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Atualizado para incluir campos de depreciação
  onLocationAdded: (
    name: string, 
    serialNumber: string, 
    notes: string, 
    parentId?: string | null,
    cost?: number | null,
    usefulLifeMonths?: number | null
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  parentId?: string | null;
  parentName?: string | null;
}

export default function AddLocationModal({
  isOpen,
  onClose,
  onLocationAdded,
  isLoading,
  error,
  parentId = null,
  parentName = null,
}: AddLocationModalProps) {
  // Estados Básicos
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");
  
  // Estados de Depreciação (Opcional)
  const [showDepreciation, setShowDepreciation] = useState(false);
  const [cost, setCost] = useState<number | "">("");
  const [usefulLife, setUsefulLife] = useState<number | "">("");

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setSerialNumber("");
      setNotes("");
      setCost("");
      setUsefulLife("");
      setShowDepreciation(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLocationAdded(
      name, 
      serialNumber, 
      notes, 
      parentId, 
      cost !== "" ? Number(cost) : null, 
      usefulLife !== "" ? Number(usefulLife) : null
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-[2.5rem] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={20} className="text-blue-600" />
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Localização</span>
                    </div>
                    <Dialog.Title className="text-2xl font-black text-blue-950">
                      {parentName ? `Subespaço em ${parentName}` : "Novo Espaço Pai"}
                    </Dialog.Title>
                  </div>
                  <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <Info size={16} /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Identificação</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Almoxarifado"
                        className="w-full bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Código/Série</label>
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Ex: LOC-01"
                        className="w-full bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Notas</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Descrição opcional..."
                      className="w-full bg-gray-50 text-gray-600 border border-gray-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      rows={2}
                    />
                  </div>

                  {/* Seção de Depreciação Opcional */}
                  <div className={`p-1 rounded-[2rem] transition-all ${showDepreciation ? 'bg-blue-50/50 border border-blue-100' : 'bg-transparent'}`}>
                    <button
                      type="button"
                      onClick={() => setShowDepreciation(!showDepreciation)}
                      className="flex items-center gap-2 p-3 text-sm font-black text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Calculator size={18} />
                      {showDepreciation ? "- Remover Depreciação do Espaço" : "+ Ativar Depreciação (Opcional)"}
                    </button>

                    {showDepreciation && (
                      <div className="p-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className="block text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 text-center">Custo (R$)</label>
                          <input
                            type="number"
                            value={cost}
                            onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-white text-gray-600 border border-blue-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-blue-400 uppercase ml-2 mb-1 text-center">Vida Útil (Meses)</label>
                          <input
                            type="number"
                            value={usefulLife}
                            onChange={(e) => setUsefulLife(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-white text-gray-600 border border-blue-100 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="60"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all disabled:opacity-50"
                    >
                      {isLoading ? "Salvando..." : "Salvar Localização"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}