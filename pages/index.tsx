// pages/index.tsx (Header Responsivo)

import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import AddLocationModal from '../components/AddLocationModal';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PlusCircle, Eye, Box, MapPin } from 'lucide-react'; // Ícones Lucide

// Reusando interfaces para consistência (pode ser movido para um types.ts central)
interface Item {
  name: string;
  sku: string;
  contaAzulId?: string;
  status: string;
  price: number;
  cost: number | null;
}

interface ItemInstance {
  id: string;
  itemId: string;
  serialNumber: string; // Usado como o identificador único para o local (ex: RACK-01)
  location: string | null; // Nome amigável do local (ex: "Rack 01")
  qrCodePath: string | null;
  isInUse: boolean;
  notes: string | null; // Agora "Descrição"
  parentId: string | null;
  item: Item;
  children?: ItemInstance[]; // Itens dentro deste local (servidores, peças, etc.)
}

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<ItemInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para abrir/fechar o modal
  const [addingLocation, setAddingLocation] = useState(false);
  const [addLocationError, setAddLocationError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedbackMessage(null);
      setFeedbackType(null);
    }, 4000);
  };

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/item-instances/list?parentId=null&fetchChildren=true', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao buscar espaços físicos.');
      }

      const data = await response.json();
      setLocations(data.itemInstances);
    } catch (err: any) {
      console.error('Erro ao buscar espaços físicos:', err);
      setError(err.message || 'Ocorreu um erro ao carregar os espaços físicos.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   const checkSeed = async () => {
  //     const res = await fetch("/api/auth/seed", { credentials: 'include' });
  //     const data = await res.json();
  //     window.location.href = data.redirectTo;
  //   };
  //   checkSeed();
  // }, []);  

  const handleAddLocation = async (name: string, serialNumber: string, notes: string) => {
    setAddingLocation(true);
    setAddLocationError(null);
    try {
      const itemResponse = await fetch('/api/internal/ensure-location-item', {
        credentials: 'include',
      });
      if (!itemResponse.ok) {
        const errData = await itemResponse.json();
        throw new Error(errData.message || 'Falha ao obter item de localização interno.');
      }
      const itemData = await itemResponse.json();
      const locationItemId = itemData.locationItemId;

      const response = await fetch('/api/item-instances/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId: locationItemId,
          serialNumber: serialNumber,
          location: name,
          isInUse: true,
          notes: notes,
          parentId: null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao adicionar espaço físico.');
      }

      await fetchLocations();
      setIsModalOpen(false); // Fecha o modal
      showFeedback('Espaço físico adicionado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao adicionar espaço físico:', err);
      setAddLocationError(err.message || 'Ocorreu um erro ao adicionar o espaço.');
      showFeedback(`Erro: ${err.message || 'Falha ao adicionar espaço.'}`, 'error');
    } finally {
      setAddingLocation(false);
    }
  };

  const handleViewContents = (locationValue: string) => {
    router.push(`/inventory-view?location=${encodeURIComponent(locationValue)}`);
  };

  if (loading) {
    return (
      <Layout title="Espaços Físicos - MegaNuv Inventory">
        <div className="flex items-center justify-center h-full text-gray-700">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Carregando espaços físicos...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Espaços Físicos - MegaNuv Inventory">
        <div className="text-red-600 text-center h-full flex items-center justify-center">
          Erro: {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Espaços Físicos - MegaNuv Inventory">
      {/* Wrapper principal para o conteúdo da página, com max-w para centralização */}
      <div className={`max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-filter duration-300 ${isModalOpen ? 'blur-sm pointer-events-none' : ''}`}>
        <Head>
          <title>Espaços Físicos - MegaNuv Inventory</title>
        </Head>

        {/* Cabeçalho da Página - CORREÇÃO: Ajuste de responsividade para título e botão */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0"> {/* Adicionado flex-col e gap para mobile */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center sm:text-left w-full sm:w-auto"> {/* Ajuste de tamanho e alinhamento */}
            Seus Espaços Físicos
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center" // Ajuste de tamanho e largura
          >
            <PlusCircle size={18} className="mr-2 sm:mr-2" /> {/* Ajuste de tamanho do ícone */}
            Adicionar Novo Espaço
          </button>
        </div>

        {/* Mensagem de Feedback */}
        {feedbackMessage && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-lg font-medium ${feedbackType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedbackMessage}
          </div>
        )}

        {/* Grid de Cards de Espaços Físicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.length === 0 ? (
            <p className="col-span-full text-center text-gray-600 py-10">
              Nenhum espaço físico cadastrado ainda. Clique em "Adicionar Novo Espaço" para começar!
            </p>
          ) : (
            locations.map((loc) => (
              <div
                key={loc.id}
                className="bg-white border border-gray-200 rounded-xl shadow-md p-6 flex flex-col justify-between 
                           transform transition duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                onClick={() => handleViewContents(loc.location || loc.serialNumber || loc.id)}
              >
                <div>
                  <div className="flex items-center mb-3">
                    <MapPin size={24} className="text-blue-500 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-800">{loc.location || loc.serialNumber}</h2>
                  </div>

                  {loc.notes && (
                    <p className="text-gray-700 text-sm mb-3">
                      <span className="font-medium">Descrição:</span> {loc.notes}
                    </p>
                  )}

                  <p className="text-gray-600 text-sm flex items-center">
                    <Box size={16} className="text-gray-500 mr-2" />
                    Itens Contidos: <span className="font-bold ml-1">{loc.children?.length ?? 0}</span>
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewContents(loc.location || loc.serialNumber || loc.id);
                    }}
                    className="flex items-center bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-sm"
                  >
                    <Eye size={16} className="mr-2" />
                    Ver Conteúdo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para Adicionar Espaço - Renderizado condicionalmente */}
      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAddLocationError(null);
        }}
        onLocationAdded={handleAddLocation}
        isLoading={addingLocation}
        error={addLocationError}
      />
    </Layout>
  );
}
