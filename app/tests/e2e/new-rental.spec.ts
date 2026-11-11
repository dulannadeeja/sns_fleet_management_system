// Screens 05.1 Customer and warnings, 05.2 Choose a car and 05.3 Dates and estimate in the browser (ST-05.1 to ST-05.3;
// #51). The owner is the test database's one owner (global-setup.ts). Sample car and customers only.
import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { Pool } from 'pg';
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
  await page.getByRole('button', { name: 'Add a reference person' }).click();
  await expect(page).toHaveURL(/\/reference$/);
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
  // What was typed before adding the reference was saved first: the deposit and choices are still there.
  await expect(page.locator('input[name="deposit"]')).toHaveValue('10000');
  await expect(page.getByRole('radio', { name: /^At return/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Save and continue' })).toBeEnabled();
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // The rental shows the deposit and the reference copies still missing (AT-07: handover will wait for them).
  await expect(page).toHaveURL(/\/review\?terms=1$/);

  // The rental shows the deposit and the reference copies still missing (AT-07: handover will wait for them).
  await page.goto(rentalUrl);
  await expect(page.locator('[data-deposit]')).toHaveText('LKR 10,000');
  await expect(page.locator('[data-ref-missing]')).toHaveAttribute('data-ref-missing', 'nicBack licence');
  await expect(page.locator('[data-estimate]')).toHaveAttribute('data-estimate', '9000');
  await expect(page.locator('[data-agreement]')).toHaveAttribute('data-agreement', 'none');

  // Printing needs the business details and an approved wording (Settings, owner only): sample ones when none.
  await page.goto('/settings/business-rules');
  if (await page.locator('[data-group="business"]', { hasText: 'Not set' }).count()) {
    await page.goto('/settings/business-rules/business');
    // Fill only the empty boxes: the registration number is needed too (Confirmed 9 Nov 2026).
    for (const [name, value] of [
      ['businessName', 'Sample Rent a Car'],
      ['businessRegistration', 'Sample PV 00000'],
      ['businessAddress', 'Sample road, Elpitiya'],
      ['businessPhones', '0770000000'],
    ]) {
      const box = page.locator(`input[name="${name}"]`);
      if (!(await box.inputValue())) await box.fill(value);
    }
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/settings\/business-rules(\?.*)?$/);
  }
  await page.goto('/settings/agreement');
  if (await page.getByText('No version approved yet').count()) {
    await page.locator('textarea[name="textSi"]').fill('Sample කොන්දේසි');
    await page.locator('textarea[name="textEn"]').fill('Sample conditions');
    await page.getByRole('button', { name: 'Save as a draft' }).click();
    await expect(page).toHaveURL(/\?saved=1$/);
    await page.getByRole('button', { name: /^Approve version/ }).first().click();
    await expect(page).toHaveURL(/\?approved=1$/);
  }

  // 05.5: review, choose English, print; the printout carries the rental's number and the conditions.
  await page.goto(`${rentalUrl}/review`);
  await expect(page.getByRole('button', { name: 'Save and print agreement' })).toBeEnabled();
  await page.getByRole('radio', { name: 'English' }).check();
  expect(await noSideScroll(page)).toBe(false);
  await page.getByRole('button', { name: 'Save and print agreement' }).click();
  await expect(page).toHaveURL(/\/agreement\/[0-9a-f-]+$/);
  await expect(page.locator('[data-agreement]')).toHaveAttribute('data-agreement', /^R-\d{4,}$/);
  await expect(page.getByText('Rental agreement')).toBeVisible();
  await expect(page.locator('[data-conditions]')).not.toBeEmpty();

  // The signed copy is uploaded on the rental (AT-06: handover will wait for it).
  await page.goto(rentalUrl);
  await expect(page.locator('[data-agreement]')).toHaveAttribute('data-agreement', 'printed');
  await page.locator('[data-signed-form] input[type="file"]').setInputFiles({ name: 'signed.jpg', mimeType: 'image/jpeg', buffer: jpeg });
  await page.locator('[data-signed-form] button').click();
  await expect(page).toHaveURL(/\?signed=1$/);
  await expect(page.locator('[data-agreement]')).toHaveAttribute('data-agreement', 'signed');

  // ST-09.1 (#53): a payment in two parts, cash and bank, on the bill; then part of the deposit in cash.
  await page.getByRole('link', { name: 'Record a payment' }).click();
  await expect(page).toHaveURL(/\/pay$/);
  await page.locator('[data-pay-rental] input').first().fill('9000');
  await page.getByRole('button', { name: 'Add another part (cash and bank)' }).click();
  await page.locator('[data-part="1"] input[inputmode="numeric"]').fill('4000');
  await page.locator('[data-part="2"] input[inputmode="numeric"]').fill('5000');
  const save2 = page.getByRole('button', { name: 'Save 2 payments' });
  await expect(save2).toBeDisabled();
  await page.locator('[data-part="2"] input[name="ref-1"]').fill(`Sample-${tag}`);
  await expect(save2).toBeEnabled();
  await save2.click();
  await expect(page).toHaveURL(/\?paid=P-\d{4,},P-\d{4,}$/);
  await expect(page.locator('[data-paid]')).toHaveAttribute('data-paid', '9000');
  await expect(page.getByText('Bank check: waiting')).toBeVisible();
  await page.getByRole('link', { name: 'Record a payment' }).click();
  await page.getByRole('radio', { name: 'Deposit (held money, not income)' }).check();
  await page.locator('input[name="depositAmount"]').fill('1000');
  await page.getByRole('button', { name: 'Save payment' }).click();
  await expect(page).toHaveURL(/\?paid=P-\d{4,}$/);
  await expect(page.locator('[data-deposit-received]')).toHaveAttribute('data-deposit-received', '1000');

  // ST-06.4 (#57): the handover waits for the customer's copies; then it goes out with one accessory missing, a quarter
  // tank, and (the sample car has no papers dates) the owner's reason.
  await page.getByRole('link', { name: 'Hand over the car' }).click();
  await expect(page).toHaveURL(/\/handover$/);
  await expect(page.locator('[data-item="customerCopies"]')).toHaveAttribute('data-done', '0');
  await expect(page.getByRole('button', { name: 'Hand over car' })).toBeDisabled();
  await page.goto(`/customers/${customerId}`);
  for (const kind of ['nicFront', 'nicBack', 'licenceFront', 'licenceBack']) {
    await page.locator(`[data-copy="${kind}"] input[type="file"]`).setInputFiles({ name: `${kind}.jpg`, mimeType: 'image/jpeg', buffer: jpeg });
    await page.locator(`[data-copy="${kind}"] button`).click();
    await expect(page.locator(`[data-copy="${kind}"]`)).toContainText('on file');
  }
  await page.goto('/settings/business-rules');
  if (await page.locator('[data-group="handover"]', { hasText: 'Not set' }).count()) {
    await page.goto('/settings/business-rules/handover');
    await page.locator('textarea[name="accessories"]').fill('Sample spare wheel\nSample jack\nSample air pump');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/\/settings\/business-rules(\?.*)?$/);
  }
  // The reference person's missing copies (NIC back, licence), added on the rental page.
  await page.goto(rentalUrl);
  await expect(page.locator('[data-ref-missing]')).toHaveAttribute('data-ref-missing', 'nicBack licence');
  for (const left of ['licence', '']) {
    await page.locator('[data-ref-missing] input[type="file"]').first().setInputFiles({ name: 'ref.jpg', mimeType: 'image/jpeg', buffer: jpeg });
    await page.locator('[data-ref-missing] button').first().click();
    if (left) await expect(page.locator('[data-ref-missing]')).toHaveAttribute('data-ref-missing', left);
    else await expect(page.locator('[data-ref-missing]')).toHaveCount(0);
  }
  await page.goto(rentalUrl + '/handover');
  await expect(page.locator('[data-checklist]')).toHaveAttribute('data-checklist', 'ready');
  await page.locator('[data-photo-form] input[type="file"]').setInputFiles({ name: 'car.jpg', mimeType: 'image/jpeg', buffer: jpeg });
  await page.locator('[data-photo-form] button').click();
  await expect(page).toHaveURL(/\/handover\?photo=1$/);
  await page.locator('input[name="outKm"]').fill('31206');
  await page.getByRole('radio', { name: '1/4', exact: true }).check();
  // Every item starts unticked: tick all but the first, then confirm the car was checked.
  const boxes = page.locator('[data-accessories] .set-choices input[type="checkbox"]');
  for (let i = 1; i < await boxes.count(); i++) await boxes.nth(i).check();
  await page.locator('[data-checked-box] input').check();
  await expect(page.locator('[data-accessories]')).toContainText('Missing, written on the record');
  const handOverButton = page.getByRole('button', { name: 'Hand over car' });
  await expect(handOverButton).toBeDisabled();
  await page.locator('input[name="papersReason"]').fill('Sample: papers being renewed');
  await expect(handOverButton).toBeEnabled();
  await handOverButton.click();
  await expect(page).toHaveURL(/\?handedOver=1$/);
  await expect(page.locator('dd[data-status]')).toHaveAttribute('data-status', 'active');
  await expect(page.locator('[data-handed-over]')).toContainText('31,206');

  // ST-06.1 to ST-06.3, AT-28 (#58): a sample overdue rental (its deadline moved an hour back, test-only, as the
  // database owner). The menu's Overdue count opens the list filtered; the filter shows and can be removed.
  const rentalId = rentalUrl.split('/').pop()!;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/sns_test' });
  await pool.query("update rental set pickup_at = now() - interval '2 days', deadline_at = now() - interval '1 hour' where id = $1", [rentalId]);
  await pool.end();
  await page.goto(rentalUrl);
  await expect(page.locator('[data-overdue-banner]')).toContainText('+1h');
  await expect(page.locator('[data-history]')).toContainText('Handed over');
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await page.locator('.rt-side-badge-overdue').click();
  } else {
    await page.goto('/rentals?filter=overdue');
  }
  // The test database keeps every sample rental from earlier runs, so the full list is slow there: more time.
  await expect(page).toHaveURL(/\/rentals\?filter=overdue$/, { timeout: 30_000 });
  await expect(page.locator('[data-filter="overdue"]')).toBeVisible();
  await expect(page.locator('[data-rental] [data-overdue="0"], li[data-overdue="0"]')).toHaveCount(0);
  await expect(page.locator(`li[data-overdue="1"] a[href="/rentals/${rentalId}"]`)).toBeVisible();
  await page.getByRole('link', { name: 'Remove filter · show all' }).click();
  await expect(page).toHaveURL(/\/rentals$/, { timeout: 30_000 });
  await expect(page.locator('[data-filter]')).toHaveCount(0);
  expect(await noSideScroll(page)).toBe(false);

  // ST-05.7, ST-10.1, ST-10.2 (#56): ask for a discount on this rental; it waits; the owner approves it on Approvals
  // (the primary owner's own request: self-approved) after the confirm step; the estimate shows the discount.
  await page.goto(rentalUrl);
  const before = Number(await page.locator('[data-estimate]').getAttribute('data-estimate'));
  await page.locator('[data-price-form]').getByRole('radio', { name: 'A discount off the bill' }).check();
  await page.locator('input[name="amountBox"]').fill('500');
  await expect(page.locator('[data-effect]')).toHaveAttribute('data-effect', '-500');
  await page.locator('input[name="reasonBox"]').fill(`Sample: regular customer ${tag}`);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page).toHaveURL(/\?asked=1$/, { timeout: 30_000 });
  await expect(page.locator('[data-waiting]')).toBeVisible();
  await page.goto('/approvals');
  const card = page.locator('[data-approval]', { hasText: `Sample: regular customer ${tag}` });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.getByRole('link', { name: 'Approve' }).click();
  await expect(page.locator('[data-confirm="approve"]')).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page).toHaveURL(/\/approvals\?done=approved$/, { timeout: 30_000 });
  await page.goto('/approvals?status=approved');
  await expect(page.locator('[data-approval]', { hasText: `Sample: regular customer ${tag}` })).toContainText('self-approved');
  await page.goto(rentalUrl);
  await expect(page.locator('[data-estimate]')).toHaveAttribute('data-estimate', String(before - 500));
  await expect(page.locator('[data-history]')).toContainText('Price request decided: approved');

  // ST-07.1 (#63): receive the car. It is late (the sample deadline was moved back), so the late charge is waived with a
  // reason; the item missing at handover is never charged; the bill shows and the car is free again.
  await page.getByRole('link', { name: 'Receive the car' }).click();
  await expect(page).toHaveURL(/\/return$/, { timeout: 30_000 });
  await page.locator('input[name="inKm"]').fill('31300');
  await expect(page.locator('[data-driven]')).toHaveAttribute('data-driven', '94');
  await page.getByRole('radio', { name: 'Full', exact: true }).check();
  const backBoxes = page.locator('[data-accessories] .set-choices input[type="checkbox"]');
  for (let i = 1; i < await backBoxes.count(); i++) await backBoxes.nth(i).check();
  await expect(page.locator('[data-accessories]')).toContainText('already missing at handover');
  await page.locator('[data-checked-box] input').check();
  await page.locator('[data-late]').getByText('Waive the late charge').click();
  await page.locator('input[name="lateReason"]').fill('Sample: regular customer');
  await page.getByRole('radio', { name: 'Available', exact: true }).check();
  await page.getByRole('button', { name: 'Save the return' }).click();
  await expect(page).toHaveURL(/\?returned=1$/, { timeout: 30_000 });
  await expect(page.locator('dd[data-status]')).toHaveAttribute('data-status', 'returned');
  await expect(page.locator('[data-bill]')).toHaveAttribute('data-bill', '8500');
  await expect(page.locator('[data-line="late"]')).toContainText('Sample: regular customer');

  // ST-07.3 (#64): settle the deposit. The bill was already paid (9,000 for 8,500), so the 1,000 held goes back in cash.
  await page.getByRole('link', { name: 'Use the deposit and refund' }).click();
  await expect(page).toHaveURL(/\/deposit$/, { timeout: 30_000 });
  await expect(page.locator('[data-plan-refund]')).toHaveAttribute('data-plan-refund', '1000');
  const settle = page.getByRole('button', { name: 'Record and refund LKR 1,000' });
  await expect(settle).toBeDisabled();
  await page.getByRole('radio', { name: 'Cash' }).check();
  await expect(settle).toBeEnabled();
  expect(await noSideScroll(page)).toBe(false);
  await settle.click();
  await expect(page).toHaveURL(/\?deposit=1$/, { timeout: 30_000 });
  await expect(page.locator('[data-deposit-settled]')).toHaveAttribute('data-deposit-settled', '1000');
  await expect(page.locator('[data-history]')).toContainText('Deposit settled');

  // Back and Available: the car is offered again on 05.2 (it was held while out).
  await page.goto(`/rentals/new/car?customer=${customerId}`);
  await expect(page.locator(`[data-car="${plate}"]`)).toHaveCount(1);

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
