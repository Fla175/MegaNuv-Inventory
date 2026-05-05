// pages/index.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import HeaderSection from "@/components/HeaderSection";
import SearchSection from "@/components/SearchSection";
import ListSection from "@/components/ListSection";
import ActiveForm from "@/components/actives/activeForm";
import { useUser } from "@/lib/context/UserContext";

export default function GestaoAtivosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "clone">("create");
  const [selectedActive, setSelectedActive] = useState<any>(null);
  const [fatherSpaces, setFatherSpaces] = useState([]);
  const [actives, setActives] = useState([]);
  const { refreshUser } = useUser();

  const loadData = async () => {
    try {
      const [resSpaces, resActives] = await Promise.all([
        fetch('/api/father-spaces/list'),
        fetch('/api/actives/list')
      ]);

      if (resSpaces.ok) {
        const data = await resSpaces.json();
        setFatherSpaces(data);
      }

      if (resActives.ok) {
        const data = await resActives.json();
        setActives(data);
      }
    } catch (error) {
      // Erro silencioso - dados serão recarregados no próximo refresh
    }
  };

  useEffect(() => {
    loadData();
    refreshUser();
  }, [refreshUser]);

  const [filters, setFilters] = useState({
    query: "",
    searchCategory: "",
    manufacturer: "",
    model: "",
    category: "",
    tag: "",
  });

  const handleOpenForm = (mode: "create" | "edit" | "clone", data: any = null) => {
    setFormMode(mode);
    setSelectedActive(data);
    setIsFormOpen(true);
  };

  return (
    <Layout title="Gestão de Ativos">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        <HeaderSection onNewActive={() => handleOpenForm("create")} />
        <SearchSection filters={filters} setFilters={setFilters} />

        <ListSection 
          actives={actives}
          fatherSpaces={fatherSpaces}
          filters={filters} 
          onRefresh={loadData}
          onEdit={(data: any) => handleOpenForm("edit", data)}
          onClone={(data: any) => handleOpenForm("clone", data)}
        />
      </div>

      {isFormOpen && (
        <ActiveForm 
          mode={formMode}
          initialData={selectedActive}
          fatherSpace={fatherSpaces} 
          activeContainers={actives.filter((a: any) => a.isPhysicalSpace === true)}
          onClose={() => {
            setIsFormOpen(false);
            loadData();
          }} 
        />
      )}
    </Layout>
  );
}
