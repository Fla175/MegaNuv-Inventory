// pages/settings.tsx
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/context/UserContext";
import { useSettingsPermissions } from "@/lib/hooks/useSettingsPermissions";
import { useSettingsData } from "@/lib/hooks/useSettingsData";
import { useRevertHistory } from "@/lib/hooks/useRevertHistory";
import { useCreatorAccess } from "@/lib/hooks/useCreatorAccess";
import { useUserCrud } from "@/lib/hooks/useUserCrud";
import { useSpaceCrud } from "@/lib/hooks/useSpaceCrud";
import { useCategoryCrud } from "@/lib/hooks/useCategoryCrud";
import { useThemeSettings } from "@/lib/hooks/useThemeSettings";
import { useSettingsDelete } from "@/lib/hooks/useSettingsDelete";
import UsersTab from "@/components/settings/UsersTab";
import SpacesTab from "@/components/settings/SpacesTab";
import CategoriesTab from "@/components/settings/CategoriesTab";
import LogsTab from "@/components/settings/LogsTab";
import ThemeTab from "@/components/settings/ThemeTab";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsNav from "@/components/settings/SettingsNav";
import SettingsModals from "@/components/settings/SettingsModals";
import type { SettingsTab } from "@/components/settings/types";

export default function SettingsPage() {
  const router = useRouter();
  const { tab, spaceId } = router.query;
  const [activeTab, setActiveTab] = useState<SettingsTab>("users");
  const { user, refreshUser, loading } = useUser();

  useEffect(() => {
    if (typeof tab === "string") setActiveTab(tab as SettingsTab);
  }, [tab]);

  const permissions = useSettingsPermissions(user);
  const data = useSettingsData({
    activeTab,
    canManageAll: permissions.canManageAll,
    canManageUsers: permissions.canManageUsers,
    canSeeLogs: permissions.canSeeLogs,
  });

  const existingDirector = data.usersList.some((member) => member.role === "DIRECTOR");
  const roleOptions = permissions.buildRoleOptions(existingDirector);

  const revert = useRevertHistory({
    enabled: !!user,
    refreshActiveTabData: data.refreshActiveTabData,
    refreshUser,
  });

  const creator = useCreatorAccess();
  const userCrud = useUserCrud({
    currentUserId: user?.id,
    refreshUsers: data.refreshUsers,
    refreshRevertHistory: revert.fetchRevertHistory,
    refreshUser,
  });
  const spaceCrud = useSpaceCrud({
    refreshSpaces: data.refreshSpaces,
    refreshRevertHistory: revert.fetchRevertHistory,
  });
  const openEditSpace = spaceCrud.openEditSpace;

  // The inventory list's "Editar espaço" action deep-links here. Open the
  // matching space once the spaces tab has loaded, then drop the id so closing
  // the modal does not reopen it after a refresh.
  useEffect(() => {
    if (typeof spaceId !== "string" || !permissions.canManageAll) return;

    const space = data.spacesList.find((item) => item.id === spaceId);
    if (!space) return;

    openEditSpace(space);
    router.replace(
      { pathname: "/settings", query: { tab: "spaces" } },
      undefined,
      { shallow: true }
    );
  }, [
    spaceId,
    permissions.canManageAll,
    data.spacesList,
    openEditSpace,
    router,
  ]);

  const categoryCrud = useCategoryCrud({
    refreshCategories: data.refreshCategories,
    refreshRevertHistory: revert.fetchRevertHistory,
  });
  const theme = useThemeSettings({ refreshUser });
  const deletion = useSettingsDelete({
    currentUserId: user?.id,
    refreshActiveTabData: data.refreshActiveTabData,
    refreshRevertHistory: revert.fetchRevertHistory,
  });

  if (loading) {
    return (
      <Layout title="Configurações">
        <div className="h-96 flex items-center justify-center font-black text-blue-900 animate-pulse italic">
          Sincronizando...
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Configurações">
        <div className="h-96 flex items-center justify-center font-black text-blue-900 animate-pulse italic">
          Carregando...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Configurações">
      <div className="max-w-6xl mx-auto pb-10 lg:pb-20">
        <SettingsHeader revert={revert} />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <SettingsNav
            activeTab={activeTab}
            onSelect={setActiveTab}
            canManageAll={permissions.canManageAll}
            canManageUsers={permissions.canManageUsers}
            canSeeLogs={permissions.canSeeLogs}
          />

          <div className="flex-grow bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-blue-950/5 overflow-hidden min-h-[400px] lg:min-h-[600px]">
            {activeTab === "users" && (
              <UsersTab
                currentUser={user}
                users={data.usersList}
                canManageUsers={permissions.canManageUsers}
                isAdmin={permissions.isAdmin}
                isManager={permissions.isManager}
                onEditSelf={() => userCrud.openEditUser(user)}
                onCreate={userCrud.openCreateUser}
                onEdit={userCrud.openEditUser}
                onDelete={(id) => deletion.handleDelete("user", id)}
                onEnterAccount={creator.openEnterModal}
                onTransferCreator={creator.openTransferModal}
              />
            )}

            {activeTab === "spaces" && permissions.canManageAll && (
              <SpacesTab
                spaces={data.spacesList}
                onCreate={spaceCrud.openCreateSpace}
                onEdit={spaceCrud.openEditSpace}
                onDelete={(id) => deletion.handleDelete("space", id)}
              />
            )}

            {activeTab === "categories" && permissions.canManageUsers && (
              <CategoriesTab
                categories={data.categoriesList}
                onCreate={categoryCrud.openCreateCategory}
                onEdit={categoryCrud.openEditCategory}
                onDelete={(id) => deletion.handleDelete("category", id)}
              />
            )}

            {activeTab === "logs" && permissions.canSeeLogs && (
              <LogsTab
                logs={data.logsList}
                canClear={permissions.canManageAll}
                onClear={() => deletion.handleDelete("logs")}
              />
            )}

            {activeTab === "theme" && (
              <ThemeTab currentTheme={user.theme} onSelect={theme.updateTheme} />
            )}
          </div>
        </div>
      </div>

      <SettingsModals
        userCrud={userCrud}
        categoryCrud={categoryCrud}
        spaceCrud={spaceCrud}
        creator={creator}
        deletion={deletion}
        roleOptions={roleOptions}
        currentUserId={user.id}
      />
    </Layout>
  );
}
