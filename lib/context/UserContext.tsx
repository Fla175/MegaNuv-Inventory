// lib/context/UserContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Role = 'ADMIN' | 'MANAGER' | 'VIEWER';
export type Theme = 'DARK' | 'LIGHT' | 'SISTEM';

export type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  theme: Theme;
  defaultSort?: string;
  lastLogin?: string;
  createdAt: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        } else {
          // Caso a API mude o formato no futuro
          setUser(data); 
        }
      } else {
        // Se a resposta for 401, 404 ou 500, limpamos o usuário
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      // O ponto mais importante: DESLIGA o "Sincronizando"
      setLoading(false);
    }
  }, []);

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
      const currentTheme = user?.theme || 'SISTEM';
      const isDark = currentTheme === 'DARK' || (currentTheme === 'SISTEM' && mediaQuery.matches);
      
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
    <UserContext.Provider value={{ user, loading, setUser, refreshUser: fetchUser }}>
      {children}
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