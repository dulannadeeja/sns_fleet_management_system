// Screens 04.5 Change a car's status and the status block of 04.2/04.3 in the browser (ST-04.5; AT-20, AT-25, AT-52
// partial). The owner is the test database's one owner; each run adds its own sample car and sample staff member.
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

test('ST-04.5: staff mark a car under repair; only the owner side marks it available, retires it and brings it back', async ({ page, browser }) => {
  test.setTimeout(120_000);
  const plate = `SMP ${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/cars/new');
  await expect(page.getByRole('button', { name: 'Save car' })).toBeEnabled();
  await page.getByLabel('Registration number').fill(plate);
  await page.getByRole('radio', { name: 'Alto' }).check();
  await page.getByRole('button', { name: 'Save car' }).click();
  await expect(page).toHaveURL(/\/cars\/[0-9a-f-]+\?saved=1$/);
  const carUrl = page.url().replace(/\?.*$/, '');

  // A staff member marks it Under repair with a reason; they may not mark it available or retire it.
  const phone = `078${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
  await page.goto('/settings/people/new');
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled(); // ready: typing before this is cleared
  await page.locator('input[name="name"]').fill(`Sample status ${randomUUID().slice(0, 8)}`);
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
  await staff.goto(`${carUrl}/status`);
  await expect(staff.getByRole('button', { name: 'තත්වය වෙනස් කරන්න' })).toBeEnabled();
  await expect(staff.getByRole('radio')).toHaveCount(2); // Under repair and Unavailable: no Retire, no Available
  await staff.getByRole('button', { name: 'තත්වය වෙනස් කරන්න' }).click();
  await expect(staff.getByText('හේතුව ගහන්න.')).toBeVisible();
  await staff.getByLabel(/^හේතුව/).fill('Sample: AC fault, at the garage');
  expect(await noSideScroll(staff)).toBe(false);
  await staff.getByRole('button', { name: 'තත්වය වෙනස් කරන්න' }).click();
  await expect(staff).toHaveURL(/\?status=1$/);
  await expect(staff.locator('[data-status-line]')).toContainText('Sample: AC fault, at the garage');
  await expect(staff.getByText('නිදහස් කරන්න පුළුවන් අවසරය තියෙන කෙනෙකුට විතරයි.')).toHaveCount(0); // staff may still change it
  await expect(staff.getByRole('link', { name: 'නිදහස් කරන්න' })).toHaveCount(0);
  await staff.close();

  // The owner marks it available, then retires it with a reason, then brings it back.
  await page.goto(carUrl);
  await expect(page.getByText('Under repair').first()).toBeVisible();
  await page.getByRole('link', { name: 'Mark available' }).click();
  await expect(page.getByRole('button', { name: 'Change status' })).toBeEnabled();
  await page.getByRole('button', { name: 'Change status' }).click();
  await expect(page).toHaveURL(/\?status=1$/);
  await expect(page.locator('[data-status-line]')).toHaveCount(0);

  await page.getByRole('link', { name: 'Change status' }).click();
  await expect(page.getByRole('button', { name: 'Change status' })).toBeEnabled();
  await page.getByRole('radio', { name: 'Retired' }).check();
  await page.getByLabel(/^Reason/).fill('Sample: sold');
  await page.getByRole('button', { name: 'Change status' }).click();
  await expect(page).toHaveURL(/\?status=1$/);
  await expect(page.locator('[data-status-line]')).toContainText('Sample: sold');
  await expect(page.getByText(`changed the status of ${plate} from Available to Retired`)).toBeVisible();

  await page.getByRole('link', { name: 'Bring back' }).click();
  await expect(page.getByRole('button', { name: 'Change status' })).toBeEnabled();
  await page.getByLabel(/^Why it comes back/).fill('Sample: retired by mistake');
  await page.getByRole('button', { name: 'Change status' }).click();
  await expect(page).toHaveURL(/\?status=1$/);
  await expect(page.getByText(`changed the status of ${plate} from Retired to Available`)).toBeVisible();
});
