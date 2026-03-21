// pages/settings.tsx
import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { 
  UserPlus, Moon, Sun, Monitor, Shield, Loader2, Trash2, 
  UserCircle, Users, Pencil, Clock, Mail, Settings, X, CheckCircle, 
  Plus, LayoutDashboard, ChevronRight, Hash, Info, 
  CalendarFold, KeyRound, CirclePlus, ArrowDownAZ, CalendarArrowDown
} from "lucide-react";
import { useUser } from "@/lib/context/UserContext";

interface User {
  id: string;
  name: string | null; 
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  createdAt: string | Date;
  lastLogin?: string | Date | null;
  theme?: string;
  defaultSort?: string;
}

interface FatherSpace {
  id: string;
  name: string;
  notes?: string;
}

type TabType = 'users' | 'spaces' | 'system';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const { user, refreshUser, loading } = useUser();
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<FatherSpace | null>(null);
  const [spacesList, setSpacesList] = useState<FatherSpace[]>([]);
  
  const [saving, setSaving] = useState(false);

  // Auxiliares de Permissão
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const canManageUsers = isAdmin || isManager;

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsersList(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadSpaces = async () => {
    try {
      const res = await fetch('/api/father-spaces/list');
      if (res.ok) setSpacesList(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    if (activeTab === 'users') loadUsers(); 
    if (activeTab === 'spaces') loadSpaces();
  }, [activeTab]);

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const isEditingSelf = selectedUser?.id === user?.id;
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
        if (isEditingSelf) await refreshUser();
      }
    } finally { setSaving(false); }
  };

  const handleSpaceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
  
    // 1. Pega os dados dos inputs (name e notes)
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);
  
    // 2. Se for edição, precisamos garantir que o ID vá no corpo da requisição
    if (selectedSpace) {
      payload.id = selectedSpace.id;
    }

    const url = selectedSpace ? '/api/father-spaces/update' : '/api/father-spaces/create';
    const method = selectedSpace ? 'PATCH' : 'POST';
  
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (res.ok) {
        setIsSpaceModalOpen(false);
        loadSpaces();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao atualizar");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: 'user' | 'space', id: string) => {
    if (!confirm(`Confirmar exclusão permanente?`)) return;
    try {
      const endpoint = type === 'user' ? `/api/users/${id}` : `/api/father-spaces/delete?id=${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      if (res.ok) {
        if (type === 'user') {
          if (id === user?.id) {
            window.location.href = '/login';
          } else {
            loadUsers();
          }
        } else {
          loadSpaces();
        }
      }
    } catch (err) { console.error(err); }
  };

  const updateConfig = async (body: Record<string, string>, endpoint: string) => {
    setSaving(true);
    try {
      await fetch(`/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      await refreshUser();
    } finally { setSaving(false); }
  };

  if (loading || !user) return <Layout title="Configurações"><div className="h-96 flex items-center justify-center font-black text-blue-900 animate-pulse italic">SINCRONIZANDO...</div></Layout>;

  const tabs = [
    { id: 'users', label: 'Acessos e Equipe', icon: Users },
    ...(isAdmin ? [{ id: 'spaces', label: 'Espaços Pai', icon: LayoutDashboard }] : []),
    { id: 'system', label: 'Preferências', icon: Monitor },
  ];

  return (
    <Layout title="Configurações">
      <div className="max-w-6xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Settings size={24}/></div>
          <div>
            <h1 className="text-3xl font-black text-blue-950 dark:text-white italic tracking-tighter uppercase">Configurações</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Painel de Controle e Perfil</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72 space-y-2 shrink-0">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-black transition-all text-xs uppercase tracking-tight ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-xl translate-x-2' 
                    : 'bg-white dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 hover:text-blue-600 border border-gray-100 dark:border-white/5'
                }`}
              >
                <div className="flex items-center gap-3"><tab.icon size={18} /> {tab.label}</div>
                {activeTab === tab.id && <ChevronRight size={14}/>}
              </button>
            ))}
          </div>

          <div className="flex-grow bg-white dark:bg-zinc-900 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-blue-950/5 overflow-hidden min-h-[600px]">
            
            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-8 md:p-12 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-zinc-950/30">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                      <div className="w-28 h-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform">
                        <UserCircle size={60} />
                      </div>
                      <button onClick={() => { setSelectedUser(user as User); setIsUserModalOpen(true); }} className="absolute -bottom-2 -right-2 bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-lg text-blue-600 border border-gray-100 dark:border-white/5">
                        <Pencil size={16}/>
                      </button>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="flex items-center gap-3 justify-center md:justify-start">
                        <h2 className="text-3xl font-black text-blue-950 dark:text-white italic uppercase tracking-tighter">{user.name || 'Usuário'}</h2>
                        <span className={`px-3 py-1 ${user.role === "ADMIN" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" : user.role === "MANAGER" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"} text-[9px] font-black rounded-full uppercase tracking-widest border`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-gray-400 font-bold text-sm mt-1">{user.email}</p>
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest justify-center md:justify-start">
                          <CalendarFold size={12}/> Desde {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        {user.lastLogin && (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest justify-center md:justify-start">
                            <Clock size={12}/> Último login em {new Date(user.lastLogin).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
                      {canManageUsers ? "Gestão de Equipe" : "Membros do Sistema"}
                    </h3>
                    {canManageUsers && (
                      <button onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                        <UserPlus size={16}/> Novo Membro
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {usersList.filter(u => u.id !== user.id).length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-950/30">
                        <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-full mb-4">
                          <Users size={32} className="text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h4 className="text-lg font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">Equipe Vazia</h4>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2 max-w-xs">
                          Você é o único membro cadastrado no sistema no momento.
                        </p>
                        {canManageUsers && (
                          <button onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }} className="mt-6 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1 transition-all">
                            <UserPlus size={14}/> Adicionar Novo Membro
                          </button>
                        )}
                      </div>
                    ) : (
                      usersList.filter(u => u.id !== user.id).map(u => {
                        const canEditThisUser = isAdmin || (isManager && u.role !== 'ADMIN');
                        return (
                          <div key={u.id} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-zinc-950 rounded-[1.5rem] border border-transparent hover:border-blue-500/20 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center font-black text-blue-600 shadow-sm border border-gray-100 dark:border-white/5">
                                {(u.name || 'US').substring(0,2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-blue-950 dark:text-white text-sm uppercase italic">{u.name || 'Sem nome'}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{u.role} • {u.email}</p>
                              </div>
                            </div>
                            {canEditThisUser && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"><Pencil size={16}/></button>
                                <button onClick={() => handleDelete('user', u.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'spaces' && isAdmin && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter leading-none">Espaços Pai</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Unidades estruturais do inventário</p>
                  </div>
                  <button onClick={() => { setSelectedSpace(null); setIsSpaceModalOpen(true); }} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform active:scale-95">
                    <Plus size={24} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {spacesList.length === 0 ? (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-950/30">
                      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-full mb-4">
                        <LayoutDashboard size={32} className="text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <h4 className="text-lg font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">Nenhum Espaço Criado</h4>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2 max-w-sm">
                        Crie unidades estruturais (como Galpões ou Prédios) para começar a organizar seu inventário fisicamente.
                      </p>
                      <button onClick={() => { setSelectedSpace(null); setIsSpaceModalOpen(true); }} className="mt-6 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1 transition-all">
                        <Plus size={14}/> Configurar Primeiro Espaço
                      </button>
                    </div>
                  ) : (
                    spacesList.map((space) => (
                      <div key={space.id} className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5 flex flex-col justify-between group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><LayoutDashboard size={80} /></div>
                        <div className="relative z-10">
                            <h4 className="text-xl font-black text-blue-950 dark:text-white uppercase italic mt-2">{space.name}</h4>
                            <p className="text-xs text-zinc-500 mt-2 line-clamp-2 font-medium">{space.notes || 'Sem observações técnicas.'}</p>
                        </div>
                          <div className="flex gap-3 mt-6 relative z-10">
                              <button onClick={() => { setSelectedSpace(space); setIsSpaceModalOpen(true); }} className="flex-1 bg-white dark:bg-zinc-800 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all"><Pencil size={14}/> Editar</button>
                              <button onClick={() => handleDelete('space', space.id)} className="px-4 bg-white dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-red-500 border border-zinc-200 dark:border-white/5 transition-all"><Trash2 size={16}/></button>
                          </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic mb-10 tracking-tighter">Preferências</h3>
                
                {/* SEÇÃO: ESQUEMA VISUAL */}
                <div className="space-y-4 mb-12">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Esquema Visual</label>
                  <div className="grid grid-cols-3 gap-4">
                    {(['LIGHT', 'DARK', 'SISTEM'] as const).map(t => (
                      <button key={t} onClick={() => updateConfig({ theme: t }, 'update-theme')} className={`flex flex-col items-center gap-3 p-6 border rounded-[2rem] transition-all ${user.theme === t ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-inner' : 'border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100'}`}>
                        {t === 'LIGHT' ? <Sun size={20}/> : t === 'DARK' ? <Moon size={20}/> : <Monitor size={20}/>}
                        <span className="text-[10px] font-black uppercase">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NOVO: ORDENAÇÃO PADRÃO ABAIXO DO ESQUEMA VISUAL */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Ordenação Padrão do Sistema</label>
                  <div className="relative group max-w-sm">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${user.defaultSort === "name" ? "text-blue-600" : "text-amber-600"} group-hover:rotate-12 transition-transform`}>
                      {
                        user.defaultSort === "name" ?
                        <ArrowDownAZ size={18} />
                        :
                        <CalendarArrowDown size={18} />
                      }
                    </div>
                    <select 
                      value={user.defaultSort || 'name'} 
                      onChange={(e) => updateConfig({ defaultSort: e.target.value }, 'update-sort')}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white pl-12 pr-4 py-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-600 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="name">Alfabética (A-Z)</option>
                      <option value="newest">Recentes</option>
                    </select>
                  </div>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider ml-2">Define como as listagens serão exibidas inicialmente para você.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE USUÁRIO - Sem campo de ordenação aqui */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleUserSubmit} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">
                {selectedUser ? (selectedUser.id === user.id ? 'Meu Perfil' : 'Editar Membro') : 'Novo Membro'}
              </h3>
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="text-zinc-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="space-y-5 mb-10">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><UserCircle size={10}/> Nome Completo</label>
                <input name="name" defaultValue={selectedUser?.name || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-600" required />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><Mail size={10}/> Email</label>
                <input name="email" type="email" defaultValue={selectedUser?.email || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-600" required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><KeyRound size={10}/> {selectedUser ? 'Alterar Senha (Opcional)' : 'Senha de Acesso'}</label>
                <input 
                  name="password" 
                  type="password" 
                  placeholder={selectedUser ? "Deixe em branco para manter" : "Mínimo 6 caracteres"} 
                  className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-600" 
                  required={!selectedUser} 
                />
              </div>

              {selectedUser?.id !== user.id && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><Shield size={10}/> Nível de Permissão</label>
                  <select name="role" defaultValue={selectedUser?.role || 'VIEWER'} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-600">
                    <option value="VIEWER">Visualizador</option>
                    <option value="MANAGER">Gerente</option>
                    {isAdmin && <option value="ADMIN">Administrador</option>}
                  </select>
                </div>
              )}
            </div>

            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>} Confirmar Dados
            </button>
          </form>
        </div>
      )}

      {/* MODAL DE ESPAÇO PAI */}
      {isSpaceModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSpaceSubmit} className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">{selectedSpace ? 'Configurar Espaço' : 'Novo Espaço Pai'}</h3>
              <button type="button" onClick={() => setIsSpaceModalOpen(false)} className="text-zinc-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>
            <div className="space-y-6 mb-10">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><Hash size={10}/> Nome do Local</label>
                <input name="name" placeholder="Ex: Galpão A" defaultValue={selectedSpace?.name || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-600" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><Info size={10}/> Notas Estruturais</label>
                <textarea name="notes" rows={4} defaultValue={selectedSpace?.notes || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-blue-600 resize-none" placeholder="Detalhes técnicos..."></textarea>
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <CirclePlus size={18}/>} {selectedSpace ? 'Atualizar Estrutura' : 'Criar Espaço'}
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}