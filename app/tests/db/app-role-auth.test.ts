import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';

// System design 3.1: people are turned off, never deleted, so the app role may not delete a person or their password row.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

async function asAppRole(sql: string) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role sns_app');
    return await c.query(sql);
  } finally {
    await c.query('rollback');
    c.release();
  }
}

describe('the app role on the sign-in tables', () => {
  it('may read people and sessions, and remove sessions', async () => {
    await expect(asAppRole('select count(*) from "user"')).resolves.toBeTruthy();
    await expect(asAppRole("delete from session where false")).resolves.toBeTruthy();
  });
  it('may not delete a person or a password row', async () => {
    await expect(asAppRole('delete from "user" where false')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('delete from account where false')).rejects.toThrow(/permission denied/);
  });
});
