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
  it('may add a partner, record their agreement date, and link a car to them (#20)', async () => {
    await expect(asAppRole('insert into partner_owner select * from partner_owner where false')).resolves.toBeTruthy();
    await expect(asAppRole('update partner_owner set agreement_signed_on = agreement_signed_on where false')).resolves.toBeTruthy();
    await expect(asAppRole('update partner_owner set bank_account = bank_account where false')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('update vehicle set partner_owner_id = partner_owner_id where false')).resolves.toBeTruthy();
    await expect(asAppRole('update partner_owner set nic = nic where false')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('delete from partner_owner where false')).rejects.toThrow(/permission denied/);
  });
  // Since #20 the app may set a car's partner link (one column), so a row lock would also be allowed; editCar keeps the
  // advisory lock, which also covers cars with no partner column change.
  it('may not change or remove them, apart from the partner link', async () => {
    await expect(asAppRole('update vehicle set model = model where false')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('delete from vehicle where false')).rejects.toThrow(/permission denied/);
    await expect(asAppRole('update vehicle_terms_version set daily_rate = daily_rate where false')).rejects.toThrow(/permission denied/);
  });
});
