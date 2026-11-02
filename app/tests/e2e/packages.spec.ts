// Screen 04.6 Starting packages and its forms in the browser (ST-04.4, AT-50; system design 4.1, Proposed: Dulan,
// 2 Nov 2026). The owner is the test database's one owner (global-setup.ts). Packages are shared by every test: each
// run adds its own sample packages for a sample model, and never changes the real ones or the defaults.
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

test('ST-04.4: two packages for one model; a change applies to cars added afterwards; a new car picks its package', async ({ page }) => {
  test.setTimeout(90_000);
  const tag = randomUUID().slice(0, 8);
  const model = `E2E model ${tag}`;
  const [newer, older] = [`Sample E2E ${tag} new`, `Sample E2E ${tag} old`];
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);

  // 04.6 from the Settings menu: the 4.1 packages and the defaults, the commission included for the owner.
  await page.goto('/settings/business-rules');
  await page.locator('a[href="/settings/packages"]').first().click();
  await expect(page).toHaveURL(/\/settings\/packages$/);
  await expect(page.locator('[data-package="Alto"]')).toContainText('4,000');
  await expect(page.getByText('SNS commission')).toBeVisible();
  expect(await noSideScroll(page)).toBe(false);

  // Add two packages for the same new model; a mistake is refused first.
  for (const [name, rate] of [[newer, '7000'], [older, '6000']]) {
    await page.goto('/settings/packages/new');
    await page.getByLabel(/^Package name/).fill(name);
    await page.getByLabel(/^Models/).fill(model);
    await page.locator('input[name="dailyRate"]').fill(name === newer ? '0' : rate);
    await page.locator('input[name="kmPerDay"]').fill('100');
    await page.locator('input[name="extraKmRate"]').fill('25');
    await page.getByRole('button', { name: 'Save' }).click();
    if (name === newer) {
      await expect(page.locator('.rt-field-error', { hasText: '1 to 100,000' })).toBeVisible();
      await page.locator('input[name="dailyRate"]').fill(rate);
      await page.getByRole('button', { name: 'Save' }).click();
    }
    await expect(page).toHaveURL(/\/settings\/packages\?saved=1$/);
    await expect(page.locator(`[data-package="${name}"]`)).toContainText(model);
  }

  // Change the newer package's rate: 7,000 → 7,200; the log keeps old and new.
  await page.getByRole('link', { name: `Change: ${newer}` }).click();
  await page.locator('input[name="dailyRate"]').fill('7200');
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\?saved=1$/);
  await expect(page.locator(`[data-package="${newer}"]`)).toContainText('7,200');
  await page.goto('/settings/activity-log?kind=cars');
  await expect(page.getByText(`changed the daily rate of the starting package ${newer} from LKR 7,000 to LKR 7,200`).first()).toBeVisible();

  // 04.8 Add a car: the model has two packages, so one must be picked; the older one's rate fills in.
  await page.goto('/cars/new');
  await expect(page.getByRole('button', { name: 'Save car' })).toBeEnabled(); // ready for clicks (useReady)
  await page.getByLabel('Registration number').fill(`SMP ${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`);
  await page.getByRole('radio', { name: model, exact: true }).check();
  await page.getByRole('button', { name: 'Save car' }).click();
  await expect(page.getByText('Pick a package.')).toBeVisible();
  await page.getByRole('radio', { name: model, exact: true }).check();
  await page.getByRole('radio', { name: new RegExp(`^${older} `) }).check();
  await expect(page.locator('input[name="dailyRate"]')).toHaveValue('6000');
  await page.getByRole('button', { name: 'Save car' }).click();
  await expect(page).toHaveURL(/\/cars\/[0-9a-f-]+\?saved=1$/);
  await expect(page.locator('[data-term="dailyRate"]')).toHaveText('LKR 6,000');
});
