// pages/login.tsx
import { useState, useEffect } from 'react';
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

  // 🧩 Checa seed e redireciona para registro inicial se necessário
  useEffect(() => {
    const checkSeed = async () => {
      try {
        // Só faz a requisição se ainda não tivermos verificado
        const alreadyChecked = sessionStorage.getItem("seedChecked");
        if (alreadyChecked) return;
  
        const res = await fetch("/api/auth/seed", { credentials: 'include' });
        if (!res.ok) return;
  
        const data = await res.json();
        sessionStorage.setItem("seedChecked", "true"); // marca que já foi verificado
  
        // redireciona só se necessário
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
        }
      } catch (err) {
        console.error("Erro ao verificar seed:", err);
      }
    };
  
    checkSeed();
  }, []);  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        router.replace('/'); // redireciona após login
      } else {
        setMessage(data.message || 'Credenciais inválidas');
      }
    } catch (err) {
      console.error(err);
      setMessage('Erro de rede. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 🚪 Logout manual (pode ser usado em qualquer página protegida)
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.replace('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004AAD] to-[#38B6FF] p-4 font-inter">
      <Head>
        <title>Login MegaNuv Inventory</title>
      </Head>

      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-200">
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
              className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-lg font-semibold text-white ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            }`}
          >
            {loading ? <Loader2 size={20} className="animate-spin mr-2" /> : 'Entrar'}
          </button>
        </form>

        {message && (
          <p className={`mt-6 text-center text-md font-medium px-4 py-2 rounded-md ${
            message.toLowerCase().includes('sucesso') || message.toLowerCase().includes('success')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
