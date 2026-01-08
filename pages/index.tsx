// pages/index.tsx
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PlusCircle, Eye, MapPin, Warehouse, Trash2, Layers, Box } from "lucide-react";
import AddLocationModal from "../components/AddLocationModal";

interface ItemInstanceLocation {
  id: string;
  name: string;
  parentId: string | null;
  _count?: {
    items: number;
    children: number;
  };
}

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<ItemInstanceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showFeedback = (msg: string, type: "success" | "error") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/item-instances/list?onlyRoots=true", {
        credentials: "include",
      });
      const data = await response.json();
      setLocations(data.itemInstances || []);
    } catch (err) {
      showFeedback("Erro ao carregar inventário.", "error");
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO DE EXCLUSÃO CORRIGIDA E SINCRONIZADA
  const handleDeleteLocation = async (id: string, isForced = false): Promise<void> => {
    try {
      const res = await fetch(`/api/item-instances/delete?id=${id}${isForced ? '&force=true' : ''}`, {
        method: 'DELETE',
      });
  
      const data = await res.json();
  
      // Se a API pedir confirmação por ter conteúdo
      if (res.status === 409 && data.requireConfirmation) {
        const confirmacao = window.confirm(
          `Atenção: Este espaço contém ${data.details?.items || 0} itens e ${data.details?.subspaces || 0} subespaços. ` +
          "Ao confirmar, TUDO será excluído permanentemente. Deseja continuar?"
        );
  
        if (confirmacao) {
          return handleDeleteLocation(id, true);
        }
        return; 
      }
  
      if (res.ok) {
        showFeedback("Espaço removido com sucesso", "success");
        fetchLocations(); 
      } else {
        showFeedback(data.message || "Não foi possível excluir o espaço.", "error");
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
      showFeedback("Erro de conexão ao tentar excluir.", "error");
    }
  };

  const handleAddLocation = async (name: string) => {
    try {
      const res = await fetch("/api/item-instances/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: null }),
      });
      if (!res.ok) throw new Error("Erro ao criar.");
      fetchLocations();
      setIsModalOpen(false);
      showFeedback("Novo espaço pai criado!", "success");
    } catch (err: any) {
      showFeedback(err.message, "error");
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  if (loading) return <Layout><div className="p-20 text-center font-black animate-pulse text-blue-900">CARREGANDO...</div></Layout>;

  return (
    <Layout title="Meu Inventário">
      <div className={`max-w-6xl mx-auto py-8 px-4 transition-all ${isModalOpen ? "blur-sm" : ""}`}>
        <Head><title>Inventário | MegaNuv</title></Head>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100">
              <Warehouse size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-blue-950 tracking-tighter">Meu Inventário</h1>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Espaços Físicos</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl transition-all flex items-center gap-2"
          >
            <PlusCircle size={20} /> Novo Espaço Pai
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mb-8 p-4 rounded-2xl font-bold text-center border animate-in fade-in duration-300 ${feedback.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
            {feedback.msg}
          </div>
        )}

        {/* Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map((loc) => (
            <div key={loc.id} className="group bg-white border rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all flex flex-col overflow-hidden">
              <div className="p-8 flex-1">
                <div className="flex justify-between mb-6">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <MapPin size={28} />
                  </div>
                  <button 
                    onClick={() => handleDeleteLocation(loc.id)} 
                    className="text-gray-200 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <h2 className="text-2xl font-black text-blue-950 mb-6 group-hover:text-blue-600 transition-colors line-clamp-1">{loc.name}</h2>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-4 rounded-2xl text-center border border-transparent group-hover:border-blue-50 transition-all">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Subespaços</p>
                    <span className="text-xl font-black text-indigo-600">{loc._count?.children || 0}</span>
                  </div>
                  <div className="flex-1 bg-gray-50 p-4 rounded-2xl text-center border border-transparent group-hover:border-blue-50 transition-all">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-tighter">Itens</p>
                    <span className="text-xl font-black text-teal-600">{loc._count?.items || 0}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/inventory-view?location=${loc.id}`)}
                className="w-full bg-blue-50 group-hover:bg-blue-600 py-5 text-xs font-black uppercase text-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2 border-t border-blue-100/50 group-hover:border-transparent"
              >
                Explorar Inventário <Eye size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <AddLocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLocationAdded={handleAddLocation}
        isLoading={false}
        error={null}
      />
    </Layout>
  );
}