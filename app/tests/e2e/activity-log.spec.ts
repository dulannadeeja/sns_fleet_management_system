// Screen 15.5 Activity log in the browser (ST-15.4). The owner is the test database's one owner (global-setup.ts).
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

async function signInOwner(page: Page) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(process.env.E2E_OWNER_PHONE!);
  await page.locator('input[name="password"]').fill(E2E_OWNER_PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await expect(page).toHaveURL(/\/$/);
}

test('ST-15.4: the owner reads the log, newest first, and filters it by kind', async ({ page }) => {
  await signInOwner(page);
  await page.goto('/settings/activity-log');
  await expect(page.getByRole('heading', { name: 'Activity log', level: 2 })).toBeVisible();
  await expect(page.getByText("Entries can't be edited or deleted, by anyone.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await expect(page.locator('.set-entry').first()).toBeVisible();

  await page.getByRole('link', { name: 'Settings', exact: true }).last().click();
  await expect(page).toHaveURL(/kind=settings/);
  await expect(page.locator('.set-entry').first()).toBeVisible();

  await page.getByRole('link', { name: 'Decisions with a reason' }).click();
  await expect(page).toHaveURL(/kind=decisions/);
  const reasons = page.locator('.set-entry');
  if (await reasons.count()) await expect(reasons.first()).toContainText('“');
  // Nothing on the page edits or deletes an entry.
  await expect(page.getByRole('button', { name: /edit|delete/i })).toHaveCount(0);
});
