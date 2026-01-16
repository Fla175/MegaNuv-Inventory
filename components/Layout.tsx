// components/Layout.tsx
import React, { ReactNode, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  LineChart,
  Warehouse,
  Box,
  Tags,
  RefreshCw,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import { useUser } from "../lib/context/UserContext";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "MegaNuv Inventory" }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  // Fecha a sidebar ao navegar
  useEffect(() => {
    if (isSidebarOpen) setIsSidebarOpen(false);
  }, [router.asPath]);

  // Função para marcar item ativo
  const isActive = (pathname: string) => {
    if (pathname === "/") return router.pathname === pathname;
    return router.pathname.startsWith(pathname);
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 font-inter">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white p-4 flex items-center justify-between z-20 shadow-md">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white focus:outline-none"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="text-2xl font-bold text-blue-400">MegaNuv</div>
          <div className="flex items-center space-x-2 text-sm">
            <UserCircle size={20} />
            <span>{user?.name || "Usuário"}</span>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 flex flex-col z-30 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out lg:shadow-xl lg:rounded-r-lg`}
        >
          {/* Logo */}
          <div className="flex justify-center items-center py-4 px-2 mb-8 border-b border-gray-700">
            <Image
              src="/logo-inventario.svg"
              alt="MegaNuv Logo"
              width={160}
              height={50}
              priority
            />
          </div>

          {/* Navegação */}
          <nav className="flex-grow">
            <ul>
              {[
                { href: "/dashboard", label: "Dashboard", icon: LineChart },
                { href: "/", label: "Espaços Físicos", icon: Warehouse },
                { href: "/catalog", label: "Catálogo de Ativos", icon: Tags },
                { href: "/actives", label: "Gestão de Ativos", icon: Box },
                { href: "/settings", label: "Configurações", icon: Settings },
              ].map((item) => (
                <li key={item.href} className="mb-2">
                  <Link
                    href={item.href}
                    className={`flex items-center py-2 px-4 rounded-md transition duration-200 ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white shadow-md"
                        : "hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    <item.icon size={20} className="mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Usuário + Logout */}
          <div className="mt-auto pt-4 border-t border-gray-700 flex flex-col items-center">
            <div className="flex items-center text-gray-300 text-base mb-3">
              <UserCircle size={22} className="mr-2" />
              <span>{user?.name || "Usuário"}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                  localStorage.removeItem("user");
                  router.push("/login");
                } catch (err) {
                  console.error("Erro ao fazer logout", err);
                }
              }}
              className="w-full flex items-center justify-center py-2 px-4 rounded-md text-red-300 bg-gray-700 hover:bg-red-500 hover:text-white transition duration-200 shadow-sm"
            >
              <LogOut size={18} className="mr-2" />
              Sair
            </button>
          </div>
        </aside>

        {/* Overlay mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Conteúdo principal */}
        <main className="flex-grow p-8 pt-20 lg:pt-8 h-screen overflow-y-auto bg-white lg:rounded-r-lg">
          {children}
        </main>
      </div>
    </>
  );
}
