// Playwright global setup: apply the migrations, then add one sample person per browser project with a first password,
// through the same script the office uses (npm run people:add). Their phone numbers and the password reach the tests
// through process.env. Sample data only: random phone numbers, a test-only password.
import { execFileSync } from 'node:child_process';
import migrateTestDatabase from '../setup/db';

export const E2E_FIRST_PASSWORD = 'first-pass-e2e';
export const E2E_OWNER_PASSWORD = 'owner-pass-e2e';

export default async function globalSetup() {
  process.env.DATABASE_URL ||= 'postgres://postgres:postgres@localhost:5433/sns_test';
  await migrateTestDatabase();
  for (const project of ['desktop', 'phone']) {
    const phone = `077${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
    execFileSync('npx', ['tsx', '--conditions=react-server', 'scripts/people-add.ts', '--name', `Sample ${project}`, '--phone', phone], {
      stdio: 'pipe',
      env: { ...process.env, FIRST_PASSWORD: E2E_FIRST_PASSWORD },
    });
    process.env[`E2E_PHONE_${project.toUpperCase()}`] = phone;
  }
  process.env.E2E_OWNER_PHONE = execFileSync('npx', ['tsx', '--conditions=react-server', 'tests/e2e/owner-setup.ts'], {
    encoding: 'utf8', env: { ...process.env, E2E_OWNER_PASSWORD },
  }).trim().split('\n').pop();
}
