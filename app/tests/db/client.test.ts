import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '../../src/db/client';

describe('database client', () => {
  it('reads times in Asia/Colombo (TRD › Data model)', async () => {
    const result = await db.execute(sql`show timezone`);
    expect(result.rows[0].TimeZone).toBe('Asia/Colombo');
  });
});
