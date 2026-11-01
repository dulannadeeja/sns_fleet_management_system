import { describe, it, expect, afterAll } from 'vitest';
import { Pool } from 'pg';

// Cars (#18) as the running app sees them (role sns_app): it reads and adds cars and term versions, takes the per-car
// lock editCar uses, and may never change or remove a car or a version (system design 4.3; migration 0013).
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

describe('the app role on the car tables', () => {
  it('may read and add cars and term versions, and take the per-car lock', async () => {
    await expect(asAppRole('select count(*) from vehicle')).resolves.toBeTruthy();
    await expect(asAppRole('insert into vehicle select * from vehicle where false')).resolves.toBeTruthy();
    await expect(asAppRole('insert into vehicle_terms_version select * from vehicle_terms_version where false')).resolves.toBeTruthy();
    await expect(asAppRole("select pg_advisory_xact_lock(hashtext('sns.vehicle:sample'))")).resolves.toBeTruthy();
  });
  it('may not change or remove them, nor row-lock a car (#18 review: editCar uses the advisory lock)', async () => {
    await expect(asAppRole('update vehicle set model = model where false')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('delete from vehicle where false')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('select id from vehicle where false for update')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('update vehicle_terms_version set daily_rate = daily_rate where false')).rejects.toThrow(/permission denied/);
  });
});
