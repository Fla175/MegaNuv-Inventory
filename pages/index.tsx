// pages/index.tsx (Antigo locations.tsx, agora a página principal)

import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import AddLocationModal from '../components/AddLocationModal';
import Head from 'next/head';
import { useRouter } from 'next/router';

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
    notes: string | null;
    parentId: string | null;
    item: Item;
    children?: ItemInstance[]; // Itens dentro deste local (servidores, peças, etc.)
}

export default function LocationsPage() { // Mantenha o nome da função, o nome do arquivo define a rota
  const router = useRouter();
  const [locations, setLocations] = useState<ItemInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [addLocationError, setAddLocationError] = useState<string | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Adicionado credentials: 'include' para garantir que os cookies HttpOnly sejam enviados
      const response = await fetch('/api/item-instances/list?parentId=null&fetchChildren=true', {
        credentials: 'include', // <--- NOVO: Essencial para enviar cookies com a requisição
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

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddLocation = async (name: string, serialNumber: string, notes: string) => {
    setAddingLocation(true);
    setAddLocationError(null);
    try {
      // 1. Chamar a API interna para garantir que o "Item" de tipo "Espaço Físico" existe
      const itemResponse = await fetch('/api/internal/ensure-location-item', {
        credentials: 'include', // <--- NOVO: Essencial para enviar cookies
      });
      if (!itemResponse.ok) {
        const errData = await itemResponse.json();
        throw new Error(errData.message || 'Falha ao obter item de localização interno.');
      }
      const itemData = await itemResponse.json();
      const locationItemId = itemData.locationItemId;

      // 2. Criar a nova ItemInstance para este espaço físico
      const response = await fetch('/api/item-instances/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // <--- NOVO: Essencial para enviar cookies
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
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao adicionar espaço físico:', err);
      setAddLocationError(err.message || 'Ocorreu um erro ao adicionar o espaço.');
    } finally {
      setAddingLocation(false);
    }
  };

  const handleViewContents = (locationValue: string) => {
    router.push(`/inventory-view?location=${encodeURIComponent(locationValue)}`);
  };

  const handleGenerateQrCode = async (locationValue: string) => {
    try {
      // O fetch do QR Code também espera o JWT via cookie
      const response = await fetch(`/api/generate-qrcode?type=location&value=${encodeURIComponent(locationValue)}`, {
        credentials: 'include', // <--- NOVO: Essencial para enviar cookies
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao gerar QR Code.');
      }

      const data = await response.json();
      console.log('URL do QR Code gerado (para impressão física - COPIE ESTA URL):', data.qrCodeUrl);
      alert(`QR Code URL gerado. Copie do console do navegador para imprimir: ${data.qrCodeUrl}`);
    } catch (err: any) {
      console.error('Erro ao gerar QR Code:', err);
      setError(err.message || 'Ocorreu um erro ao gerar QR Code.');
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center py-10 text-gray-700">Carregando espaços físicos...</div></Layout>;
  if (error) return <Layout><div className="text-red-600 py-10 text-center">Erro: {error}</div></Layout>;

  return (
    <Layout title="Espaços Físicos - MegaNuv Inventory">
      <Head>
        <title>Espaços Físicos - MegaNuv Inventory</title>
      </Head>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Seus Espaços Físicos</h1>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200 ease-in-out transform hover:scale-105"
        >
          + Adicionar Novo Espaço
        </button>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.length === 0 ? (
            <p className="col-span-full text-center text-gray-600">Nenhum espaço físico cadastrado ainda. Adicione um!</p>
          ) : (
            locations.map((loc) => (
              <div key={loc.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{loc.location || loc.serialNumber}</h2>
                  <p className="text-gray-600 text-sm mb-3">ID: {loc.id}</p>
                  <p className="text-gray-600 text-sm mb-3">Identificador Único: {loc.serialNumber}</p>
                  {loc.notes && <p className="text-gray-700 text-base mb-3">Notas: {loc.notes}</p>}
                  <p className="text-gray-600 text-sm">Itens Diretos Contidos: <span className="font-bold">{loc.children?.length ?? 0}</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewContents(loc.location || loc.serialNumber || loc.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-3 rounded-md transition duration-200"
                  >
                    Ver Conteúdo
                  </button>
                  <button
                    onClick={() => handleGenerateQrCode(loc.location || loc.serialNumber || loc.id)}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold py-2 px-3 rounded-md transition duration-200"
                  >
                    Gerar QR
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
