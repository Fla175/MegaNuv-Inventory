// pages/login.tsx (Login com Gradiente MegaNuv)

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        router.push('/');
      } else {
        setMessage(data.message || 'Erro no login. Verifique suas credenciais.');
      }
    } catch (error) {
      console.error('Erro ao tentar login:', error);
      setMessage('Erro de rede ou servidor. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Gradiente de fundo com as cores da MegaNuv
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004AAD] to-[#38B6FF] p-4 font-inter">
      <Head>
        <title>Login MegaNuv Inventory</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Container principal do formulário */}
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-200 transform transition duration-300 hover:scale-[1.01]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-inventario.svg"
            alt="MegaNuv Inventory Logo"
            width={200}
            height={60}
            priority
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-8 text-center tracking-tight">
          Bem-vindo de volta!
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
              Senha:
            </label>
            <input
              type="password"
              id="password"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-lg font-semibold text-white transition-all duration-300 transform shadow-md
              ${loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 active:scale-95'
              }`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 size={20} className="animate-spin mr-2" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {message && (
          <p className={`mt-6 text-center text-md font-medium px-4 py-2 rounded-md ${message.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </p>
        )}

        <p className="mt-8 text-center text-gray-500 text-sm">
          Problemas para acessar? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
}
