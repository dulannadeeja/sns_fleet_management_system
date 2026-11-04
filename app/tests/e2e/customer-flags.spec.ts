// Screens 08.5 Add a customer flag and 08.4 Flag and expired licence warning, and the flags on 08.2, in the browser
// (ST-08.4, ST-08.5, AT-48). The owner is the test database's one owner; each run adds its own sample customer.
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}
const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

test('ST-08.5, ST-08.4, AT-48: flag a customer, check before a rental, continue with a reason, close the flag', async ({ page }) => {
  test.setTimeout(120_000);
  const nic = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
  const name = `Sample flagged ${nic.slice(-6)}`;
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  // A sample customer whose licence has expired.
  await page.goto('/customers/new');
  await expect(page.getByRole('button', { name: 'Save customer' })).toBeEnabled(); // ready: typing before this is cleared
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="nic"]').fill(nic);
  await page.locator('input[name="phone"]').fill('0771234567');
  await page.locator('input[name="licenceNumber"]').fill('B7654321');
  await page.locator('input[name="licenceExpires"]').fill('2020-01-31');
  await page.getByRole('button', { name: 'Save customer' }).click();
  await expect(page).toHaveURL(/\/customers\/[0-9a-f-]+\?saved=1$/);
  const url = page.url().replace(/\?.*$/, '');

  // 08.5: why and what happened are both needed.
  await page.getByRole('link', { name: 'Add a flag' }).click();
  await expect(page.getByRole('button', { name: 'Add flag' })).toBeEnabled();
  await page.getByRole('button', { name: 'Add flag' }).click();
  await expect(page.getByText('Choose why.')).toBeVisible();
  await page.getByRole('radio', { name: 'Unpaid money' }).check();
  await page.getByLabel(/^What happened/).fill('Sample: LKR 8,500 not paid after R-0197');
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Add flag' }).click();
  await expect(page).toHaveURL(/\?flag=added$/);
  await expect(page.getByText('Flag · Unpaid money · Sample: LKR 8,500 not paid after R-0197')).toBeVisible();

  // 08.4: both warnings; the owner continues with a reason, recorded with the name and time.
  await page.getByRole('link', { name: 'Check before a rental' }).click();
  await expect(page.locator('[data-flag="unpaid"]')).toBeVisible();
  await expect(page.locator('[data-licence="expired"]')).toContainText('Going ahead does not make the licence valid.');
  await expect(page.getByRole('button', { name: 'Continue with reason' })).toBeEnabled();
  await page.getByRole('button', { name: 'Continue with reason' }).click();
  await expect(page.getByText('Write the reason.')).toBeVisible();
  await page.getByLabel(/^Reason to continue/).fill('Sample: paying today, renewal receipt seen');
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Continue with reason' }).click();
  await expect(page).toHaveURL(/\?flag=decided$/);
  await expect(page.getByText(/Sample: paying today, renewal receipt seen/).first()).toBeVisible();

  // AT-48: closed with a reason; it no longer warns, and stays in the history.
  const flag = page.locator('[data-flag-state="open"]');
  await expect(flag.getByRole('button', { name: 'Close flag' })).toBeEnabled();
  await flag.getByLabel(/^Why it is closed/).fill('Sample: paid in full');
  await flag.getByRole('button', { name: 'Close flag' }).click();
  await expect(page).toHaveURL(/\?flag=closed$/);
  await expect(page.locator('[data-flag-state="closed"]')).toContainText('Sample: paid in full');
  await page.goto(`${url}/check`);
  await expect(page.locator('[data-flag]')).toHaveCount(0);
  await expect(page.locator('[data-licence="expired"]')).toBeVisible(); // the licence still warns
});
