// Screens 08.1 Customers, 08.2 Customer details and 08.3 New customer in the browser (ST-08.1 to ST-08.3; AT-49, AT-51,
// AT-59). The owner is the test database's one owner (global-setup.ts). Sample customers and tiny sample files only.
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}
const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const jpeg = () => { const b = Buffer.alloc(64); b.set([0xff, 0xd8, 0xff, 0xe0]); return { name: 'nic-front.jpg', mimeType: 'image/jpeg', buffer: b }; };

test('ST-08.1 to 08.3: a customer is added with one copy, opened, corrected; the same NIC opens them again', async ({ page }) => {
  test.setTimeout(90_000);
  const nic = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
  const name = `Sample customer ${nic.slice(-6)}`;
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  // 08.3: saved with only the NIC front copy (AT-49: copies missing).
  await page.goto('/customers/new');
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="nic"]').fill(nic);
  await page.locator('input[name="phone"]').fill('0771234567');
  await page.locator('input[name="licenceNumber"]').fill('B1234567');
  await page.locator('input[name="licenceExpires"]').fill('2030-01-31');
  await page.locator('input[name="nicFront"]').setInputFiles(jpeg());
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save customer' }).click();
  await expect(page).toHaveURL(/\/customers\/[0-9a-f-]+\?saved=1$/);
  const url = page.url().replace(/\?.*$/, '');
  await expect(page.getByText('copies missing').first()).toBeVisible();

  // AT-59: the copy opens through the app only (logged by the module), as the file it is.
  const href = await page.locator('[data-copy="nicFront"] a').getAttribute('href');
  const res = await page.request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/jpeg');
  expect(res.headers()['cache-control']).toContain('no-store');

  // A missing copy is added on the details page; a wrong file is refused.
  await page.locator('[data-copy="licenceFront"] input[type="file"]').setInputFiles({ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('not a photo at all, just text') });
  await page.locator('[data-copy="licenceFront"] button').click();
  await expect(page.locator('[data-copy="licenceFront"] .rt-field-error')).toHaveText('Only a photo (JPEG, PNG, WebP, HEIC) or a PDF.');
  await page.locator('[data-copy="licenceFront"] input[type="file"]').setInputFiles(jpeg());
  await page.locator('[data-copy="licenceFront"] button').click();
  await expect(page).toHaveURL(/\?copy=1$/);
  await expect(page.locator('[data-copy="licenceFront"]')).toContainText('on file');

  // Correct the phone; the history keeps old and new.
  await page.getByRole('link', { name: 'Correct details' }).click();
  await page.locator('input[name="phone"]').fill('0712345678');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page).toHaveURL(/\?saved=1$/);
  await expect(page.getByText('corrected the phone of')).toBeVisible();

  // AT-51: the same NIC again opens this customer; nothing new is saved.
  await page.goto('/customers/new');
  await page.locator('input[name="name"]').fill('Someone else');
  await page.locator('input[name="nic"]').fill(`${nic.slice(0, 6)} ${nic.slice(6)}`);
  await page.locator('input[name="phone"]').fill('0779999999');
  await page.locator('input[name="licenceNumber"]').fill('B7654321');
  await page.locator('input[name="licenceExpires"]').fill('2031-01-31');
  await page.getByRole('button', { name: 'Save customer' }).click();
  await expect(page).toHaveURL(new RegExp(`${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?existing=1$`));
  await expect(page.getByText('This NIC is already a customer.')).toBeVisible();

  // 08.1: found by NIC.
  await page.goto(`/customers?q=${nic}`);
  await expect(page.locator(`[data-customer="${nic}"]`)).toContainText(name);
  expect(await noSideScroll(page)).toBe(false);
});
