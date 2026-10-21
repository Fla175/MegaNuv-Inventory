// components/settings/SettingsModals.tsx
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import UserModal from "@/components/settings/UserModal";
import CategoryModal from "@/components/settings/CategoryModal";
import SpaceModal from "@/components/settings/SpaceModal";
import EnterAccountModal from "@/components/settings/EnterAccountModal";
import TransferCreatorModal from "@/components/settings/TransferCreatorModal";
import type { RoleOption } from "@/lib/settings/roleOptions";
import type { useUserCrud } from "@/lib/hooks/useUserCrud";
import type { useCategoryCrud } from "@/lib/hooks/useCategoryCrud";
import type { useSpaceCrud } from "@/lib/hooks/useSpaceCrud";
import type { useCreatorAccess } from "@/lib/hooks/useCreatorAccess";
import type { useSettingsDelete } from "@/lib/hooks/useSettingsDelete";

interface SettingsModalsProps {
  userCrud: ReturnType<typeof useUserCrud>;
  categoryCrud: ReturnType<typeof useCategoryCrud>;
  spaceCrud: ReturnType<typeof useSpaceCrud>;
  creator: ReturnType<typeof useCreatorAccess>;
  deletion: ReturnType<typeof useSettingsDelete>;
  roleOptions: RoleOption[];
  currentUserId: string;
}

export default function SettingsModals({
  userCrud,
  categoryCrud,
  spaceCrud,
  creator,
  deletion,
  roleOptions,
  currentUserId,
}: SettingsModalsProps) {
  return (
    <>
      <UserModal
        isOpen={userCrud.isUserModalOpen}
        onClose={userCrud.closeUserModal}
        onSubmit={userCrud.handleUserSubmit}
        saving={userCrud.saving}
        selectedUser={userCrud.selectedUser}
        currentUserId={currentUserId}
        role={userCrud.role}
        roleOptions={roleOptions}
        onRoleChange={(value) => userCrud.setRole(value as typeof userCrud.role)}
      />
      <CategoryModal
        isOpen={categoryCrud.isCategoryModalOpen}
        onClose={categoryCrud.closeCategoryModal}
        onSubmit={categoryCrud.handleCategorySubmit}
        saving={categoryCrud.saving}
        selectedCategory={categoryCrud.selectedCategory}
      />
      <SpaceModal
        isOpen={spaceCrud.isSpaceModalOpen}
        onClose={spaceCrud.closeSpaceModal}
        onSubmit={spaceCrud.handleSpaceSubmit}
        saving={spaceCrud.saving}
        selectedSpace={spaceCrud.selectedSpace}
        spaceImageUrl={spaceCrud.spaceImageUrl}
        onImageChange={spaceCrud.setSpaceImageUrl}
      />
      <EnterAccountModal
        isOpen={creator.isEnterModalOpen}
        targetUser={creator.enterTargetUser}
        password={creator.enterPassword}
        onPasswordChange={creator.setEnterPassword}
        isEntering={creator.isEntering}
        onConfirm={() =>
          creator.enterTargetUser && creator.handleEnterAccount(creator.enterTargetUser)
        }
        onClose={creator.closeEnterModal}
      />
      <TransferCreatorModal
        isOpen={creator.isTransferModalOpen}
        targetUser={creator.transferTargetUser}
        confirmInput={creator.transferConfirmInput}
        onConfirmInputChange={creator.setTransferConfirmInput}
        isTransferring={creator.isTransferring}
        onConfirm={() =>
          creator.transferTargetUser && creator.handleTransferCreator(creator.transferTargetUser)
        }
        onClose={creator.closeTransferModal}
      />
      <ConfirmDialog
        isOpen={deletion.confirmDialog.isOpen}
        title={deletion.confirmDialog.title}
        message={deletion.confirmDialog.message}
        variant={deletion.confirmDialog.variant}
        confirmLabel="Excluir"
        cancelLabel="Manter"
        onConfirm={deletion.confirmDialog.onConfirm}
        onCancel={deletion.closeConfirm}
      />
    </>
  );
}
