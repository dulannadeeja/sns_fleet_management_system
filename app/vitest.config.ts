import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Rule tests run against a real PostgreSQL (TRD › Testing). Locally: npm run db:test:up; CI sets DATABASE_URL.
process.env.DATABASE_URL ||= 'postgres://postgres:postgres@localhost:5433/sns_test';

export default defineConfig({
  resolve: { alias: { 'server-only': fileURLToPath(new URL('./tests/setup/server-only.ts', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'], globalSetup: ['tests/setup/db.ts'] },
});
