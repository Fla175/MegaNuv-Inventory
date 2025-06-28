// pages/sync-contaazul.tsx (SSP e JWT no Header)

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { GetServerSideProps } from 'next';
import * as cookie from 'cookie'; // Importar 'cookie' para o getServerSideProps
import { verifyAuthToken } from '../lib/auth'; // Importar verifyAuthToken
import Layout from '../components/Layout';

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

    const { status, message } = router.query;
    if (status === 'success' && message) {
      setSyncStatus(`Autorização Conta Azul: ${message}`);
    } else if (status === 'error' && message) {
      setSyncStatus(`Erro na Autorização Conta Azul: ${message}`);
    }
  }, [router.query, authToken]); // Adicionado authToken como dependência para reavaliação

  const getAuthHeaders = () => {
    if (!authToken) {
      // Se ainda não há token, redireciona para o login
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
      // Chama a API de autorização com axios.post e passa o JWT no header
      const response = await axios.post('/api/contaazul/authorize', {}, getAuthHeaders());
      // O backend /api/contaazul/authorize.ts fará o res.redirect.
      // Esta linha abaixo só seria executada se houvesse algum erro antes do redirect.
      setSyncStatus('Redirecionando para a Conta Azul...');
      // Você pode adicionar um pequeno delay ou window.location.href para garantir o redirect
      window.location.href = response.data.redirectUrl; // O backend vai retornar a URL de redirecionamento
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
      // Chama a sua API de sincronização (pages/api/contaazul/products.ts - POST)
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
    <Layout title="Sincronizar Conta Azul"> {/* NOVO: Envolve o conteúdo com Layout */}
      {/* O Head está dentro do Layout, mas também pode ficar aqui se precisar de algo específico */}
      {/* <Head>
        <title>Sincronizar Conta Azul</title>
        <link rel="icon" href="/favicon.ico" />
      </Head> */}

      <div className="flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Sincronização Conta Azul</h1>

          <p className="text-gray-700 mb-6">
            Para sincronizar seus produtos com a Conta Azul, primeiro você precisa autorizar a integração.
          </p>

          <button
            onClick={handleAuthorizeContaAzul}
            disabled={loading || !authToken} // Desabilita se não tiver token do MegaNuv
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
          >
            {loading ? 'Preparando Autorização...' : (authToken ? 'Autorizar Conta Azul' : 'Faça Login Primeiro')}
          </button>

          <p className="text-gray-700 mb-6 mt-6">
            Após autorizar, clique no botão abaixo para iniciar a sincronização dos produtos.
          </p>

          <button
            onClick={handleSyncProducts}
            disabled={loading || !authToken} // Desabilita se não tiver token do MegaNuv
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            {loading ? 'Sincronizando...' : (authToken ? 'Iniciar Sincronização Agora' : 'Faça Login Primeiro')}
          </button>

          {syncStatus && (
            <p className={`mt-4 text-md ${syncStatus.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
              {syncStatus}
            </p>
          )}

          <div className="mt-8 text-gray-500 text-sm">
            <p>Certifique-se de estar logado no MegaNuv Inventário antes de iniciar a autorização.</p>
            <p>Em caso de problemas, reautorize a integração com a Conta Azul.</p>
          </div>
        </div>
      </div>
    </Layout> // NOVO: Fecha o componente Layout
  );
};

// NOVO: getServerSideProps para ler o cookie no servidor
export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = cookie.parse(context.req.headers.cookie || '');
  const authToken = cookies.auth_token;

  if (!authToken) {
    // Se não há token, redireciona o usuário para a página de login
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
