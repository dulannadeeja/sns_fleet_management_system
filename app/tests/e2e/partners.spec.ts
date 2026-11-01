// Screens 11.1 Partner owners, 11.2 Partner details and 11.3 Add a partner in the browser (ST-11.1 to ST-11.3). The
// owner is the test database's one owner (global-setup.ts); each run adds its own sample car and sample partner.
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
const newPhone = () => `078${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;

test('ST-11.1 to 11.3: the owner adds a partner with a car; the partner signs in; staff are refused', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const plate = `SMP ${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  const name = `Sample partner ${randomUUID().slice(0, 8)}`;
  const phone = newPhone();
  const nic = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  // A partner car, not linked yet.
  await page.goto('/cars/new');
  await page.getByLabel('Registration number').fill(plate);
  await page.getByRole('radio', { name: 'Alto' }).check();
  await page.getByRole('radio', { name: /Partner/ }).check();
  await page.getByRole('button', { name: 'Save car' }).click();
  await expect(page).toHaveURL(/\/cars\/[0-9a-f-]+\?saved=1$/);
  const carUrl = page.url().replace(/\?.*$/, '');

  // 11.1: it waits for an owner.
  await page.goto('/partners');
  await expect(page.locator('#unlinked')).toBeVisible();
  await expect(page.getByLabel(`Registration ${plate}`)).toBeVisible();
  expect(await noSideScroll(page)).toBe(false);

  // 11.3: the partner, with that car at 12% and tyres paid by the owner; a bad NIC is refused first.
  await page.getByRole('link', { name: 'Add partner' }).click();
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="nic"]').fill('12345');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill('first-pass-1');
  await page.locator('label.ptn-car', { hasText: plate }).locator('input').check();
  await page.locator('input[name^="commission."]').fill('12');
  await page.locator('.ptn-terms label', { hasText: 'Tyres' }).locator('input').check();
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save partner' }).click();
  await expect(page.getByText('9 digits and V or X, or 12 digits, as on the card.')).toBeVisible();
  await expect(page.locator('input[name^="commission."]')).toHaveValue('12'); // kept after the refusal
  await page.locator('input[name="nic"]').fill(nic);
  await page.locator('input[name="password"]').fill('first-pass-1');
  await page.getByRole('button', { name: 'Save partner' }).click();

  // 11.2: cars and terms; the agreement date is recorded.
  await expect(page).toHaveURL(/\/partners\/[0-9a-f-]+\?saved=1$/);
  await expect(page.locator(`[data-terms="${plate}"]`)).toHaveText('12% commission · cash-out any day · Tyres paid by the owner');
  await expect(page.locator('[data-agreement]')).toHaveText('Not yet recorded as signed · cash-outs are not held back.');
  await page.locator('input[name="signedOn"]').fill('2026-10-30');
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.locator('[data-agreement]')).toHaveText('Signed on Oct 30, 2026');

  // The car now shows its owner; the partner signs in and changes the first password.
  await page.goto(carUrl);
  await expect(page.getByText(`Alto · Partner · ${name}`)).toBeVisible();
  const partner = await browser.newPage();
  await signIn(partner, phone, 'first-pass-1');
  await expect(partner).toHaveURL(/\/first-sign-in$/);
  await partner.close();

  // Staff see no partner pages (partner terms are not theirs, DN-01).
  const staffPhone = newPhone();
  await page.goto('/settings/people/new');
  await page.locator('input[name="name"]').fill(`Sample staff ${randomUUID().slice(0, 8)}`);
  await page.locator('input[name="phone"]').fill(staffPhone);
  await page.locator('input[name="password"]').fill('first-pass-1');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/settings\/people$/);
  const staff = await browser.newPage();
  await signIn(staff, staffPhone, 'first-pass-1');
  await expect(staff).toHaveURL(/\/first-sign-in$/);
  await staff.locator('input[name="password"]').fill('own-pass-123');
  await staff.locator('input[name="repeat"]').fill('own-pass-123');
  await staff.locator('button[type="submit"]').click();
  await expect(staff).toHaveURL(/\/$/);
  expect((await staff.goto('/partners'))?.status()).toBe(403);
  expect((await staff.goto('/partners/new'))?.status()).toBe(403);
  await staff.close();
});
