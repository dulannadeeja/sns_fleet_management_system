import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';

// System design 3.1: one primary owner; a turned-off account always has a reason.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

async function inRollback(fn: (q: (sql: string) => Promise<unknown>) => Promise<void>) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await fn((sql) => c.query(sql));
  } finally {
    await c.query('rollback');
    c.release();
  }
}
const person = (role: string, extra = '') =>
  `insert into "user" (name, email, role${extra ? ', disabled_at, disabled_reason' : ''}) values ('Sample', gen_random_uuid() || '@no-email.invalid', '${role}'${extra})`;

describe('people in the database', () => {
  it('allows only one owner', async () => {
    await inRollback(async (q) => {
      await q('delete from permission_grant where false');
      await q(`update "user" set role = 'staff' where false`);
      const owners = (await q(`select count(*)::int as n from "user" where role = 'owner'`)) as { rows: { n: number }[] };
      if (owners.rows[0].n === 0) await q(person('owner'));
      await expect(q(person('owner'))).rejects.toThrow(/user_one_owner/);
    });
  });
  it('refuses an unknown role', async () => {
    await inRollback(async (q) => { await expect(q(person('boss'))).rejects.toThrow(/user_role/); });
  });
  it('refuses a turned-off account without a reason', async () => {
    await inRollback(async (q) => { await expect(q(person('staff', ", now(), null"))).rejects.toThrow(/user_disabled_has_reason/); });
  });
});
