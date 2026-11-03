// lib/context/UserContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import RestoreCreatorModal from "@/components/RestoreCreatorModal";

export type Role = 'DIRECTOR' | 'ADMIN' | 'MANAGER' | 'VIEWER';
export type Theme = 'DARK' | 'LIGHT' | 'SYSTEM';

export type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  theme: Theme;
  isCreator: boolean;
  lastLogin?: string;
  createdAt: string;
};

export type Impersonation = { active: boolean; creatorName: string } | null;

type UserContextType = {
  user: User | null;
  impersonation: Impersonation;
  loading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  /** Abre o modal que pede a senha do criador antes de voltar à conta. */
  restoreCreatorSession: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [impersonation, setImpersonation] = useState<Impersonation>(null);
  const [loading, setLoading] = useState(true);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    // Iniciamos o loading sempre que houver um refresh manual
    setLoading(true); 
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      
      if (res.ok) {
        const data = await res.json();
        
        /**
         * AJUSTE DE ESTRUTURA:
         * Sua API retorna { user: { ... } }. 
         * Verificamos se data.user existe para não salvar o objeto pai errado.
         */
        if (data && data.user) {
          setUser(data.user);
          setImpersonation(data.impersonation ?? null);
        } else {
          // Caso a API mude o formato no futuro
          setUser(data); 
          setImpersonation(null);
        }
      } else {
        // Se a resposta for 401, 404 ou 500, limpamos o usuário
        setUser(null);
        setImpersonation(null);
      }
    } catch {
      setUser(null);
      setImpersonation(null);
    } finally {
      // O ponto mais importante: DESLIGA o "Sincronizando"
      setLoading(false);
    }
  }, []);

  /**
   * Restaurar a sessão do criador devolve o maior privilégio do sistema, então
   * o `DELETE /api/creator-access` exige a senha do criador. O banner do
   * `Layout` abre este modal; a senha só sai do cliente dentro do `body` do
   * `DELETE` — nunca é guardada.
   */
  const restoreCreatorSession = useCallback(() => {
    setRestoreError(null);
    setIsRestoreOpen(true);
  }, []);

  const confirmRestoreCreatorSession = useCallback(
    async (password: string) => {
      setIsRestoring(true);
      setRestoreError(null);
      try {
        const res = await fetch("/api/creator-access", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password }),
        });

        if (res.ok) {
          setIsRestoreOpen(false);
          window.location.assign("/");
          return;
        }

        const data = await res.json().catch(() => null);
        setRestoreError(data?.error || "Não foi possível voltar à conta.");
      } catch {
        setRestoreError("Erro de conexão ao restaurar a sessão.");
      } finally {
        setIsRestoring(false);
      }
    },
    []
  );

  // Execução inicial ao carregar o app
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Quando usuário faz login, força refresh imediato
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const justLoggedIn = localStorage.getItem("justLoggedIn");
    if (justLoggedIn) {
      localStorage.removeItem("justLoggedIn");
      fetchUser(); // força refresh após login
    }
  }, [fetchUser]);

  // Lógica de aplicação de Tema (Dark/Light)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
    const applyTheme = () => {
      const currentTheme = user?.theme || 'SYSTEM';
      const isDark = currentTheme === 'DARK' || (currentTheme === 'SYSTEM' && mediaQuery.matches);
      
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [user?.theme]);

  return (
    <UserContext.Provider value={{ user, impersonation, loading, setUser, refreshUser: fetchUser, restoreCreatorSession }}>
      {children}
      <RestoreCreatorModal
        isOpen={isRestoreOpen}
        creatorName={impersonation?.creatorName || "Criador"}
        isRestoring={isRestoring}
        error={restoreError}
        onConfirm={confirmRestoreCreatorSession}
        onClose={() => {
          if (isRestoring) return;
          setIsRestoreOpen(false);
          setRestoreError(null);
        }}
      />
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de <UserProvider>");
  }
  return context;
}