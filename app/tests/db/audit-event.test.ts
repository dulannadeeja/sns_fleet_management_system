import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';

// Derived control behind ST-15.4: nobody, the owner included, can change or delete an activity-log entry (TRD › Integrity rules, §13).
// Rows can never be removed, so each test uses its own target_id and never counts the whole table.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => pool.end());

async function addEntry(db: Pool | PoolClient = pool): Promise<string> {
  const targetId = randomUUID();
  await db.query(`insert into audit_event (action, target_type, target_id) values ('test.entry', 'test', $1)`, [targetId]);
  return targetId;
}

/** Runs `work` as the app's database role (sns_app), as the running app will. */
async function asAppRole<T>(work: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query('set local role sns_app');
    return await work(c);
  } finally {
    await c.query('rollback');
    c.release();
  }
}

describe('audit_event is insert-only (trigger, for every role)', () => {
  it('accepts a new entry with its time filled in', async () => {
    const id = await addEntry();
    const { rows } = await pool.query('select created_at from audit_event where target_id = $1', [id]);
    expect(rows[0].created_at).toBeInstanceOf(Date);
  });

  it('refuses to change an entry', async () => {
    const id = await addEntry();
    await expect(pool.query(`update audit_event set action = 'changed' where target_id = $1`, [id])).rejects.toThrow(/insert-only/);
  });

  it('refuses to delete an entry', async () => {
    const id = await addEntry();
    await expect(pool.query('delete from audit_event where target_id = $1', [id])).rejects.toThrow(/insert-only/);
  });

  it('refuses to empty the table', async () => {
    await expect(pool.query('truncate audit_event')).rejects.toThrow(/insert-only/);
  });
});

describe('the app role (sns_app) has no right to change audit_event', () => {
  it('may add and read entries', async () => {
    const found = await asAppRole(async (c) => {
      const id = await addEntry(c);
      return (await c.query('select 1 from audit_event where target_id = $1', [id])).rowCount;
    });
    expect(found).toBe(1);
  });

  it('may not change, delete or empty entries', async () => {
    for (const sql of [`update audit_event set action = 'x'`, 'delete from audit_event', 'truncate audit_event']) {
      await expect(asAppRole((c) => c.query(sql))).rejects.toThrow(/permission denied/);
    }
  });
});
