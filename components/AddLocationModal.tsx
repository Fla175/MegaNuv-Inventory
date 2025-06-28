// components/AddLocationModal.tsx

import React, { useState } from 'react';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // A função que será chamada quando um novo local for adicionado.
  // Recebe o nome do local, um identificador único (serialNumber) e notas.
  onLocationAdded: (locationName: string, serialNumber: string, notes: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function AddLocationModal({ isOpen, onClose, onLocationAdded, isLoading, error }: AddLocationModalProps) {
  const [locationName, setLocationName] = useState(''); // O nome amigável do espaço (ex: "Armário 01")
  const [serialNumber, setSerialNumber] = useState(''); // O identificador único (ex: "ARMA01-LOC") - usaremos como 'serialNumber' da ItemInstance
  const [notes, setNotes] = useState('');

  if (!isOpen) return null; // Não renderiza nada se o modal não estiver aberto

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onLocationAdded(locationName, serialNumber, notes); // Chama a função passada pelo pai
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Adicionar Novo Espaço Físico</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="locationName" className="block text-gray-700 text-sm font-bold mb-2">
              Nome do Espaço (ex: Armário 01, Rack Principal):
            </label>
            <input
              type="text"
              id="locationName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="serialNumber" className="block text-gray-700 text-sm font-bold mb-2">
              Identificador Único (ex: ARMARIO-01-MEGANUV, RACK-PRINCIPAL):
            </label>
            <input
              type="text"
              id="serialNumber"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">
              Notas/Descrição (Opcional):
            </label>
            <textarea
              id="notes"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Adicionando...' : 'Adicionar Espaço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
