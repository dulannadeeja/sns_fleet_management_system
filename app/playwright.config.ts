import { defineConfig, devices } from '@playwright/test';

// Browser journeys run against the test database (the same one as npm run test). The dev server reads
// BETTER_AUTH_SECRET from .env.local on a laptop; CI sets it in the workflow.
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/sns_test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // The dev server compiles each page on its first visit; under parallel tests that can take more than the 5 s default.
  expect: { timeout: 10000 },
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: false, timeout: 120000, env: { DATABASE_URL } },
});
