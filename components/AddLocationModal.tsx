// components/AddLocationModal.tsx

import React, { useState } from 'react';
import { X, PlusCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationAdded: (name: string, serialNumber: string, notes: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function AddLocationModal({ isOpen, onClose, onLocationAdded, isLoading, error }: AddLocationModalProps) {
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !serialNumber.trim()) return;

    await onLocationAdded(name, serialNumber, notes);

    if (!error && !isLoading) {
      setName('');
      setSerialNumber('');
      setNotes('');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleBackdropClick}>
          {/* Animação do Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-8 pointer-events-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Adicionar Novo Espaço Físico</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition duration-200 focus:outline-none"
                aria-label="Fechar"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
                <strong className="font-bold">Erro!</strong>
                <span className="block sm:inline ml-2">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                  Nome do Espaço:
                </label>
                <input
                  type="text"
                  id="name"
                  className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sala de Servidores, Almoxarifado A"
                  required
                />
              </div>

              <div>
                <label htmlFor="serialNumber" className="block text-gray-700 text-sm font-semibold mb-2">
                  Identificador Único (Código Interno):
                </label>
                <input
                  type="text"
                  id="serialNumber"
                  className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Ex: RACK-01, ALM-A-SHELF-03"
                  required
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-gray-700 text-sm font-semibold mb-2">
                  Descrição (Opcional):
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionais sobre este espaço..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-200"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex items-center px-6 py-2 rounded-lg text-white font-semibold shadow-md transition duration-200
                    ${isLoading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                    }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 size={20} className="animate-spin mr-2" />
                      Adicionando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <PlusCircle size={20} className="mr-2" />
                      Adicionar Espaço
                    </span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
