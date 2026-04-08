// pages/settings.tsx
import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { 
  UserPlus, Moon, Sun, Monitor, Shield, Loader2, Trash2, 
  UserCircle, Users, Pencil, Clock, Mail, Settings, X, CheckCircle, 
  Plus, LayoutDashboard, ChevronRight, 
  CalendarFold, KeyRound, CirclePlus, ArrowDownAZ, CalendarArrowDown,
  Activity, ClipboardList, Group
} from "lucide-react";
import { useUser } from "@/lib/context/UserContext";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
import InteractiveFace from "@/components/svg/sad-face";

// --- INTERFACES ---
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

interface Area {
  id: string;
  name: string;
  color?: string;
}

interface Log {
  id: string;
  action: string;
  resource: string;
  details: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

type TabType = 'users' | 'spaces' | 'categories' | 'logs' | 'system';

export default function SettingsPage() {
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const { user, refreshUser, loading } = useUser();
  const [saving, setSaving] = useState(false);

  // Estados de Listagem
  const [usersList, setUsersList] = useState<User[]>([]);
  const [spacesList, setSpacesList] = useState<FatherSpace[]>([]);
  const [categoriesList, setCategoriesList] = useState<Area[]>([]);
  const [logsList, setLogsList] = useState<Log[]>([]);

  // Estados de Modais
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<FatherSpace | null>(null);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedColor, setSelectedColor] = useState('#4F46E5');

  // Permissões
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const canManageUsers = isAdmin || isManager;
  const canSeeLogs = isAdmin || isManager;

  // Fechar modais com Esc
  useEscapeKey(() => setIsUserModalOpen(false), isUserModalOpen);
  useEscapeKey(() => setIsSpaceModalOpen(false), isSpaceModalOpen);
  useEscapeKey(() => setIsAreaModalOpen(false), isAreaModalOpen);

