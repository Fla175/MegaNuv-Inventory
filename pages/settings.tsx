// pages/settings.tsx
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { 
  UserPlus, Moon, Sun, Monitor, Shield, Save, Loader2, Trash2, UserCircle, Users, Pencil, Clock, Mail, Settings, X, CheckCircle
} from "lucide-react";
import { useUser } from "@/lib/context/UserContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  createdAt: string;
  lastLogin?: string;
  theme?: string;
  defaultSort?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'system'>('profile');
  const { user, refreshUser, loading } = useUser();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Nunca acessou";
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsersList(await res.json());
    } catch (err) {
      console.error("Erro ao carregar usuários", err);
    }
  };

  useEffect(() => { 
    if (activeTab === 'users') loadUsers(); 
  }, [activeTab]);

  // LÓGICA DE ORDENAÇÃO GLOBAL
  const sortedUsers = [...usersList].sort((a, b) => {
    const sortType = user?.defaultSort || 'name';
    if (sortType === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  const openEditUser = (u: User) => {
    setSelectedUser(u);
    setIsUserModalOpen(true);
  };

  const openCreateUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
  
    const url = selectedUser ? `/api/users/${selectedUser.id}` : '/api/users';
    const method = selectedUser ? 'PATCH' : 'POST';
  
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      if (res.ok) {
        setIsUserModalOpen(false);
        loadUsers();
        if (selectedUser?.id === user?.id) await refreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
  
    try {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      if (res.ok) {
        setIsProfileModalOpen(false);
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão permanente? Esta ação não pode ser desfeita.")) return;
  
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (id === user?.id) {
           window.location.href = '/login';
        } else {
           loadUsers();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateTheme = async (newTheme: 'LIGHT' | 'DARK' | 'SISTEM') => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/update-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme })
      });
  
      if (res.ok) {
        await refreshUser(); 
      }
    } catch (err) {
      console.error("Erro na requisição de tema", err);
    } finally {
      setSaving(false);
    }
  };

  const updateSort = async (newSort: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/update-sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultSort: newSort })
      });
      if (res.ok) await refreshUser();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Configurações">
        <div className="flex h-[60vh] items-center justify-center animate-pulse font-black text-blue-900">
          SINCRONIZANDO PREFERÊNCIAS...
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout title="Configurações">
      <div className="max-w-5xl mx-auto transition-colors duration-300 pb-20">
        <div className="flex mb-8">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-md"><Settings size={22}/></div>
          <h1 className="pl-3 text-3xl font-black text-blue-950 dark:text-white italic tracking-tight">Configurações</h1>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="w-full md:w-64 space-y-2 shrink-0">
            {[
              { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'system', label: 'Sistema', icon: Monitor },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'users' | 'system')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                <tab.icon size={20} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all min-h-[500px]">
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-300">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-blue-950 dark:text-white italic">Meu Perfil</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Dados da conta</p>
                    </div>
                    <button onClick={() => setIsProfileModalOpen(true)} className="bg-gray-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl border border-blue-100 dark:border-white/5 hover:bg-blue-600 hover:text-white transition-all">
                      <Pencil size={18}/>
                    </button>
                 </div>
                 <div className="flex flex-col md:flex-row items-center gap-6 mb-10 p-6 bg-gray-50 dark:bg-zinc-950 rounded-3xl border border-gray-100 dark:border-white/5">
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-800 shadow-lg">
                        <UserCircle size={64}/>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-none">{user?.name}</h2>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            <Shield size={10} /> {user?.role}
                        </span>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Mail size={12}/> Email</label>
                        <p className="text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-white/5">{user?.email}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Clock size={12}/> Último Login</label>
                        <p className="text-gray-700 dark:text-gray-300 font-bold text-sm bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl border border-gray-100 dark:border-white/5">{formatDate(user?.lastLogin)}</p>
                    </div>
                 </div>
                 <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5 flex justify-end">
                    <button onClick={() => handleDelete(user?.id || '')} className="text-red-400 dark:text-red-500/50 hover:text-red-600 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                        Excluir Conta <Trash2 size={14}/>
                    </button>
                 </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-blue-950 dark:text-white italic">Usuários</h3>
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">Gestão de Acessos</p>
                    </div>
                    {(isAdmin || isManager) && (
                        <button onClick={openCreateUser} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95">
                          <UserPlus size={20}/>
                        </button>
                    )}
                 </div>
                 <div className="space-y-3">
                    {/* AQUI USAMOS A LISTA ORDENADA */}
                    {sortedUsers.filter(u => u.id !== user?.id).map((u) => (
                        <div key={u.id} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950 border border-transparent hover:border-blue-500/30 rounded-2xl transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs bg-blue-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400">
                                    {u.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight">{u.name}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{u.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(isAdmin || (isManager && u.role !== 'ADMIN')) && (
                                    <>
                                      <button onClick={() => openEditUser(u)} className="text-gray-400 hover:text-blue-500 p-2"><Pencil size={16}/></button>
                                      <button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {usersList.length <= 1 && (
                      <div className="text-center py-10 opacity-20 font-black uppercase text-xs tracking-widest">Nenhum outro membro</div>
                    )}
                 </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-2xl font-black text-blue-950 dark:text-white mb-8 italic">Sistema</h3>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tema da Aplicação</label>
                        <div className="grid grid-cols-3 gap-4">
                            {(['LIGHT', 'DARK', 'SISTEM'] as const).map((t) => (
                                <button key={t} onClick={() => updateTheme(t)} disabled={saving} className={`flex flex-col items-center gap-3 p-4 border rounded-[1.5rem] transition-all ${user?.theme === t ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-inner' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-950'}`}>
                                    {t === 'LIGHT' && <Sun size={20} className={user?.theme === t ? 'text-blue-600' : 'text-gray-400'}/>}
                                    {t === 'DARK' && <Moon size={20} className={user?.theme === t ? 'text-blue-600' : 'text-gray-400'}/>}
                                    {t === 'SISTEM' && <Monitor size={20} className={user?.theme === t ? 'text-blue-600' : 'text-gray-400'}/>}
                                    <span className={`text-[10px] font-black uppercase ${user?.theme === t ? 'text-blue-600' : 'text-gray-500'}`}>
                                      {t === 'LIGHT' ? 'CLARO' : t === 'DARK' ? 'ESCURO' : 'SISTEMA'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Ordenação Padrão</label>
                    <select 
                      value={user?.defaultSort || "name"}
                      onChange={(e) => updateSort(e.target.value)} 
                      disabled={saving} 
                      className="w-full p-4 bg-gray-50 dark:bg-zinc-950 dark:text-white border border-gray-100 dark:border-white/5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="name">Ordem Alfabética (A-Z)</option>
                      <option value="newest">Mais Recentes Primeiro</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border dark:border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-blue-950 dark:text-white">Editar Perfil</h3>
              <button type="button" onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="space-y-4 mb-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Seu Nome</label>
              <input 
                name="name" 
                defaultValue={user?.name || ''}
                className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500" 
                required 
              />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email</label>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={user?.email || ''}
                  className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar Alterações
            </button>
          </form>
        </div>
      )}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleUserSubmit} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border dark:border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-blue-950 dark:text-white">
                {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="space-y-4 mb-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nome Completo</label>
                <input 
                  name="name" 
                  defaultValue={selectedUser?.name || ''}
                  className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Email</label>
                <input 
                  name="email" 
                  type="email" 
                  defaultValue={selectedUser?.email || ''}
                  className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                  {selectedUser ? 'Nova Senha' : 'Senha de Acesso'}
                </label>
                <input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500" 
                  required={!selectedUser}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Nível de Acesso</label>
                <select name="role" defaultValue={selectedUser?.role || 'VIEWER'} className="w-full bg-gray-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="VIEWER">Visualizador</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
              {selectedUser ? 'Atualizar Usuário' : 'Criar Usuário'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}