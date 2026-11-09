import { describe, it, expect } from 'vitest';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent } from '../src/db/schema';
import { ITEMS, readChecklist, tick } from '../src/modules/golive/golive';
import { samplePerson, theOwner } from './helpers/people';
import { samplePlate } from './helpers/cars';
import { addCar } from '../src/modules/cars/cars';
import { changeStatus } from '../src/modules/cars/status';

// ST-01.3 go-live checklist (system design, starting data; Confirmed 5 Nov 2026. Ticks are shared by the whole
// test database: only this file ticks, and it puts back what it found.
describe('ST-01.3: the go-live checklist', () => {
  it('counts only cars in the fleet: a retired car needs no dates and no owner; an unlinked partner car is named', async () => {
    const owner = await theOwner();
    const partnerPlate = samplePlate();
    const retiredPlate = samplePlate();
    const p = await addCar(owner, { registration: partnerPlate, model: 'Alto', ownership: 'partner' });
    const r = await addCar(owner, { registration: retiredPlate, model: 'Alto', ownership: 'partner' });
    if (!('ok' in p) || !('ok' in r)) throw new Error('sample cars not added');
    let list = await readChecklist();
    const item = (k: string) => list.items.find((i) => i.key === k)!;
    expect(item('partnerCars').facts.unlinked).toEqual(expect.arrayContaining([partnerPlate, retiredPlate]));
    expect(item('carDates').facts.noInsurance).toEqual(expect.arrayContaining([partnerPlate, retiredPlate]));
    expect(await changeStatus(owner, r.id, { status: 'retired', reason: 'Sample: sold' }, 'available')).toMatchObject({ ok: true });
    list = await readChecklist();
    expect(item('partnerCars').facts.unlinked).toContain(partnerPlate);
    expect(item('partnerCars').facts.unlinked).not.toContain(retiredPlate);
    expect(item('carDates').facts.noInsurance).not.toContain(retiredPlate);
    expect(item('partnerCars').done).toBe(false);
  });

  it('has the ten agreed items; the ones not built yet are "Not ready" and block', async () => {
    expect(ITEMS.map((i) => i.key)).toEqual(['businessDetails', 'carsEntered', 'startingPackages', 'carDates', 'partnerCars', 'staffAccounts',
      'authorisedPerson', 'openingCash', 'agreementWording', 'openDecisions']);
    const list = await readChecklist();
    for (const k of ['openingCash'] as const) {
      expect(list.items.find((i) => i.key === k)).toMatchObject({ kind: 'later', done: false });
      expect(list.blockers).toContain(k);
    }
    expect(list.total).toBe(10);
    // 8 Nov 2026 (#55): the business details and the agreement wording are checked by the system.
    expect(list.items.find((i) => i.key === 'businessDetails')).toMatchObject({ kind: 'auto' });
    expect(list.items.find((i) => i.key === 'agreementWording')).toMatchObject({ kind: 'auto' });
  });

  it('only the owner ticks an item; unticking needs a reason; a stale page is refused; each is logged', async () => {
    const owner = await theOwner();
    const was = (await readChecklist()).items.find((i) => i.key === 'openDecisions')!.done;
    try {
      const admin = await samplePerson('first-pass-1', 'admin');
      expect(await tick(admin.id, 'openDecisions', !was, 'Sample', was)).toEqual({ error: 'notAllowed' });
      expect(await tick(owner, 'carDates', true, undefined, false)).toEqual({ error: 'itemInvalid' }); // the system checks this one
      if (!was) expect(await tick(owner, 'openDecisions', true, undefined, false)).toEqual({ ok: true });
      let item = (await readChecklist()).items.find((i) => i.key === 'openDecisions')!;
      expect(item).toMatchObject({ done: true, tick: { done: true } });
      expect(await tick(owner, 'openDecisions', false, ' ', true)).toEqual({ error: 'reasonMissing' });
      expect(await tick(owner, 'openDecisions', false, 'Sample: one decision reopened', false)).toEqual({ error: 'stale' });
      expect(await tick(owner, 'openDecisions', false, 'Sample: one decision reopened', true)).toEqual({ ok: true });
      item = (await readChecklist()).items.find((i) => i.key === 'openDecisions')!;
      expect(item).toMatchObject({ done: false, tick: { done: false, reason: 'Sample: one decision reopened' } });
      const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'golive.untick'), eq(auditEvent.createdBy, owner), eq(auditEvent.targetId, 'openDecisions')))
        .orderBy(desc(auditEvent.createdAt)).limit(1);
      expect(log.details).toEqual({ item: 'openDecisions', reason: 'Sample: one decision reopened' });
    } finally {
      const now = (await readChecklist()).items.find((i) => i.key === 'openDecisions')!.done;
      if (now !== was) await tick(owner, 'openDecisions', was, 'Sample: put back after the test', now);
    }
  });
});
