// Screens 05.1 Customer and warnings, 05.2 Choose a car and 05.3 Dates and estimate in the browser (ST-05.1 to ST-05.3;
// #51). The owner is the test database's one owner (global-setup.ts). Sample car and customers only.
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

async function addCustomer(page: Page, name: string, nic: string) {
  await page.goto('/customers/new');
  await expect(page.getByRole('button', { name: 'Save customer' })).toBeEnabled();
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="nic"]').fill(nic);
  await page.locator('input[name="phone"]').fill('0771234567');
  await page.locator('input[name="licenceNumber"]').fill('B1234567');
  await page.locator('input[name="licenceExpires"]').fill('2030-01-31');
  await page.getByRole('button', { name: 'Save customer' }).click();
  await expect(page).toHaveURL(/\/customers\/[0-9a-f-]+\?saved=1$/);
  return page.url().replace(/\?.*$/, '').split('/').pop()!;
}

test('ST-05.1 to 05.3: a new rental is saved for a free car; the car is then held; a flag needs a decision first', async ({ page }) => {
  test.setTimeout(120_000);
  const tag = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const plate = `SMP ${tag}`;
  const nic = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/(cars)?$/);

  // A sample Wagon R and a sample customer.
  await page.goto('/cars/new');
  await expect(page.getByRole('button', { name: 'Save car' })).toBeEnabled();
  await page.getByLabel('Registration number').fill(plate);
  await page.getByRole('radio', { name: 'Wagon R', exact: true }).check();
  await page.getByRole('button', { name: 'Save car' }).click();
  await expect(page).toHaveURL(/\/cars\/[0-9a-f-]+\?saved=1$/);
  const customerId = await addCustomer(page, `Sample renter ${tag}`, nic);

  // 05.1: find the customer; no warnings; a first rental.
  await page.goto('/rentals/new');
  await page.locator('input[name="q"]').fill(nic);
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator(`[data-customer="${nic}"]`).click();
  await expect(page.getByText('First rental. Saving it approves this first-time customer.')).toBeVisible();
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('link', { name: 'Continue' }).click();

  // 05.2: the sample car is free; choose it.
  await expect(page).toHaveURL(/\/rentals\/new\/car\?/);
  expect(await noSideScroll(page)).toBe(false);
  await page.locator(`[data-car="${plate}"]`).click();

  // 05.3: two days of a Wagon R is 9,000 + extra km; save.
  await expect(page.getByRole('button', { name: `Save and hold ${plate}` })).toBeEnabled();
  await page.locator('input[name="days"]').fill('2');
  await expect(page.locator('[data-estimate]')).toHaveAttribute('data-estimate', '9000');
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: `Save and hold ${plate}` }).click();
  await expect(page).toHaveURL(/\/rentals\/[0-9a-f-]+\/terms\?saved=1$/);
  await expect(page.getByText(`${plate} is held for this rental`)).toBeVisible();
  const rentalUrl = page.url().replace(/\/terms\?.*$/, '');

  // 05.4: a deposit of 0 is refused; 10,000 at return, fuel not counted, a reference person needed.
  // The save button turns on once the page is ready and the choices are made.
  await expect(async () => {
    await page.getByRole('radio', { name: /^At return/ }).check();
    await page.getByRole('radio', { name: /^Not required/ }).check();
    await expect(page.getByRole('button', { name: 'Save and continue' })).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await page.locator('input[name="deposit"]').fill('0');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.locator('.rt-field-error', { hasText: '500,000' })).toBeVisible();
  await page.locator('input[name="deposit"]').fill('10000');
  await page.getByRole('radio', { name: /^Required/ }).check();
  expect(await noSideScroll(page)).toBe(false);

  // 05.6: add a reference person with one copy; back on 05.4 they are chosen.
  await page.getByRole('link', { name: 'Add a reference person' }).click();
  await expect(page.getByRole('button', { name: 'Save reference' })).toBeEnabled();
  const refNic = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
  await page.locator('input[name="name"]').fill(`Sample Reference ${tag}`);
  await page.locator('input[name="nic"]').fill(refNic);
  await page.locator('input[name="phone"]').fill('0712345678');
  await page.getByRole('radio', { name: 'Friend' }).check();
  const jpeg = Buffer.alloc(64); jpeg.set([0xff, 0xd8, 0xff, 0xe0]);
  await page.locator('input[name="nicFront"]').setInputFiles({ name: 'nic-front.jpg', mimeType: 'image/jpeg', buffer: jpeg });
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save reference' }).click();
  await expect(page).toHaveURL(/\/terms\?ref=[0-9a-f-]+$/);
  await expect(page.locator(`[data-reference="${refNic}"] input`)).toBeChecked();
  await expect(async () => {
    await page.getByRole('radio', { name: /^At return/ }).check();
    await expect(page.getByRole('button', { name: 'Save and continue' })).toBeEnabled({ timeout: 1000 });
  }).toPass();
  await page.locator('input[name="deposit"]').fill('10000');
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // The rental shows the deposit and the reference copies still missing (AT-07: handover will wait for them).
  await expect(page).toHaveURL(new RegExp(`${rentalUrl.replace(/[/.]/g, '\\$&')}\\?terms=1$`));
  await expect(page.locator('[data-deposit]')).toHaveText('LKR 10,000');
  await expect(page.locator('[data-ref-missing]')).toHaveAttribute('data-ref-missing', 'nicBack licence');
  await expect(page.locator('[data-estimate]')).toHaveAttribute('data-estimate', '9000');

  // The car is now held: it is no longer offered on 05.2.
  await page.goto(`/rentals/new/car?customer=${customerId}`);
  await expect(page.locator(`[data-car="${plate}"]`)).toHaveCount(0);

  // A second customer with an open flag: a reason is needed before choosing a car.
  const nic2 = String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
  const flagged = await addCustomer(page, `Sample flagged ${tag}`, nic2);
  await page.goto(`/customers/${flagged}/flags/new`);
  await expect(page.getByRole('button', { name: 'Add flag' })).toBeEnabled();
  await page.getByRole('radio', { name: 'Unpaid money' }).check();
  await page.locator('input[name="details"]').fill('Sample: unpaid bill');
  await page.getByRole('button', { name: 'Add flag' }).click();
  await expect(page).toHaveURL(new RegExp(`/customers/${flagged}(\\?.*)?$`));
  await page.goto(`/rentals/new?customer=${flagged}`);
  await expect(page.locator('[data-flag="unpaid"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue' })).toHaveCount(0);
  await page.locator('input[name="reason"]').fill('Sample: will pay on Monday');
  await page.locator('form button[type="submit"]').last().click();
  await expect(page).toHaveURL(/\/rentals\/new\/car\?customer=[0-9a-f-]+&ok=[0-9a-f-]+$/);
  await expect(page.getByText('Your decision to continue is recorded for this rental.')).toBeVisible();
});
