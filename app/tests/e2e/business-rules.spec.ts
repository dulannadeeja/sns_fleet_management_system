// Screens 15.2 Business rules and 15.7 Change a setting in the browser (ST-15.3, AT-45 settings part). The owner is the
// test database's one owner (global-setup.ts). Settings are shared: each browser project changes its own setting and
// puts it back, so the two projects never touch the same value.
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

test('ST-15.3: staff read the rules; the owner changes a setting, checks old → new, and the log keeps it', async ({ page, browser }, info) => {
  test.setTimeout(90_000);
  // Desktop changes the payroll reminder; phone the service km (each its own, put back at the end).
  // Only the value a form changes is saved, so the two projects never undo each other (#17 review).
  const mine = info.project.name === 'phone'
    ? { key: 'serviceReminderKm', label: 'Service by km', name: 'service reminder (km)', unit: (n: string) => `${Number(n).toLocaleString('en-US')} km`, other: (n: string) => (n === '600' ? '700' : '600') }
    : { key: 'payrollReminderDays', label: 'Payroll', name: 'payroll reminder', unit: (n: string) => `${n} days`, other: (n: string) => (n === '5' ? '6' : '5') };

  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  // A staff member, added by the owner, reads 15.2 without Change buttons and is refused 15.7.
  const phone = `078${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
  await page.goto('/settings/people/new');
  await page.locator('input[name="name"]').fill(`Sample rules ${info.project.name} ${randomUUID().slice(0, 8)}`);
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
  await staff.locator('a[href="/settings/business-rules"]').first().click();
  await expect(staff.locator('[data-group="reminders"]')).toBeVisible();
  await expect(staff.locator('a[href^="/settings/business-rules/"]')).toHaveCount(0);
  await expect(staff.getByText('SNS commission')).toHaveCount(0); // partner terms: not for staff
  expect((await staff.goto('/settings/business-rules/reminders'))?.status()).toBe(403);
  await staff.close();

  // The owner opens the reminders group from 15.2.
  await page.goto('/settings/business-rules');
  await expect(page.getByRole('heading', { name: 'Owner settings' })).toBeVisible();
  await expect(page.getByText('SNS commission')).toBeVisible();
  expect(await noSideScroll(page)).toBe(false);
  await page.locator('a[href="/settings/business-rules/reminders"]').click();
  await expect(page).toHaveURL(/\/settings\/business-rules\/reminders$/);
  await expect(page.getByRole('heading', { name: 'What this changes' })).toBeVisible();
  await expect(page.getByText(/A shorter time leaves less time to renew/)).toBeVisible();
  const box = page.getByLabel(mine.label, { exact: true });
  const before = await box.inputValue();
  const next = mine.other(before);
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();

  // A mistake is refused with the reason; nothing is saved.
  await box.fill('0');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText(/Must be/)).toBeVisible();

  // The check shows old → new before saving.
  await box.fill(next);
  await expect(page.locator(`[data-change="${mine.key}"]`)).toHaveText(`${mine.label}: ${mine.unit(before)} → ${mine.unit(next)}`);
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/settings\/business-rules\?saved=1$/);
  await expect(page.getByText('Saved.')).toBeVisible();

  await page.goto('/settings/activity-log?kind=settings');
  await expect(page.locator('.set-entry', { hasText: `changed the ${mine.name} from ${mine.unit(before)} to ${mine.unit(next)}` }).first()).toBeVisible();

  // Put it back.
  await page.goto('/settings/business-rules/reminders');
  await page.getByLabel(mine.label, { exact: true }).fill(before);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/saved=1$/);
});
