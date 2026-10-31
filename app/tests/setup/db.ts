// Vitest global setup: apply the SQL migrations to the test database before any test runs (TRD › Testing).
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export const migrationsFolder = fileURLToPath(new URL('../../src/db/migrations', import.meta.url));

/** Host, port and database only: the password never goes into a log. */
function where(url: string | undefined): string {
  try {
    const u = new URL(url ?? '');
    return `${u.host}${u.pathname}`;
  } catch {
    return 'an unreadable DATABASE_URL';
  }
}

export default async function setup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('select 1');
  } catch (e) {
    await pool.end();
    const code = (e as { code?: string }).code ?? 'no answer';
    // Printed first: Vitest 5 can fail while printing a stack trace thrown from global setup.
    const message = `The test database is not reachable at ${where(process.env.DATABASE_URL)} (${code}). Start it with: npm run db:test:up`;
    console.error(`\n${message}\n`);
    const err = new Error(message);
    err.stack = message;
    throw err;
  }
  await migrate(drizzle(pool), { migrationsFolder });
  await pool.end();
}
