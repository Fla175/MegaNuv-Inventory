    // pages/login.tsx

    import { useState } from 'react';
    import { useRouter } from 'next/router';
    import Head from 'next/head';

    export default function Login() {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [message, setMessage] = useState('');
      const router = useRouter();

      const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage(''); // Limpa mensagens anteriores

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
            // Redireciona para a página de inventário após o login bem-sucedido
            // O cookie HttpOnly será definido automaticamente pelo navegador
            router.push('/'); // Exemplo de redirecionamento
          } else {
            setMessage(data.message || 'Erro no login.');
          }
        } catch (error) {
          console.error('Erro ao tentar login:', error);
          setMessage('Erro de rede ou servidor.');
        }
      };

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
          <Head>
            <title>Login MegaNuv</title>
          </Head>
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h1>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Senha:
                </label>
                <input
                  type="password"
                  id="password"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Entrar
                </button>
              </div>
            </form>
            {message && (
              <p className={`mt-4 text-center ${message.includes('sucesso') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      );
    }
    