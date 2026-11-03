// Papers and service (ST-04.6) and the catalogue photo (ST-04.7, AT-29) in the browser. The owner is the test
// database's one owner; each run adds its own sample car and uses the SNS pack's Alto image as a sample photo.
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

const SAMPLE_PHOTO = fileURLToPath(new URL('../../../brand/vehicles/256/sns-vehicle-alto.png', import.meta.url));

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}
const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const shows = (page: Page) => page.locator('.car-pic-lg').getAttribute('data-photo');

test('ST-04.6, AT-29: papers and service dates; the standard image, then a photo, then the standard image again', async ({ page }) => {
  test.setTimeout(120_000);
  const plate = `SMP ${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/cars/new');
  await expect(page.getByRole('button', { name: 'Save car' })).toBeEnabled();
  await page.getByLabel('Registration number').fill(plate);
  await page.getByRole('radio', { name: 'Wagon R' }).check();
  await page.getByRole('button', { name: 'Save car' }).click();
  await expect(page).toHaveURL(/\/cars\/[0-9a-f-]+\?saved=1$/);
  const carUrl = page.url().replace(/\?.*$/, '');

  // No photo yet: the model's standard image; papers not recorded.
  expect(await shows(page)).toBe('standard');
  await expect(page.locator('.car-pic-lg img')).toHaveAttribute('src', '/plate/vehicles/512/sns-vehicle-wagon-r.png');
  await expect(page.locator('[data-paper="insuranceExpires"]')).toHaveText('not recorded');
  // The card on All cars shows the standard image too, before any photo.
  await page.goto('/cars');
  await expect(page.locator(`[data-plate="${plate}"] .car-pic`)).toHaveAttribute('data-photo', 'standard');
  await page.goto(carUrl);

  // Papers and service: a mistake is refused, then saved and shown, and logged.
  await page.getByRole('link', { name: 'Change papers and service' }).click();
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
  await page.getByLabel('Insurance expires').fill('2026-12-04');
  await page.getByLabel('Next service at km').fill('25.5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Check the marked boxes: a real date, or whole km.').first()).toBeVisible();
  await page.getByLabel('Next service at km').fill('25500');
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\?papers=1$/);
  await expect(page.locator('[data-paper="insuranceExpires"]')).toContainText(/until .* · \d+ days? left|expired/);
  await expect(page.locator('[data-paper="nextServiceKm"]')).toHaveText('25,500 km');
  await expect(page.getByText(`changed the next service km of ${plate} from not recorded to 25,500 km`)).toBeVisible();

  // The catalogue photo: added on Edit car, shown on the page and the list, then removed.
  await page.goto(`${carUrl}/edit`);
  await expect(page.getByRole('button', { name: 'Add photo' })).toBeEnabled();
  await page.locator('input[name="photo"]').setInputFiles(SAMPLE_PHOTO);
  await page.getByRole('button', { name: 'Add photo' }).click();
  await expect(page).toHaveURL(/\?photo=saved$/);
  await page.goto(carUrl);
  expect(await shows(page)).toBe('own');
  await expect.poll(() => page.locator('.car-pic-lg img').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
  await page.goto('/cars');
  await expect(page.locator(`[data-plate="${plate}"] .car-pic`)).toHaveAttribute('data-photo', 'own');
  expect(await noSideScroll(page)).toBe(false);

  await page.goto(`${carUrl}/edit`);
  await expect(page.getByRole('button', { name: 'Remove photo' })).toBeEnabled();
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(page).toHaveURL(/\?photo=removed$/);
  await page.goto(carUrl);
  expect(await shows(page)).toBe('standard');
});
