import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// #13: the ported Plate frame draws at the agreed sizes with no sideways scrolling (guidebook 07: 264 px sidebar
// from 1,100 px, 104 px rail below; the phone tab bar with the staff centre action).
const paper = /--paper:\s*([^;]+);/.exec(readFileSync('src/ui/plate/tokens.css', 'utf8'))![1].trim();
const hex = (h: string) => `rgb(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ')})`;
const sideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

for (const [width, sidebar] of [[1440, 264], [1280, 264], [1100, 264], [1024, 104]] as const) {
  test(`desktop frame at ${width} px: sidebar ${sidebar} px, top bar, Plate ground`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop layout');
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/plate');
    const menu = page.getByRole('navigation', { name: /Main menu/ });
    await expect(menu).toBeVisible();
    expect(Math.round((await menu.boundingBox())!.width)).toBe(sidebar);
    await expect(page.getByRole('banner')).toContainText('Plate');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(hex(paper));
    expect(await sideways(page)).toBe(0);
  });
}

for (const width of [412, 390, 360]) {
  test(`phone frame at ${width} px: page header, tab bar with the centre action`, async ({ page }, info) => {
    test.skip(info.project.name !== 'phone', 'phone layout');
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/plate?device=phone');
    await expect(page.getByRole('link', { name: 'ආපසු · Back' })).toBeVisible();
    const tabs = page.getByRole('navigation', { name: /Main menu/ });
    await expect(tabs.getByRole('link')).toHaveCount(5);
    await expect(tabs.getByRole('link').nth(2)).toHaveText('අලුත්');
    expect(await sideways(page)).toBe(0);
  });
}
