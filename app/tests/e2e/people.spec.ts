// Screens 15.1, 15.3, 15.4 and 15.6 in the browser (ST-15.1, ST-15.2; AT-24, AT-46, AT-47, AT-58 are proved in tests/at/).
// The owner is the test database's one owner, given a test password by global-setup.ts. Sample names and numbers.
import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

async function noSidewaysScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
}

const newPhone = () => `078${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;

test('ST-15.2: the owner adds a person, resets their password, turns the account off and on', async ({ page }, info) => {
  const name = `Sample ${info.project.name} ${randomUUID().slice(0, 8)}`;
  const phone = newPhone();
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('link', { name: /people and permissions/ }).click();
  await expect(page).toHaveURL(/\/settings\/people$/);
  await noSidewaysScroll(page);

  // 15.4: what is wrong is named on the box; then a staff member is added.
  await page.getByRole('link', { name: 'Add person' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.rt-field-error')).toHaveCount(1);
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill('first-pass-1');
  await expect(page.getByRole('radio', { name: /Partner/ })).toBeDisabled();
  await noSidewaysScroll(page);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/settings\/people$/);
  const row = page.getByRole('link', { name: new RegExp(name) });
  await expect(row).toContainText("Agreed staff defaults");
  await expect(row).toContainText('Active');

  // 15.6: reset, turn off with a reason, turn on.
  await row.click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await noSidewaysScroll(page);
  await page.locator('input[name="password"]').fill('given-by-owner-1');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText(/Give the new first password/)).toBeVisible();
  await page.getByRole('button', { name: 'Turn off' }).click();
  await expect(page.getByText('Write why the account is turned off.')).toBeVisible();
  await page.locator('input[name="reason"]').fill('Sample: left SNS');
  await page.getByRole('button', { name: 'Turn off' }).click();
  await expect(page.getByText(/Reason: Sample: left SNS/)).toBeVisible();
  await page.getByRole('button', { name: 'Turn on' }).click();
  await expect(page.getByRole('button', { name: 'Turn off' })).toBeVisible();
});

test('ST-15.1: the owner gives a permission; staff cannot open Settings (403)', async ({ page, browser }, info) => {
  const name = `Sample perm ${info.project.name} ${randomUUID().slice(0, 8)}`;
  const phone = newPhone();
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/settings/people/new');
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill('first-pass-1');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/settings\/people$/);

  await page.goto('/settings/permissions');
  await noSidewaysScroll(page);
  const box = page.getByRole('checkbox', { name: `Export reports · ${name}` });
  await expect(box).not.toBeChecked();
  await box.check();
  // Saved on the server: a fresh page shows it ticked.
  await expect(async () => {
    await page.reload();
    await expect(page.getByRole('checkbox', { name: `Export reports · ${name}` })).toBeChecked({ timeout: 1000 });
  }).toPass({ timeout: 15000 });

  // The new staff member signs in, sets their own password, and is refused Settings.
  const staff = await browser.newPage();
  await signIn(staff, phone, 'first-pass-1');
  await expect(staff).toHaveURL(/\/first-sign-in$/);
  await staff.locator('input[name="password"]').fill('own-pass-123');
  await staff.locator('input[name="repeat"]').fill('own-pass-123');
  await staff.locator('button[type="submit"]').click();
  await expect(staff).toHaveURL(/\/$/);
  const res = await staff.goto('/settings/people');
  expect(res?.status()).toBe(403);
  await expect(staff.getByRole('heading', { level: 1 })).toBeVisible();
  await staff.close();
});
