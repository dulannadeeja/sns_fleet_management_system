import 'server-only';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// One pool per server process. DATABASE_URL comes from the environment (never committed); without it, refuse to start
// rather than let `pg` fall back to whatever database the machine's defaults point at.
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// Times are stored as timestamptz and read in Asia/Colombo (TRD › Data model, PR-15).
const pool = new Pool({ connectionString: url, options: '-c timezone=Asia/Colombo' });
export const db = drizzle(pool, { schema });
