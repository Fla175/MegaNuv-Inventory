// components/settings/UsersTab.tsx
import {
  CalendarFold,
  Clock,
  KeyRound,
  LogIn,
  Pencil,
  Plus,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react";
import type { SettingsUser } from "@/components/settings/types";

interface UsersTabProps {
  currentUser: SettingsUser;
  users: SettingsUser[];
  canManageUsers: boolean;
  isAdmin: boolean;
  isManager: boolean;
  onEditSelf: () => void;
  onCreate: () => void;
  onEdit: (user: SettingsUser) => void;
  onDelete: (id: string) => void;
  onEnterAccount: (user: SettingsUser) => void;
  onTransferCreator: (user: SettingsUser) => void;
}

function roleBadgeClass(role: SettingsUser["role"]) {
  if (role === "DIRECTOR") {
    return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400";
  }
  if (role === "ADMIN") {
    return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400";
  }
  if (role === "MANAGER") {
    return "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400";
  }
  return "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400";
}

function roleLabel(role: SettingsUser["role"]) {
  if (role === "MANAGER") return "Gerente";
  if (role === "VIEWER") return "Visualizador";
  if (role === "DIRECTOR") return "Diretor";
  return "ADMIN";
}

export default function UsersTab({
  currentUser,
  users,
  canManageUsers,
  isAdmin,
  isManager,
  onEditSelf,
  onCreate,
  onEdit,
  onDelete,
  onEnterAccount,
  onTransferCreator,
}: UsersTabProps) {
  const otherUsers = users.filter((user) => user.id !== currentUser.id);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-4 md:p-6 lg:p-8 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-950/30">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <div className="relative group">
            <div className="w-20 h-20 lg:w-28 lg:h-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform">
              <UserCircle size={40} className="lg:hidden" />
              <UserCircle size={60} className="hidden lg:block" />
            </div>
            <button
              onClick={onEditSelf}
              className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-lg text-blue-600 border border-gray-100 dark:border-white/5"
            >
              <Pencil size={16} />
            </button>
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <h2 className="text-2xl lg:text-3xl font-black text-blue-950 dark:text-white italic uppercase tracking-tighter">
                {currentUser.name || "Usuário"}
              </h2>
              <span
                className={`px-3 py-1 ${roleBadgeClass(
                  currentUser.role
                )} text-[9px] font-black rounded-full uppercase tracking-widest border border-current`}
              >
                {currentUser.role}
              </span>
            </div>
            <p className="text-gray-400 font-bold text-sm mt-1">{currentUser.email}</p>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-3 md:mt-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest justify-center md:justify-start">
                <CalendarFold size={12} /> Desde{" "}
                {new Date(currentUser.createdAt).toLocaleDateString()}
              </div>
              {currentUser.lastLogin && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest justify-center md:justify-start">
                  <Clock size={12} /> Login em{" "}
                  {new Date(currentUser.lastLogin).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6 lg:mb-8">
          <h3 className="text-xl lg:text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
            Membros da Equipe
          </h3>
          {canManageUsers && (
            <button
              onClick={onCreate}
              className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20"
            >
              <Plus size={24} />
            </button>
          )}
        </div>

        {otherUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <Users size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-black text-gray-400 uppercase italic">
              Nenhum membro cadastrado
            </p>
            <p className="text-xs font-bold text-gray-500 mt-1">Adicione membros à equipe</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            {otherUsers.map((user) => {
              const isTargetHigherRank =
                (isManager && user.role !== "VIEWER") ||
                (isAdmin && user.role === "DIRECTOR");
              const showActionButtons = canManageUsers && !isTargetHigherRank;

              return (
                <div
                  key={user.id}
                  className="bg-zinc-50 dark:bg-zinc-950 p-3 lg:p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <UserCircle size={18} className="text-zinc-400 shrink-0" />
                      <h4 className="text-base lg:text-xl font-black text-blue-950 dark:text-white uppercase italic">
                        {user.name || "Usuário"}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-zinc-500 font-medium italic">{user.email}</p>
                      <span
                        className={`px-2 py-0.5 ${roleBadgeClass(
                          user.role
                        )} text-[9px] font-black rounded-full uppercase tracking-widest border border-current`}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {currentUser.isCreator && (
                      <>
                        <button
                          onClick={() => onEnterAccount(user)}
                          className="flex-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-300/40 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center justify-center gap-1.5 transition-all"
                          title="Entrar nesta conta (requer sua senha)"
                        >
                          <LogIn size={14} /> Entrar
                        </button>
                        <button
                          onClick={() => onTransferCreator(user)}
                          className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 flex items-center justify-center gap-1.5 transition-all"
                          title="Ceder título de criador"
                        >
                          <KeyRound size={14} /> Ceder
                        </button>
                      </>
                    )}

                    {showActionButtons && (
                      <>
                        <button
                          onClick={() => onEdit(user)}
                          className="flex-1 bg-white dark:bg-zinc-800 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(user.id)}
                          className="px-4 bg-white dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-red-500 border border-zinc-200 dark:border-white/5 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
