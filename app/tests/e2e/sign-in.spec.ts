// Screens 01.1 and 01.2 in the browser (ST-01.1, ST-01.2; AT-46, AT-60 are proved in tests/at/).
// One sample person per project, added by global-setup.ts with a first password.
import { test, expect, type Page } from '@playwright/test';
import { E2E_FIRST_PASSWORD } from './global-setup';

const NEW_PASSWORD = 'own-pass-e2e-1';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

async function noSidewaysScroll(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(wide).toBe(false);
}

test('a signed-out visitor is sent to sign in', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'si');
  await noSidewaysScroll(page);
});

test('the sign-in page can switch to English before signing in', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});

test('a wrong password shows the message and stays on sign in', async ({ page }) => {
  await signIn(page, '0700000000', 'not-the-password');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('first sign-in: set an own password, choose English, then sign out', async ({ page }, info) => {
  const phone = process.env[`E2E_PHONE_${info.project.name.toUpperCase()}`]!;
  await signIn(page, phone, E2E_FIRST_PASSWORD);
  await expect(page).toHaveURL(/\/first-sign-in$/);
  await noSidewaysScroll(page);

  // Nothing else opens until the password is set.
  await page.goto('/');
  await expect(page).toHaveURL(/\/first-sign-in$/);

  // Too short first, then the real one.
  await page.locator('input[name="password"]').fill('short');
  await page.locator('input[name="repeat"]').fill('short');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.rt-field-error')).toBeVisible();

  await page.locator('input[name="password"]').fill(NEW_PASSWORD);
  await page.locator('input[name="repeat"]').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText(`Signed in: Sample ${info.project.name}`)).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'si');

  // The first password no longer works; the own one does.
  await signIn(page, phone, E2E_FIRST_PASSWORD);
  await expect(page.getByRole('alert')).toBeVisible();
  await signIn(page, phone, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/$/);
});
