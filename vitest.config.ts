import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Valores fictícios de teste. Nenhum segredo real aqui — ver __tests__/setup.ts
    // e AGENTS.md §3.1. `lib/minio.ts` e `lib/auth.ts` falham no import quando as
    // variáveis obrigatórias estão ausentes, então o ambiente precisa ser semeado.
    env: {
      JWT_SECRET: 'test-secret-key-1234567890',
      CREATOR_ACCESS_ENABLED: 'true',
      MINIO_ENDPOINT: 'minio.test.local',
      MINIO_ACCESS_KEY: 'test-access-key',
      MINIO_SECRET_KEY: 'test-secret-key',
      MINIO_PUBLIC_ENDPOINT: 'minio.test.local',
      MINIO_PUBLIC_USE_SSL: 'false',
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Threshold aplicado à superfície de segurança coberta por esta branch
      // (autenticação e política de upload) — o escopo novo testado aqui.
      //
      // O alvo global de 70-80% de SPECS.md §5.2 permanece PENDENTE: o projeto
      // tem baseline 0% de cobertura e 36 endpoints. Elevar o gate para todo
      // `pages/api/**` exige cobrir o conjunto do projeto — trabalho próprio,
      // registrado em CONTEXT.md §3.3.
      include: [
        'lib/middlewares/**',
        'lib/uploadPolicy.ts',
        'pages/api/users/index.ts',
        'pages/api/users/check-director.ts',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
      },
    },
  },
});
