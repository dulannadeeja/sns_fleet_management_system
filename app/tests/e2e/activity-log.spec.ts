// Screen 15.5 Activity log in the browser (ST-15.4). The owner is the test database's one owner (global-setup.ts).
import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}

test('ST-15.4: the owner reads the log and filters it; staff are refused (403)', async ({ page, browser }, info) => {
  test.setTimeout(90_000);
  const name = `Sample log ${info.project.name} ${randomUUID().slice(0, 8)}`;
  const phone = `078${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;

  // The owner adds a staff member (so there is something to read).
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/settings/people/new');
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill('first-pass-1');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/settings\/people$/);

  // The staff member signs in and cannot open the log.
  const staff = await browser.newPage();
  await signIn(staff, phone, 'first-pass-1');
  await expect(staff).toHaveURL(/\/first-sign-in$/);
  await staff.locator('input[name="password"]').fill('own-pass-123');
  await staff.locator('input[name="repeat"]').fill('own-pass-123');
  await staff.locator('button[type="submit"]').click();
  await expect(staff).toHaveURL(/\/$/);
  expect((await staff.goto('/settings/activity-log'))?.status()).toBe(403);
  await staff.close();

  // The owner turns the account off with a reason: a decision with a reason.
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await page.locator('input[name="reason"]').fill('Sample: left SNS');
  await page.getByRole('button', { name: 'Turn off' }).click();
  await expect(page.getByText(/Reason: Sample: left SNS/)).toBeVisible();

  await page.goto('/settings/activity-log');
  await expect(page.getByRole('heading', { name: 'Activity log', level: 2 })).toBeVisible();
  await expect(page.getByText("Can't be edited or deleted")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await expect(page.locator('.set-entry', { hasText: `turned off the account of ${name}` })).toBeVisible();

  await page.getByRole('link', { name: 'Decisions with a reason' }).click();
  await expect(page).toHaveURL(/kind=decisions/);
  const decision = page.locator('.set-entry', { hasText: `turned off the account of ${name}` });
  await expect(decision).toContainText('reason: “Sample: left SNS”');
  await page.getByRole('link', { name: 'Settings', exact: true }).last().click();
  await expect(page.locator('.set-entry', { hasText: `added ${name} as Staff` })).toBeVisible();
  // Nothing on the page edits or deletes an entry.
  await expect(page.getByRole('button', { name: /edit|delete/i })).toHaveCount(0);
});
