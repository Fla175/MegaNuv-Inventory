// pages/sync-contaazul.tsx (Com melhorias UI/UX)

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios'; // Mantemos o axios padrão, pois está funcionando
import { GetServerSideProps } from 'next';
import * as cookie from 'cookie';
import { verifyAuthToken } from '../lib/auth';

import Layout from '../components/Layout'; // Importa o componente Layout

interface SyncContaAzulPageProps {
  initialAuthToken?: string; // Token inicial carregado do servidor
}

const SyncContaAzulPage: React.FC<SyncContaAzulPageProps> = ({ initialAuthToken }) => {
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | undefined>(initialAuthToken); // Usa o token inicial da prop
  const router = useRouter();

  useEffect(() => {
    // Se o token não veio do SSP (por exemplo, em navegação SPA), tenta ler do cookie novamente
    if (!authToken) {
      const token = cookie.parse(document.cookie || '').auth_token;
      setAuthToken(token);
    }

    const { status, message, details } = router.query; // Pega 'details' para erros mais específicos
    if (status === 'success' && message) {
      setSyncStatus(`Autorização Conta Azul: ${message}`);
    } else if (status === 'error' && message) {
      setSyncStatus(`Erro na Autorização Conta Azul: ${message}${details ? `: ${details}` : ''}`); // Exibe detalhes
    }
  }, [router.query, authToken]);

  const getAuthHeaders = () => {
    if (!authToken) {
      router.push('/login?message=Por favor, faça login para sincronizar a Conta Azul.');
      throw new Error('Não autenticado: Token JWT ausente.');
    }
    return {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };
  };

  const handleAuthorizeContaAzul = async () => {
    setLoading(true);
    setSyncStatus('Iniciando processo de autorização da Conta Azul...');
    try {
      const response = await axios.post('/api/contaazul/authorize', {}, getAuthHeaders());
      setSyncStatus('Redirecionando para a Conta Azul...');
      window.location.href = response.data.redirectUrl;
    } catch (error: any) {
      console.error('Erro ao iniciar autorização da Conta Azul:', error.response?.data || error.message);
      setSyncStatus(`Erro ao iniciar autorização: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProducts = async () => {
    setLoading(true);
    setSyncStatus('Iniciando sincronização de produtos...');
    try {
      const response = await axios.post('/api/contaazul/products', {}, getAuthHeaders()); 
      setSyncStatus(`Sincronização concluída: ${response.data.message}`);
    } catch (error: any) {
      console.error('Erro ao sincronizar produtos:', error.response?.data || error.message);
      setSyncStatus(`Erro ao sincronizar produtos: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Sincronizar Conta Azul">
      <div className="flex flex-col items-center justify-center min-h-full py-10 px-4 sm:px-6 lg:px-8"> {/* min-h-full para preencher o Layout */}
        <Head>
          <title>Sincronizar Conta Azul</title>
          <link rel="icon" href="/favicon.ico" />
          {/* Font Inter para uma tipografia moderna */}
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        </Head>

        {/* Card principal com sombra e bordas arredondadas */}
        <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-xl shadow-lg transform transition duration-300 hover:scale-[1.01] text-center border border-gray-200">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-6 tracking-tight">
            Integração Conta Azul
          </h1>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Sincronize os produtos do seu inventário com a sua conta da Conta Azul de forma rápida e eficiente.
          </p>

          <div className="space-y-6">
            {/* Seção de Autorização */}
            <div className="bg-blue-50 bg-opacity-70 p-6 rounded-lg border border-blue-200 shadow-sm">
              <h2 className="text-2xl font-semibold text-blue-700 mb-4">Autorização</h2>
              <p className="text-md text-gray-700 mb-5">
                Conecte seu sistema ao Conta Azul para iniciar o processo de sincronização. Isso requer um redirecionamento seguro para a plataforma Conta Azul.
              </p>
              <button
                onClick={handleAuthorizeContaAzul}
                disabled={loading || !authToken}
                className={`w-full py-3 px-6 rounded-lg text-lg font-semibold text-white transition-all duration-300 transform shadow-md
                  ${loading || !authToken
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 active:scale-95'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparando Autorização...
                  </span>
                ) : (authToken ? 'Autorizar Conta Azul' : 'Faça Login Primeiro')}
              </button>
            </div>

            {/* Seção de Sincronização */}
            <div className="bg-green-50 bg-opacity-70 p-6 rounded-lg border border-green-200 shadow-sm">
              <h2 className="text-2xl font-semibold text-green-700 mb-4">Sincronização de Produtos</h2>
              <p className="text-md text-gray-700 mb-5">
                Após a autorização, clique abaixo para sincronizar seus produtos. O processo pode levar alguns instantes, dependendo do volume de dados.
              </p>
              <button
                onClick={handleSyncProducts}
                disabled={loading || !authToken}
                className={`w-full py-3 px-6 rounded-lg text-lg font-semibold text-white transition-all duration-300 transform shadow-md
                  ${loading || !authToken
                    ? 'bg-green-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 active:scale-95'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sincronizando...
                  </span>
                ) : (authToken ? 'Iniciar Sincronização Agora' : 'Faça Login Primeiro')}
              </button>
            </div>
          </div>

          {syncStatus && (
            <p className={`mt-6 text-md font-medium px-4 py-2 rounded-md ${syncStatus.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {syncStatus}
            </p>
          )}

          <div className="mt-8 text-gray-500 text-sm">
            <p>
              <span className="font-semibold">Importante:</span> Certifique-se de estar logado no MegaNuv inventário antes de iniciar a autorização e sincronização.
            </p>
            <p className="mt-2">
              Em caso de problemas ou tokens expirados, reautorize a integração com a Conta Azul para obter novos tokens.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = cookie.parse(context.req.headers.cookie || '');
  const authToken = cookies.auth_token;

  if (!authToken) {
    return {
      redirect: {
        destination: '/login?message=Por favor, faça login para sincronizar a Conta Azul.',
        permanent: false,
      },
    };
  }

  // Opcional: Verificar a validade do token aqui, se desejar
  // const decodedPayload = verifyAuthToken(authToken);
  // if (!decodedPayload) {
  //   return {
  //     redirect: {
  //       destination: '/login?message=Sua sessão expirou. Por favor, faça login novamente.',
  //       permanent: false,
  //     },
  //   };
  // }

  return {
    props: {
      initialAuthToken: authToken, // Passa o token para o componente React
    },
  };
};

export default SyncContaAzulPage;
