// pages/api/protected.ts

import type { NextApiResponse } from 'next';
import { authMiddleware, AuthenticatedNextApiRequest } from '../../lib/middlewares/authMiddleware';

// Este é o manipulador original da sua rota protegida.
// Ele só será executado se o middleware permitir.
async function protectedHandler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  // A partir daqui, req.user estará disponível com o payload do token
  // se o usuário estiver autenticado e autorizado.
  console.log('Acesso concedido para o usuário:', req.user?.email, 'com papel:', req.user?.role);

  // Exemplo de como usar as informações do usuário autenticado:
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Você acessou uma rota protegida com sucesso!',
      data: `Olá, ${req.user?.name || req.user?.email}! Seu papel é ${req.user?.role}.`,
      user: req.user,
    });
  }

  // Você pode adicionar outras lógicas de método HTTP aqui
  return res.status(405).json({ message: 'Method Not Allowed' });
}

// Exporta a rota protegida envolvendo o manipulador no middleware.
// Aqui, protegemos a rota, mas QUALQUER usuário autenticado pode acessá-la.
export default authMiddleware(protectedHandler);

// Se você quisesse que apenas ADMINS pudessem acessar:
// export default authMiddleware(protectedHandler, ['ADMIN']);

// Se você quisesse que ADMINS e STAFF pudessem acessar:
// export default authMiddleware(protectedHandler, ['ADMIN', 'STAFF']);