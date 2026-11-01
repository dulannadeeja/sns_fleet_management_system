// Screens 01.4-01.7 and the email on 15.6 in the browser (#28; AT-61 is also proved in tests/at/at-61.test.ts).
// A sample admin per project, added by global-setup.ts with a first email and a first password. Sample addresses.
import { test, expect, type Page } from '@playwright/test';
import { E2E_FIRST_PASSWORD, E2E_OWNER_PASSWORD } from './global-setup';
import { mailCount, nextMail } from './outbox';

async function signIn(page: Page, phone: string, password: string) {
  await page.goto('/sign-in');
  // Signed out, the pages speak Sinhala; switch to English so the test reads English words.
  if ((await page.locator('html').getAttribute('lang')) !== 'en') {
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // Start again on a fresh page, so the language change cannot redraw the form while it is being filled.
    await page.goto('/sign-in');
  }
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').first().click();
}

test('AT-61: the admin on a new device needs the emailed code; then forgot password by email', async ({ page, browser }, info) => {
  test.setTimeout(180_000); // one long journey: two sign-ins with codes, a reset and the owner's change
  const P = info.project.name.toUpperCase();
  const phone = process.env[`E2E_ADMIN_PHONE_${P}`]!;
  const email = process.env[`E2E_ADMIN_EMAIL_${P}`]!;

  // 01.4: the right password alone is not enough.
  let seen = mailCount(email);
  await signIn(page, phone, E2E_FIRST_PASSWORD);
  await expect(page).toHaveURL(/\/sign-in\/code$/);
  const code = (await nextMail(email, seen)).match(/\b(\d{6})\b/)![1];
  await page.locator('input[name="code"]').fill(code === '000000' ? '111111' : '000000');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.rt-field-error')).toBeVisible();
  await page.getByRole('button', { name: 'Send a new code' }).click();
  await expect(page.getByText('Wait a minute before asking for a new code.')).toBeVisible();
  await page.locator('input[name="code"]').fill(code);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Then the first password is changed (01.2), and this device is remembered.
  await expect(page).toHaveURL(/\/first-sign-in$/);
  await page.locator('input[name="password"]').fill('own-pass-123');
  await page.locator('input[name="repeat"]').fill('own-pass-123');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/sign-in$/); // signed out before the next sign-in
  seen = mailCount(email);
  await signIn(page, phone, 'own-pass-123');
  await expect(page).toHaveURL(/\/$/);
  expect(mailCount(email)).toBe(seen);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/sign-in$/); // signed out before the next sign-in

  // 01.5 and 01.6: forgot password; the link sets a new one.
  await page.getByRole('link', { name: /Forgot your password/ }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.locator('input[name="phone"]').fill(phone);
  await page.getByRole('button', { name: 'Send the link' }).click();
  await expect(page.getByText(/If this number has an email, a link was sent/)).toBeVisible();
  const link = (await nextMail(email, seen)).match(/https?:\/\/\S+reset-password\/\S+/)![0];
  await page.goto(link);
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await page.locator('input[name="password"]').fill('brand-new-pass-1');
  await page.locator('input[name="repeat"]').fill('brand-new-pass-1');
  await page.getByRole('button', { name: 'Save and sign in' }).click();
  await expect(page).toHaveURL(/\/sign-in\?reset=done$/);
  // A reset forgets remembered devices: the code is asked again (one a minute, so wait for a new one).
  seen = mailCount(email);
  await signIn(page, phone, 'brand-new-pass-1');
  await expect(page).toHaveURL(/\/sign-in\/code/);
  await expect(async () => {
    if (mailCount(email) === seen) {
      await page.getByRole('button', { name: 'Send a new code' }).click();
      await expect(page.getByText('A new code was sent.')).toBeVisible({ timeout: 2000 });
    }
  }).toPass({ timeout: 75_000, intervals: [5_000] });
  await page.locator('input[name="code"]').fill((await nextMail(email, seen)).match(/\b(\d{6})\b/)![1]);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/);

  // 15.6 and 01.7: the owner changes the admin's email; the admin is asked to confirm it (or later).
  const owner = await browser.newPage();
  await signIn(owner, process.env.E2E_OWNER_PHONE!, E2E_OWNER_PASSWORD);
  await expect(owner).toHaveURL(/\/$/);
  await owner.goto('/settings/people');
  // Earlier runs left turned-off sample admins with the same name: open the active one.
  await owner.getByRole('link', { name: new RegExp(`Sample admin ${info.project.name}.*Active`) }).first().click();
  const newEmail = `sample-new-${info.project.name}-${Date.now()}@example.net`;
  await owner.locator('input[name="email"]').fill(newEmail);
  await owner.getByRole('button', { name: 'Save email' }).click();
  await expect(owner.getByText(/It counts once the code sent to it is typed in/)).toBeVisible();
  await owner.close();

  await page.goto('/');
  await expect(page).toHaveURL(/\/confirm-email$/);
  await expect(page.getByText(newEmail)).toBeVisible();
  await page.getByRole('button', { name: 'Later' }).click();
  await expect(page).toHaveURL(/\/$/);
});
