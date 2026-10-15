// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Use POST.' });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: -1,
    sameSite: 'lax' as const,
  };

  res.setHeader('Set-Cookie', [
    serialize('auth_token', '', cookieOptions),
    serialize('auth_token_creator', '', cookieOptions),
  ]);

  return res.status(200).json({ message: 'Logout realizado com sucesso.' });
}