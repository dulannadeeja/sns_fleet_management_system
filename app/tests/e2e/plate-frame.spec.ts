import { test, expect } from '@playwright/test';

// #13: the ported Plate frame draws, with no sideways scrolling, at desktop and phone sizes.
test('desktop frame: sidebar, top bar, Plate styles', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop layout');
  await page.goto('/plate');
  await expect(page.getByRole('navigation', { name: /Main menu/ })).toBeVisible();
  await expect(page.getByRole('banner')).toContainText('Plate');
  const side = await page.getByRole('navigation', { name: /Main menu/ }).boundingBox();
  expect(Math.round(side!.width)).toBe(264);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(238, 241, 240)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

test('phone frame: page header, tab bar with the centre action', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'phone layout');
  await page.goto('/plate?device=phone');
  await expect(page.getByRole('link', { name: 'ආපසු · Back' })).toBeVisible();
  const tabs = page.getByRole('navigation', { name: 'Tabs' });
  await expect(tabs.getByRole('link')).toHaveCount(5);
  await expect(tabs.getByRole('link').nth(2)).toHaveText('අලුත්');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});
