import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../src/db/client';
import { auditEvent, user } from '../src/db/schema';
import { addCar, getCar } from '../src/modules/cars/cars';
import { addPartner, getPartner, listPartners, normalNic, recordAgreementSigned, unlinkedPartnerCars } from '../src/modules/partners/partners';
import { samplePerson, samplePhone, signIn, theOwner } from './helpers/people';
import { samplePlate } from './helpers/cars';

// ST-11.1 to ST-11.3 (system design 3.2 "Partner accounts", 14; Proposed: Dulan, 1 Nov 2026). Each test adds its own
// sample partners (random NIC and phone) and sample partner cars.
const sampleNic = () => `${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}`;
async function partnerCar(model = 'Wagon R') {
  const added = await addCar(await theOwner(), { registration: samplePlate(), model, ownership: 'partner' });
  if (!('ok' in added)) throw new Error(added.error);
  return added.id;
}
const base = () => ({ name: `Sample partner ${randomUUID().slice(0, 6)}`, phone: samplePhone(), password: 'first-pass-1', nic: sampleNic() });

describe('ST-11.2: add a partner', () => {
  it('creates the account, links the chosen cars with their terms, and logs it', async () => {
    const owner = await theOwner();
    const [a, b] = [await partnerCar(), await partnerCar('Alto')];
    const p = base();
    const added = await addPartner(owner, { ...p, bankAccount: 'Sample Bank · Elpitiya · 000111', cars: [
      { carId: a, commissionPercent: 15, ownerPays: ['service'] },
      { carId: b, commissionPercent: 12, ownerPays: ['tyres', 'battery'] },
    ] });
    if (!('ok' in added)) throw new Error(added.error);
    // The partner signs in with the first password and must change it (system design 3.1).
    expect((await signIn(p.phone, p.password)).status).toBe(200);
    const [account] = await db.select().from(user).where(eq(user.id, added.userId));
    expect(account).toMatchObject({ role: 'partner', mustChangePassword: true, name: p.name });
    const carA = (await getCar(a))!;
    expect(carA).toMatchObject({ partnerId: added.id, partnerName: p.name });
    expect(carA.terms).toMatchObject({ commissionPercent: 15, ownerPays: ['service'] });
    expect((await getCar(b))!.terms).toMatchObject({ commissionPercent: 12, ownerPays: ['tyres', 'battery'] });
    const unlinked = (await unlinkedPartnerCars()).map((c) => c.id);
    expect(unlinked).not.toContain(a);
    const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'partner.add'), eq(auditEvent.targetId, added.userId)));
    expect(log.details).toMatchObject({ name: p.name, cars: expect.arrayContaining([carA.registration]) });
    expect(JSON.stringify(log.details)).not.toContain(p.password);
    const shown = await getPartner(added.id);
    expect(shown).toMatchObject({ name: p.name, phone: p.phone, nic: p.nic, bankAccount: 'Sample Bank · Elpitiya · 000111', agreementSignedOn: null, active: true });
    expect(shown!.cars.map((c) => c.id).sort()).toEqual([a, b].sort());
    const row = (await listPartners()).find((x) => x.id === added.id);
    expect(row).toMatchObject({ name: p.name, cars: 2, commission: [12, 15] });
  });

  it('refuses a car that is SNS\'s, already linked, or chosen twice; nothing is saved on a refusal', async () => {
    const owner = await theOwner();
    const linked = await partnerCar();
    const first = await addPartner(owner, { ...base(), cars: [{ carId: linked, commissionPercent: 15, ownerPays: [] }] });
    if (!('ok' in first)) throw new Error(first.error);
    const sns = await addCar(owner, { registration: samplePlate(), model: 'Alto', ownership: 'sns' });
    if (!('ok' in sns)) throw new Error(sns.error);
    const free = await partnerCar();
    const p = base();
    expect(await addPartner(owner, { ...p, cars: [{ carId: free, commissionPercent: 15, ownerPays: [] }, { carId: linked, commissionPercent: 15, ownerPays: [] }] })).toEqual({ error: 'carNotFree' });
    expect(await addPartner(owner, { ...p, cars: [{ carId: sns.id, commissionPercent: 15, ownerPays: [] }] })).toEqual({ error: 'carNotFree' });
    expect(await addPartner(owner, { ...p, cars: [{ carId: free, commissionPercent: 15, ownerPays: [] }, { carId: free, commissionPercent: 15, ownerPays: [] }] })).toEqual({ error: 'carsInvalid' });
    expect(await addPartner(owner, { ...p, cars: [] })).toEqual({ error: 'carsMissing' });
    expect((await getCar(free))!.partnerId).toBeNull();
    expect((await signIn(p.phone, p.password)).status).not.toBe(200); // no account was made
  });

  it('checks the NIC, phone, password, commission and costs', async () => {
    const owner = await theOwner();
    const car = await partnerCar();
    const ok = { carId: car, commissionPercent: 15, ownerPays: [] as string[] };
    expect(normalNic(' 851234567v ')).toBe('851234567V');
    expect(await addPartner(owner, { ...base(), nic: '12345', cars: [ok] })).toEqual({ error: 'nicInvalid' });
    expect(await addPartner(owner, { ...base(), phone: '0112345678', cars: [ok] })).toEqual({ error: 'phoneInvalid' });
    expect(await addPartner(owner, { ...base(), password: 'short', cars: [ok] })).toEqual({ error: 'passwordShort' });
    expect(await addPartner(owner, { ...base(), name: ' ', cars: [ok] })).toEqual({ error: 'nameMissing' });
    expect(await addPartner(owner, { ...base(), cars: [{ ...ok, commissionPercent: 101 }] })).toEqual({ error: 'carsInvalid' });
    expect(await addPartner(owner, { ...base(), cars: [{ ...ok, ownerPays: ['fuel'] }] })).toEqual({ error: 'carsInvalid' });
    // One partner per NIC, one account per phone.
    const p = base();
    const first = await addPartner(owner, { ...p, cars: [ok] });
    if (!('ok' in first)) throw new Error(first.error);
    expect(await addPartner(owner, { ...base(), nic: p.nic, cars: [{ ...ok, carId: await partnerCar() }] })).toEqual({ error: 'nicTaken' });
    expect(await addPartner(owner, { ...base(), phone: p.phone, cars: [{ ...ok, carId: await partnerCar() }] })).toEqual({ error: 'phoneTaken' });
  });

  it('only people who may add or edit partners add one (the admin by default; not staff)', async () => {
    const staff = await samplePerson();
    expect(await addPartner(staff.id, { ...base(), cars: [{ carId: await partnerCar(), commissionPercent: 15, ownerPays: [] }] })).toEqual({ error: 'notAllowed' });
    const admin = await samplePerson('first-pass-1', 'admin');
    const added = await addPartner(admin.id, { ...base(), cars: [{ carId: await partnerCar(), commissionPercent: 15, ownerPays: [] }] });
    expect('ok' in added).toBe(true);
  });
});

describe('ST-11.3: the agreement date', () => {
  it('records the date the paper agreement was signed, once a date is valid; logged', async () => {
    const owner = await theOwner();
    const added = await addPartner(owner, { ...base(), cars: [{ carId: await partnerCar(), commissionPercent: 15, ownerPays: [] }] });
    if (!('ok' in added)) throw new Error(added.error);
    expect(await recordAgreementSigned(owner, added.id, '2999-01-01')).toEqual({ error: 'dateInvalid' });
    expect(await recordAgreementSigned(owner, added.id, 'yesterday')).toEqual({ error: 'dateInvalid' });
    expect(await recordAgreementSigned((await samplePerson()).id, added.id, '2026-10-30')).toEqual({ error: 'notAllowed' });
    expect(await recordAgreementSigned(owner, added.id, '2026-10-30')).toEqual({ ok: true });
    expect((await getPartner(added.id))!.agreementSignedOn).toBe('2026-10-30');
    const [log] = await db.select().from(auditEvent).where(and(eq(auditEvent.action, 'partner.agreementSigned'), eq(auditEvent.targetId, added.userId)));
    expect(log.details).toMatchObject({ signedOn: '2026-10-30' });
  });
});
