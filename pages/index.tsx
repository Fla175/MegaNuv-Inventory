// pages/index.tsx
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import AddLocationModal from "../components/AddLocationModal";
import Head from "next/head";
import { useRouter } from "next/router";
import { PlusCircle, Eye, Box, MapPin, Layers, Warehouse, Trash2 } from "lucide-react"; // Adicionado Trash2
import { useUser } from "../lib/context/UserContext";

// Tipagens (mantidas)
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
  serialNumber: string;
  location: string | null;
  qrCodePath: string | null;
  isInUse: boolean;
  notes: string | null;
  parentId: string | null;
  item: Item;
  children?: ItemInstance[];
}
// Constante para o SKU de Locação
const LOCATION_SKU = "INTERNAL_LOCATION_SPACE";

export default function LocationsPage() {
  const router = useRouter();
  const { user, setUser } = useUser();

  const [locations, setLocations] = useState<ItemInstance[]>([]);
  const [topLevelItems, setTopLevelItems] = useState<ItemInstance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [addLocationError, setAddLocationError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(null);

  const showFeedback = (message: string, type: "success" | "error") => {
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
      const response = await fetch("/api/item-instances/list?parentId=null&fetchChildren=true", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Falha ao buscar espaços físicos.");
      }

      const data = await response.json();
      
      const allInstances = data.itemInstances as ItemInstance[];
      
      const physicalSpaces = allInstances.filter(
        (instance) => instance.item.sku === LOCATION_SKU
      );
      
      const items = allInstances.filter(
        (instance) => instance.item.sku !== LOCATION_SKU
      );

      setLocations(physicalSpaces);
      setTopLevelItems(items);
      
    } catch (err: any) {
      console.error("Erro ao buscar espaços físicos:", err);
      setError(err.message || "Ocorreu um erro ao carregar os espaços físicos.");
    } finally {
      setLoading(false);
    }
  };
  
  // ==========================================================
  // == FUNÇÃO DE DELEÇÃO (Implementada do inventory-view.tsx) ==
  // ==========================================================
  const handleDeleteChild = async (childId: string, isRecursive: boolean = false) => {
    // Confirmação dupla para deleção recursiva de topo de nível
    if (isRecursive && !window.confirm("CONFIRME: Deletar RECURSIVAMENTE apagará TUDO dentro deste item/espaço. Tem certeza?")) {
        return;
    }

    const query = new URLSearchParams({
      childId: childId,
      recursive: isRecursive.toString()
    }).toString();

    const url = `/api/item-instances/children/delete?${query}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Falha ao deletar item/espaço.");
      }

      showFeedback(`Deletado com sucesso! (ID: ${childId})`, "success");
      await fetchLocations(); // Recarrega
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      showFeedback(`Erro: ${err.message}`, "error");
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddLocation = async (name: string, serialNumber: string, notes: string) => {
    setAddingLocation(true);
    setAddLocationError(null);
    try {
      const itemResponse = await fetch("/api/internal/ensure-location-item", {
        credentials: "include",
      });
      if (!itemResponse.ok) {
        const errData = await itemResponse.json();
        throw new Error(errData.message || "Falha ao obter item de localização interno.");
      }
      const itemData = await itemResponse.json();
      const locationItemId = itemData.locationItemId;

      const response = await fetch("/api/item-instances/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemId: locationItemId,
          serialNumber,
          location: name,
          isInUse: true,
          notes,
          parentId: null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Falha ao adicionar espaço físico.");
      }

      await fetchLocations();
      setIsModalOpen(false);
      showFeedback("Espaço físico adicionado com sucesso!", "success");
    } catch (err: any) {
      console.error("Erro ao adicionar espaço físico:", err);
      setAddLocationError(err.message);
      showFeedback(`Erro: ${err.message}`, "error");
    } finally {
      setAddingLocation(false);
    }
  };

  const handleViewInstance = (instanceId: string | null) => {
    router.push(`/inventory-view?location=${instanceId}`);
  };

  if (loading) {
    return (
      <Layout title="Espaços Físicos - MegaNuv Inventory">
        <div className="flex items-center justify-center h-full text-gray-700">
          <svg
            className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Carregando...
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
      <div
        className={`max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 transition-filter duration-300 ${
          isModalOpen ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <Head>
          <title>Espaços Físicos - MegaNuv Inventory</title>
        </Head>

        {/* Header (Botão de Adicionar só cria Espaços Físicos) */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 sm:gap-0 border-b pb-4 border-gray-200"> {/* Divisor */}
          <h1 className="text-3xl font-extrabold text-blue-950 text-center sm:text-left w-full sm:w-auto flex items-center">
            <Warehouse size={32} className="mr-3 text-blue-600" />
            Inventário
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition duration-300 ease-in-out transform hover:scale-[1.02] text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <PlusCircle size={18} className="mr-2" />
            Adicionar Novo Espaço
          </button>
        </div>

        {feedbackMessage && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl text-lg font-medium shadow-md ${
              feedbackType === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        {/* ========================================================== */}
        {/* == SEÇÃO DE ESPAÇOS FÍSICOS == */}
        {/* ========================================================== */}
        <div className="mb-12">
           <h2 className="text-2xl font-bold text-blue-950 mb-6 border-b pb-3 flex items-center">
             <MapPin size={24} className="mr-2 text-blue-500" />
             Espaços Físicos ({locations.length})
           </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 border-gray-200">
            {locations.length === 0 ? (
              <p className="col-span-full text-center text-gray-600 py-10 text-lg rounded-lg bg-white shadow-inner">
                Nenhum espaço físico cadastrado ainda.
              </p>
            ) : (
              locations.map((loc) => {
                const subSpaces = loc.children?.filter(child => child.item.sku === LOCATION_SKU).length ?? 0;
                const itemsCount = loc.children?.filter(child => child.item.sku !== LOCATION_SKU).length ?? 0;
                
                return (
                  <div
                    key={loc.id}
                    className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 flex flex-col justify-between transform transition duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex-grow">
                      <div 
                        className="flex items-center mb-3 cursor-pointer"
                        onClick={() => handleViewInstance(loc.id)}
                      >
                        <MapPin size={28} className="text-blue-600 mr-3 p-1 bg-blue-50 rounded-full" />
                        <h2 className="text-xl font-bold text-gray-800 leading-snug">
                          {loc.location || loc.serialNumber}
                        </h2>
                      </div>
                      {loc.notes && (
                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {loc.notes}
                        </p>
                      )}
                      
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <p className="text-indigo-600 text-sm font-medium flex items-center">
                          <Layers size={16} className="text-indigo-500 mr-2" />
                          Subespaços:{" "}
                          <span className="font-extrabold ml-1 text-indigo-700">
                            {subSpaces}
                          </span>
                        </p>
                        <p className="text-teal-600 text-sm font-medium flex items-center">
                          <Box size={16} className="text-teal-500 mr-2" />
                          Itens Contidos:{" "}
                          <span className="font-extrabold ml-1 text-teal-700">
                            {itemsCount}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-between items-center"> {/* Alterado para incluir delete */}
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const recursive = window.confirm(
                                "Você quer deletar também TODOS os itens e subespaços DENTRO deste espaço físico?"
                            );
                            handleDeleteChild(loc.id, recursive);
                        }}
                        className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition duration-200"
                        title="Deletar Espaço Físico"
                      >
                          <Trash2 size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInstance(loc.location); // CORREÇÃO: Usa ID aqui.
                        }}
                        className="flex items-center bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md transform hover:scale-[1.02]"
                      >
                        <Eye size={16} className="mr-2" />
                        Ver Conteúdo
                      </button>
                    </div>
                  </div>
                );
              }))}
          </div>
        </div>

      </div>

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