import { describe, it, expect, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { migrationsFolder } from '../setup/db';

const admin = new Pool({ connectionString: process.env.DATABASE_URL });
afterAll(() => admin.end());

describe('migrations', () => {
  it('apply in order to a new, empty database', async () => {
    const name = `sns_migrate_${randomUUID().replace(/-/g, '')}`;
    await admin.query(`create database ${name}`);
    const url = new URL(process.env.DATABASE_URL!);
    url.pathname = `/${name}`;
    const fresh = new Pool({ connectionString: url.toString() });
    try {
      await migrate(drizzle(fresh), { migrationsFolder });
      const cols = await fresh.query(
        `select column_name, data_type from information_schema.columns where table_name = 'audit_event'`,
      );
      const types = Object.fromEntries(cols.rows.map((r) => [r.column_name, r.data_type]));
      expect(types).toMatchObject({ id: 'uuid', created_at: 'timestamp with time zone', created_by: 'uuid', action: 'text' });
      const triggers = await fresh.query(`select tgname from pg_trigger where tgrelid = 'audit_event'::regclass and not tgisinternal order by tgname`);
      expect(triggers.rows.map((r) => r.tgname)).toEqual(['audit_event_insert_only', 'audit_event_no_truncate']);
    } finally {
      await fresh.end();
      await admin.query(`drop database ${name}`);
    }
  });
});
