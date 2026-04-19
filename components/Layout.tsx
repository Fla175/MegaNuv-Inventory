// components/Layout.tsx
import React, { ReactNode, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {version} from "@/package.json";
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
  const projectVersion = version;

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
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white p-4 flex items-center justify-between z-20 shadow-md">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white focus:outline-none"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="text-2xl font-bold text-blue-400 text-center items-center flex w-auto">
            <span className="pr-2.5">MegaNuv Inventory&trade;</span>
            <Image
              src="/logo-inventory.svg"
              alt="Inventory™ Logo"
              width={50}
              height={50}
              priority
            />
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <UserCircle size={20} />
            <span className="truncate max-w-[100px]">{user?.name || "Usuário"}</span>
          </div>
        </header>

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 w-64 h-screen bg-gray-800 text-white p-4 flex flex-col z-30 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:shadow-xl`}
        >
          <div className="flex justify-center items-center py-4 px-2 mb-6 border-b border-gray-700 shrink-0">
            <Image
              src="/logo-inventory.svg"
              alt="Inventory™ Logo"
              width={160}
              height={50}
              priority
            />
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            <ul>
              {[
                { href: "/dashboard", label: "Dashboard", icon: LineChart },
                { href: "/", label: "Gestão de Ativos", icon: Box },
                { href: "/settings", label: "Configurações", icon: Settings },
              ].map((item) => (
                <li key={item.href} className="mb-1">
                  <Link
                    href={item.href}
                    className={`flex items-center py-3 px-4 rounded-lg transition duration-200 ${
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

          <div className="shrink-0 pt-4 border-t border-gray-700 bg-gray-800 font-medium">
            <div className="flex items-center justify-center text-gray-300 text-sm mb-3">
              <UserCircle size={20} className="mr-2 shrink-0" />
              <span className="truncate">{user?.name || "Usuário"}</span>
            </div>
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
              className="w-full flex items-center justify-center py-2.5 px-4 mb-1.5 rounded-lg text-red-300 bg-gray-700 hover:bg-red-500 hover:text-white transition duration-200 shadow-sm"
            >
              <LogOut size={18} className="mr-2 shrink-0" />
              <span className="font-medium">Sair</span>
            </button>
            <div className="flex justify-center items-baseline text-blue-400 text-[15px] font-bold">
              <p className="pr-0.5">MegaNuv Inventory™</p> <span className="pr-1 text-gray-400 text-[12px] font-medium">v{projectVersion}</span>
              <span><div className="h-2 w-2 bg-green-500 rounded-full shadow-lg"></div></span>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 mt-16 lg:mt-0 min-h-screen lg:min-h-0 bg-white dark:bg-zinc-950 text-blue-950 dark:text-gray-100 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}