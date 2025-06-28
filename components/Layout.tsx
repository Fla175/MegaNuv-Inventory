// components/Layout.tsx

import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'MegaNuv Inventory' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen bg-gray-100 font-inter">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
          <div className="text-2xl font-bold mb-8 text-center text-blue-400">MegaNuv</div>
          <nav className="flex-grow">
            <ul>
              <li className="mb-2">
                <Link href="/dashboard" className="block py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200">
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/" className="block py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200">
                  Espaços Físicos
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/instances" className="block py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200">
                  Gerenciar Ativos Individuais
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/products" className="block py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200">
                  Definição de Produtos (CA)
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/sync-contaazul" className="block py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200">
                  Sincronizar Conta Azul
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/settings" className="block py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200">
                  Configurações
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-auto pt-4 border-t border-gray-700">
            <Link href="/logout" className="block py-2 px-4 rounded-md text-red-400 hover:bg-gray-700 transition duration-200">
              Sair
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </>
  );
}
