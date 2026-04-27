// lib/version.ts
// Versão dinâmica - importação direta de package.json (Next.js suporta JSON)
import packageJson from '../package.json';

export const VERSION = packageJson.version || "1.0.0";

// BUILD_DATE é definido apenas no client-side para evitar hydration mismatch
export const BUILD_DATE = typeof window !== 'undefined' 
  ? new Date().toISOString().split('T')[0]
  : '';
