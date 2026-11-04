// Screen 01.3 Ready to start · setup checklist (ST-01.3, AT-43) in the browser. The owner is the test database's one
// owner. Ticks are shared: each browser project ticks its own item and puts it back as it found it.
import { test, expect, type Page } from '@playwright/test';
import { E2E_OWNER_PASSWORD } from './global-setup';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}
const noSideScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

test('ST-01.3: the owner sees what is missing, ticks an item done and not done again; go-live stays blocked', async ({ page }, info) => {
  test.setTimeout(90_000);
  const mine = info.project.name === 'phone' ? 'staffAccounts' : 'openDecisions';
  await signIn(page, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(page).toHaveURL(/\/(cars)?$/);
  await expect(page.locator('[data-golive]')).toContainText(/Ready to start: \d+ of 10 done/);
  await page.locator('[data-golive]').click();
  await expect(page).toHaveURL(/\/settings\/golive$/);

  // Items whose part is not built yet block, and so does any car without its dates.
  await expect(page.getByText('Go-live is blocked until every item is done.')).toBeVisible();
  await expect(page.locator('[data-item="openingCash"]')).toContainText('Not ready · comes with Money');
  await expect(page.locator('[data-item="carDates"]')).toContainText('Checked by the system');
  expect(await noSideScroll(page)).toBe(false);

  const item = page.locator(`[data-item="${mine}"]`);
  const flip = async (toDone: boolean) => {
    if (toDone) {
      await expect(item.getByRole('button', { name: 'Mark done' })).toBeEnabled();
      await item.getByRole('button', { name: 'Mark done' }).click();
      await expect(item).toHaveAttribute('data-done', 'yes');
      await expect(item).toContainText('Ticked by');
    } else {
      await expect(item.getByRole('button', { name: 'Mark not done' })).toBeEnabled();
      await item.getByRole('button', { name: 'Mark not done' }).click();
      await expect(item.getByText('Write why it is not done.')).toBeVisible();
      await item.getByLabel(/^Why it is not done/).fill('Sample: checked again in the browser test');
      await item.getByRole('button', { name: 'Mark not done' }).click();
      await expect(item).toHaveAttribute('data-done', 'no');
      await expect(item).toContainText('Sample: checked again in the browser test');
    }
  };
  const startedDone = (await item.getAttribute('data-done')) === 'yes';
  await flip(!startedDone);
  await flip(startedDone); // put back
});
