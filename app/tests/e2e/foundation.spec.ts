import { test, expect } from '@playwright/test';

test('the application responds on the initial page', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', 'si');
});