  // --- CARREGAMENTO DE DADOS ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchData = async (endpoint: string, setter: (data: any) => void) => {
    try {
      const res = await fetch(endpoint);
      if (res.ok) setter(await res.json());
    } catch (err) { console.error(`Erro ao carregar ${endpoint}:`, err); }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchData('/api/users', setUsersList);
    if (activeTab === 'spaces' && isAdmin) fetchData('/api/father-spaces/list', setSpacesList);
    if (activeTab === 'categories' && isAdmin) fetchData('/api/categories/list', setCategoriesList);
    if (activeTab === 'logs' && canSeeLogs) fetchData('/api/logs/list', setLogsList);
    if (tab) {
      setActiveTab(tab as TabType);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tab, user]);

  // --- HANDLERS ---
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
        fetchData('/api/users', setUsersList);
        if (isEditingSelf) await refreshUser();
      }
    } finally { setSaving(false); }
  };

  const handleSpaceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    if (selectedSpace) payload.id = selectedSpace.id;

    try {
      const res = await fetch(selectedSpace ? '/api/father-spaces/update' : '/api/father-spaces/create', {
        method: selectedSpace ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsSpaceModalOpen(false);
        fetchData('/api/father-spaces/list', setSpacesList);
      }
    } finally { setSaving(false); }
  };

  const handleAreaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    if (selectedArea) payload.id = selectedArea.id;

    try {
      const res = await fetch(selectedArea ? '/api/categories/update' : '/api/categories/create', {
        method: selectedArea ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAreaModalOpen(false);
        fetchData('/api/categories/list', setCategoriesList);
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (type: 'user' | 'space' | 'category' | 'logs', id?: string) => {
    if (!confirm(`Confirmar exclusão permanente? Esta ação será registrada.`)) return;
    try {
      let endpoint = "";
      if (type === 'user') endpoint = `/api/users/${id}`;
      else if (type === 'space') endpoint = `/api/father-spaces/delete?id=${id}`;
      else if (type === 'category') endpoint = `/api/categories/delete?id=${id}`;
      else if (type === 'logs') endpoint = `/api/logs/clear`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        if (type === 'user' && id === user?.id) window.location.href = '/login';
        else if (activeTab === 'users') fetchData('/api/users', setUsersList);
        else if (activeTab === 'spaces') fetchData('/api/father-spaces/list', setSpacesList);
        else if (activeTab === 'categories') fetchData('/api/categories/list', setCategoriesList);
        else if (activeTab === 'logs') fetchData('/api/logs/list', setLogsList);
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

  if (loading) return <Layout title="Configurações"><div className="h-96 flex items-center justify-center font-black text-blue-900 animate-pulse italic">Sincronizando...</div></Layout>;

  if (!user) return (
    <Layout title="Configurações">
      <div className="h-96 flex flex-col items-center justify-center font-black text-blue-900 italic gap-4">
        <div className="w-16 h-16 text-blue-600"><InteractiveFace /></div>
        <p>Usuário não encontrado. <span className="text-blue-500 underline cursor-pointer" onClick={refreshUser}>Recarregue.</span></p>
      </div>
    </Layout>
  );

  const tabs = [
    { id: 'users', label: 'Acessos e Equipe', icon: Users, show: true },
    { id: 'spaces', label: 'Espaços Pai', icon: LayoutDashboard, show: isAdmin },
    { id: 'categories', label: 'Categorias', icon: Group, show: canManageUsers },
    { id: 'logs', label: 'Logs', icon: ClipboardList, show: canSeeLogs },
    { id: 'system', label: 'Preferências', icon: Monitor, show: true },
  ];

  return (
    <Layout title="Configurações">
      <div className="max-w-6xl mx-auto pb-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20"><Settings size={24}/></div>
          <div>
            <h1 className="text-3xl font-black text-blue-950 dark:text-white italic tracking-tighter uppercase">Configurações</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Painel de Controle e personalização</p>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* MENU LATERAL */}
          <div className="w-full lg:w-72 space-y-2 shrink-0">
            {tabs.filter(t => t.show).map((tab) => (
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
            
            {/* TAB: USERS (MEU PERFIL + GESTÃO) */}
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
                        <span className={`px-3 py-1 ${user.role === "ADMIN" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : user.role === "MANAGER" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"} text-[9px] font-black rounded-full uppercase tracking-widest border border-current`}>
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
                            <Clock size={12}/> Login em {new Date(user.lastLogin).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">Membros da Equipe</h3>
                    {canManageUsers && (
                      <button onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        <UserPlus size={16}/> Novo Membro
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {usersList.filter(u => u.id !== user.id).map(u => (
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
                        {(isAdmin || (isManager && u.role !== 'ADMIN')) && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-600"><Pencil size={16}/></button>
                            <button onClick={() => handleDelete('user', u.id)} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SPACES */}
            {activeTab === 'spaces' && isAdmin && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">Espaços Pai</h3>
                  <button onClick={() => { setSelectedSpace(null); setIsSpaceModalOpen(true); }} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20"><Plus size={24} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {spacesList.map((space) => (
                    <div key={space.id} className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5 flex flex-col justify-between group">
                      <div>
                        <h4 className="text-xl font-black text-blue-950 dark:text-white uppercase italic mt-1">{space.name}</h4>
                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2 font-medium">{space.notes || 'Sem observações.'}</p>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button onClick={() => { setSelectedSpace(space); setIsSpaceModalOpen(true); }} className="flex-1 bg-white dark:bg-zinc-800 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5 hover:bg-blue-600 hover:text-white transition-all">Editar</button>
                        <button onClick={() => handleDelete('space', space.id)} className="px-4 bg-white dark:bg-zinc-800 rounded-xl text-zinc-400 hover:text-red-500 border border-zinc-200 dark:border-white/5 transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: AREAS */}
            {activeTab === 'categories' && isAdmin && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">Categorias</h3>
                  <button onClick={() => { setSelectedArea(null); setSelectedColor('#4F46E5'); setIsAreaModalOpen(true); }} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20"><Plus size={24} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categoriesList.map((category) => (
                    <div key={category.id} className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-[2rem] border border-zinc-100 dark:border-white/5 flex flex-col items-center text-center group">
                      <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: category.color || '#2563eb' }}>
                        <Group size={24} />
                      </div>
                      <h4 className="text-sm font-black text-blue-950 dark:text-white uppercase italic">{category.name}</h4>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { setSelectedArea(category); setSelectedColor(category.color || '#4F46E5'); setIsAreaModalOpen(true); }} className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-blue-600"><Pencil size={14}/></button>
                        <button onClick={() => handleDelete('category', category.id)} className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: LOGS */}
            {activeTab === 'logs' && canSeeLogs && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">Logs</h3>
                  {isAdmin && (
                    <button onClick={() => handleDelete('logs')} className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline transition-all">
                      <Trash2 size={14}/> Limpar Tudo
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {logsList.length === 0 ? (
                    <div className="py-20 text-center text-zinc-400 font-black uppercase text-xs">Nenhum log encontrado.</div>
                  ) : (
                    logsList.map((log) => (
                      <div key={log.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-white/5 flex items-start gap-4 text-[11px]">
                        <div className={`p-2 rounded-lg shrink-0 ${log.action.includes('DELETE') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Activity size={14}/>
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <span className="font-black text-blue-950 dark:text-white uppercase italic">{log.action}</span>
                            <span className="text-zinc-400 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-zinc-500 mt-1 font-bold">{log.details}</p>
                          <p className="text-[9px] font-black text-blue-600 uppercase mt-2">Por: {log.user.name || log.user.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SYSTEM */}
            {activeTab === 'system' && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic mb-10 tracking-tighter">Preferências</h3>
                
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

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">Ordenação Padrão</label>
                  <div className="relative group max-w-sm">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${user.defaultSort === "name" ? "text-blue-600" : "text-amber-600"}`}>
                      {user.defaultSort === "name" ? <ArrowDownAZ size={18} /> : <CalendarArrowDown size={18} />}
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleUserSubmit} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">{selectedUser?.id === user.id ? 'Meu Perfil' : selectedUser ? 'Editar Membro' : 'Novo Membro'}</h3>
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="text-zinc-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="space-y-4 mb-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><UserCircle size={10}/> Nome Completo</label>
                <input name="name" defaultValue={selectedUser?.name || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><Mail size={10}/> Email</label>
                <input name="email" type="email" defaultValue={selectedUser?.email || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><KeyRound size={10}/> {selectedUser ? "Mudar Senha (Opcional)" : "Senha"}</label>
                <input name="password" type="password" className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold" required={!selectedUser} />
              </div>
              {selectedUser?.id !== user.id && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2 flex items-center gap-1"><Shield size={10}/> Nível de Permissão</label>
                  <select name="role" defaultValue={selectedUser?.role || 'VIEWER'} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold">
                    <option value="VIEWER">Visualizador</option>
                    <option value="MANAGER">Gerente</option>
                    {isAdmin && <option value="ADMIN">Administrador</option>}
                  </select>
                </div>
              )}
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>} Confirmar
            </button>
          </form>
        </div>
      )}

      {/* MODAL ÁREA */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleAreaSubmit} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">{selectedArea ? 'Editar Área' : 'Nova Área'}</h3>
              <button type="button" onClick={() => setIsAreaModalOpen(false)} className="text-zinc-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="space-y-4 mb-8">
              <input name="name" placeholder="Nome da Área" defaultValue={selectedArea?.name || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold" required />

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">
                  Cor de Identificação
                </label>

                <div className="grid grid-cols-6 gap-2">
                  {['#FFD700', '#FF8C00', '#2ECC71', '#A2D149', '#007BFF', '#004085', '#98A6B0', '#8E44AD', '#17A2B8', '#40E0D0', '#2980B9', '#6F42C1', '#E74C3C', '#800020', '#2C3E50', '#A0522D', '#7AA9BD', '#D81B60'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-xl shadow-sm transition-all hover:scale-110 hover:shadow-md ${selectedColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <input type="hidden" name="color" value={selectedColor} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <CirclePlus size={18}/>} Salvar Área
            </button>
          </form>
        </div>
      )}

      {/* MODAL ESPAÇO */}
      {isSpaceModalOpen && (
        <div className="fixed inset-0 bg-blue-950/40 dark:bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleSpaceSubmit} className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-blue-950 dark:text-white uppercase italic tracking-tighter">{selectedSpace ? 'Editar Espaço' : 'Novo Espaço Pai'}</h3>
              <button type="button" onClick={() => setIsSpaceModalOpen(false)} className="text-zinc-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="space-y-6 mb-10">
              <input name="name" placeholder="Nome do Local" defaultValue={selectedSpace?.name || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold" required />
              <textarea name="notes" rows={4} defaultValue={selectedSpace?.notes || ''} className="w-full bg-zinc-50 dark:bg-zinc-950 dark:text-white p-4 rounded-2xl border-none font-bold resize-none" placeholder="Observações..."></textarea>
            </div>
            <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
              {saving ? <Loader2 className="animate-spin" size={18}/> : <CirclePlus size={18}/>} Confirmar Espaço
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}