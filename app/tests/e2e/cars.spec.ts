// Screens 04.1 All cars, 04.2/04.3 Car details, 04.4 Edit car and 04.8 Add a car in the browser (ST-04.1 to ST-04.3).
// The owner is the test database's one owner (global-setup.ts); each run adds its own sample car with a sample plate.
import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}
const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

test('ST-04.1 to 04.3: the owner adds and edits a car; staff see it without its terms', async ({ page, browser }) => {
  test.setTimeout(90_000);
  const plate = `SMP ${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  // 04.8: a partner Prius; its starting package fills in, and the rate is changed before saving.
  await page.goto('/cars');
  await page.getByRole('link', { name: 'Add a car' }).click();
  await expect(page).toHaveURL(/\/cars\/new$/);
  await page.getByLabel('Registration number').fill(plate.toLowerCase());
  await page.getByRole('radio', { name: 'Prius' }).check();
  await expect(page.locator('input[name="dailyRate"]')).toHaveValue('6500');
  await page.getByRole('radio', { name: /Partner/ }).check();
  await expect(page.locator('input[name="commissionPercent"]')).toHaveValue('15');
  await page.locator('input[name="dailyRate"]').fill('6800');
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save car' }).click();

  // 04.2: the owner sees the terms and the history.
  await expect(page).toHaveURL(/\/cars\/[0-9a-f-]+\?saved=1$/);
  const carUrl = page.url().replace(/\?.*$/, '');
  await expect(page.getByLabel(`Registration ${plate}`).first()).toBeVisible();
  await expect(page.locator('[data-term="dailyRate"]')).toHaveText('LKR 6,800');
  await expect(page.locator('[data-term="commissionPercent"]')).toHaveText('15%');
  await expect(page.getByText(`changed the daily rate of ${plate} from LKR 6,500 to LKR 6,800`)).toBeVisible();

  // 04.4: the km a day changes; a mistake is refused.
  await page.getByRole('link', { name: 'Edit package and terms' }).click();
  await page.locator('input[name="kmPerDay"]').fill('12.5');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.rt-field-error', { hasText: 'Whole number, 1 to 1,000.' })).toBeVisible();
  await page.locator('input[name="kmPerDay"]').fill('120');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\?saved=1$/);
  await expect(page.locator('[data-term="kmPerDay"]')).toHaveText('120 km');

  // 04.1: on the list, under Partner.
  await page.goto('/cars?owner=partner');
  const row = page.locator(`[data-plate="${plate}"]`);
  await expect(row).toContainText('Partner · not linked yet');
  expect(await noSideScroll(page)).toBe(false);

  // 04.3: a staff member sees the car, but not its terms, and may not add or edit.
  const phone = `078${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
  await page.goto('/settings/people/new');
  const staffName = `Sample cars ${randomUUID().slice(0, 8)}`;
  await page.locator('input[name="name"]').fill(staffName);
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill('first-pass-1');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/settings\/people$/);
  const staff = await browser.newPage();
  await signIn(staff, phone, 'first-pass-1');
  await expect(staff).toHaveURL(/\/first-sign-in$/);
  await staff.locator('input[name="password"]').fill('own-pass-123');
  await staff.locator('input[name="repeat"]').fill('own-pass-123');
  await staff.locator('button[type="submit"]').click();
  await expect(staff).toHaveURL(/\/$/);
  await staff.goto(carUrl);
  await expect(staff.getByLabel(`අංකය ${plate}`).first()).toBeVisible();
  await expect(staff.locator('[data-term]')).toHaveCount(0);
  await expect(staff.locator(`a[href$="/edit"]`)).toHaveCount(0);
  expect((await staff.goto('/cars/new'))?.status()).toBe(403);
  expect((await staff.goto(`${carUrl}/edit`))?.status()).toBe(403);

  // Given "Add or edit cars and packages" only, the staff member edits the package; the commission (a partner term)
  // is not on the page and not in what the server sends (#18 review).
  await page.goto('/settings/permissions');
  await page.getByRole('checkbox', { name: `Add or edit cars and packages · ${staffName}` }).check();
  await expect(async () => {
    await page.reload();
    await expect(page.getByRole('checkbox', { name: `Add or edit cars and packages · ${staffName}` })).toBeChecked({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  const res = await staff.goto(`${carUrl}/edit`);
  expect(res?.status()).toBe(200);
  await expect(staff.locator('input[name="dailyRate"]')).toHaveValue('6800');
  await expect(staff.locator('input[name="commissionPercent"]')).toHaveCount(0);
  expect(await res!.text()).not.toMatch(/commissionPercent\\?":15/);
  await staff.close();
});
