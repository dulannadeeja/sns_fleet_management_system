import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Rule tests run against a real PostgreSQL (TRD › Testing). Locally: npm run db:test:up; CI sets DATABASE_URL.
process.env.DATABASE_URL ||= 'postgres://postgres:postgres@localhost:5433/sns_test';
// Sample document copies go to a private folder of this run only (#19).
process.env.DOCUMENTS_DIR ||= join(tmpdir(), `sns-test-documents-${process.pid}`);
process.env.BETTER_AUTH_SECRET ||= 'test-only-secret-not-for-real-use-0123456789';
// Emails in tests go to this file, never out (TRD §6).
process.env.MAIL_OUTBOX_FILE ||= join(tmpdir(), `sns-test-outbox-${process.pid}.jsonl`);

export default defineConfig({
  resolve: { alias: { 'server-only': fileURLToPath(new URL('./tests/setup/server-only.ts', import.meta.url)) } },
  test: { include: ['tests/**/*.test.{ts,tsx}'], globalSetup: ['tests/setup/db.ts'] },
});
