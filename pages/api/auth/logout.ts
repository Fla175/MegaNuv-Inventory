// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { invalidateAllCookies } from '@/lib/authHelper';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Use POST.' });
  }

  return invalidateAllCookies(res);
}