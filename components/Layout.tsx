// components/Layout.tsx
import React, { ReactNode, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { VERSION } from "@/lib/version";

import Image from "next/image";
import {
  LineChart,
  Box,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import { useUser } from "../lib/context/UserContext";
import { useEscapeKey } from "../lib/hooks/useEscapeKey";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "MegaNuv Inventory" }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const projectVersion = VERSION;

  useEffect(() => {
    if (isSidebarOpen) setIsSidebarOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  useEscapeKey(() => setIsSidebarOpen(false), isSidebarOpen);

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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>

      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 dark:bg-black font-inter transition-colors duration-300">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white px-3 py-2.5 flex items-center justify-between z-20 shadow-md">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white p-1"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="text-lg font-bold text-blue-400 text-center">
            <span>MegaNuv&trade;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs truncate max-w-[80px]">{user?.name || "Usuário"}</span>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                } catch {
                  console.error("Erro ao fazer logout");
                }
              }}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 w-64 h-screen bg-gray-800 text-white p-4 flex flex-col z-30 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:shadow-xl`}
        >
          <div className="flex justify-center items-center py-2 px-2 mb-3 border-b border-gray-700 shrink-0">
            <Image
              src="/logo-inventory.svg"
              alt="Inventory™ Logo"
              width={120}
              height={40}
              priority
            />
          </div>

          <nav className="flex-1 overflow-y-auto py-1">
            <ul>
              {[
                { href: "/dashboard", label: "Dashboard", icon: LineChart },
                { href: "/", label: "Gestão de Ativos", icon: Box },
                { href: "/settings", label: "Configurações", icon: Settings },
              ].map((item) => (
                <li key={item.href} className="mb-0.5">
                  <Link
                    href={item.href}
                    className={`flex items-center py-2.5 px-3 rounded-lg transition duration-200 text-sm ${
                      isActive(item.href)
                        ? "bg-blue-600 text-white shadow-md"
                        : "hover:bg-gray-700 text-gray-300"
                    }`}
                  >
                    <item.icon size={18} className="mr-2" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer compacto - sticky no bottom-left do sidebar (interno se scroll) */}
          <div className="shrink-0 pt-2 border-t border-gray-700 bg-gray-800 mt-auto">
            <div className="flex items-center justify-between text-blue-400 text-[10px] font-bold py-0.5">
              <span>MegaNuv Inventory™</span>
              <span className="text-gray-500">v{projectVersion}</span>
            </div>
          </div>
        </aside>

        {/* Footer fixo na tela - bottom-left (sobre sidebar em desktop) */}
        <div className="hidden lg:flex fixed bottom-4 left-4 z-40">
          <div className="flex items-center gap-2 bg-gray-800/95 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-700 shadow-xl">
            <UserCircle size={18} className="shrink-0 text-gray-400" />
            <span className="text-xs text-gray-200 font-medium min-w-[100px]">{user?.name || "Usuário"}</span>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                } catch {
                  console.error("Erro ao fazer logout");
                }
              }}
              className="shrink-0 p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-3 sm:p-6 md:p-8 lg:p-10 mt-14 lg:mt-0 min-h-screen lg:min-h-0 pb-24 lg:pb-10 bg-white dark:bg-zinc-950 text-blue-950 dark:text-gray-100 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}