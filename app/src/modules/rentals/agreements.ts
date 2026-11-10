import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { agreementPrint, agreementSigned, agreementWording, auditEvent, customer, permissionGrant, rental, rentalTermsSnapshot, rentalVehicleSegment, user, vehicle } from '../../db/schema';
import { allows } from '../../auth/permissions';
import { readSettings } from '../settings/settings';
import { estimate } from '../../lib/rental-days';
import { getFile, putFile } from '../../storage/files';
import { copyType, MAX_COPY_BYTES } from '../../storage/kinds';

// The rental agreement (ST-05.6, ST-16.1; system design 14, Confirmed 8 Nov 2026; #55).
// - The conditions are SNS's wording in versions (Settings › Agreement wording): only the owner adds and approves one;
//   an approved version never changes. The newest approved version is printed; none approved means no printing.
// - A printout keeps what it printed (business details, the rental, its terms, the wording in the chosen language), and
//   the rental's number (R-0001 …).
// - The signed copy (photo or PDF up to 10 MB, kept as taken) is uploaded to the rental; a change of the rental's terms
//   afterwards makes it out of date until a newly signed copy is uploaded (AT-06 reads this at handover, #57).

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const WORDING_MAX = 20_000;
export type Lang = 'si' | 'en';
export const rentalNumber = (n: number) => `R-${String(n).padStart(4, '0')}`;

async function isOwner(q: Tx | typeof db, actorId: string) {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  return a?.role === 'owner' && !a.disabledAt;
}
async function hasCustomerAccess(q: Tx | typeof db, actorId: string) {
  const [a] = await q.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!a) return false;
  const granted = new Set((await q.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return allows(a, granted, 'customerAccess');
}
const tidyText = (raw: unknown) => String(raw ?? '').replace(/\r\n/g, '\n').trim();

// --- Wording (Settings › Agreement wording, owner only) ---

export interface Wording { id: string; version: number; textSi: string; textEn: string; createdAt: Date; approvedAt: Date | null }

/** Every version, newest first. */
export async function listWordings(): Promise<Wording[]> {
  return db.select({ id: agreementWording.id, version: agreementWording.version, textSi: agreementWording.textSi, textEn: agreementWording.textEn,
    createdAt: agreementWording.createdAt, approvedAt: agreementWording.approvedAt }).from(agreementWording).orderBy(desc(agreementWording.version));
}

/** The newest approved version: the one printed now. */
export async function currentWording(q: Tx | typeof db = db): Promise<Wording | null> {
  const [w] = await q.select({ id: agreementWording.id, version: agreementWording.version, textSi: agreementWording.textSi, textEn: agreementWording.textEn,
    createdAt: agreementWording.createdAt, approvedAt: agreementWording.approvedAt }).from(agreementWording)
    .where(isNotNull(agreementWording.approvedAt)).orderBy(desc(agreementWording.version)).limit(1);
  return w ?? null;
}

export type WordingError = 'notAllowed' | 'notFound' | 'textMissing' | 'tooLong' | 'alreadyApproved' | 'olderThanCurrent';

/** The owner adds a new version (Sinhala and English together); it is not used until approved. Logged. */
export async function addWording(actorId: string, input: { textSi: string; textEn: string }): Promise<{ ok: true; id: string; version: number } | { error: WordingError }> {
  const textSi = tidyText(input.textSi);
  const textEn = tidyText(input.textEn);
  if (!textSi || !textEn) return { error: 'textMissing' };
  if (textSi.length > WORDING_MAX || textEn.length > WORDING_MAX) return { error: 'tooLong' };
  return db.transaction(async (tx) => {
    if (!(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('sns.agreement-wording'))`);
    const [{ max }] = await tx.select({ max: sql<number>`coalesce(max(${agreementWording.version}), 0)::int` }).from(agreementWording);
    const version = max + 1;
    const [w] = await tx.insert(agreementWording).values({ version, textSi, textEn, createdBy: actorId }).returning({ id: agreementWording.id });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'document.wordingAdd', targetType: 'agreementWording', targetId: w.id, details: { version } });
    return { ok: true, id: w.id, version } as const;
  });
}

/** The owner approves a version: from now on it is printed, and it can never change. Logged. */
export async function approveWording(actorId: string, id: string): Promise<{ ok: true } | { error: WordingError }> {
  if (!UUID.test(id)) return { error: 'notFound' };
  return db.transaction(async (tx) => {
    if (!(await isOwner(tx, actorId))) return { error: 'notAllowed' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('sns.agreement-wording'))`);
    // A draft older than the version printed now would never be printed: refused (#55 review).
    const [me] = await tx.select({ version: agreementWording.version }).from(agreementWording).where(eq(agreementWording.id, id));
    const now = await currentWording(tx);
    if (me && now && me.version < now.version) return { error: 'olderThanCurrent' } as const;
    const done = await tx.update(agreementWording).set({ approvedAt: sql`now()`, approvedBy: actorId })
      .where(and(eq(agreementWording.id, id), sql`${agreementWording.approvedAt} is null`)).returning({ version: agreementWording.version });
    if (!done.length) {
      const [w] = await tx.select({ id: agreementWording.id }).from(agreementWording).where(eq(agreementWording.id, id));
      return { error: w ? 'alreadyApproved' : 'notFound' } as const;
    }
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'document.wordingApprove', targetType: 'agreementWording', targetId: id, details: { version: done[0].version } });
    return { ok: true } as const;
  });
}

// --- Printing ---

export interface AgreementContent {
  number: string; language: Lang; wordingVersion: number; conditions: string;
  business: { name: string; registration: string | null; address: string; phones: string };
  customer: { name: string; nic: string; phone: string; licenceNumber: string };
  car: { registration: string; model: string };
  pickupAt: string; deadlineAt: string; days: number;
  dailyRate: number; base: number; longRental: number; includedKm: number; extraKmRate: number;
  deposit: number | null; depositWaived: boolean; rentPaid: string; fuel: string;
  printedAt: string; printedByName: string;
}

export type PrintError = 'notAllowed' | 'notFound' | 'notDraft' | 'termsNotSet' | 'noWording' | 'noBusinessDetails' | 'languageInvalid';

/** Prints the agreement for a saved rental whose step 4 is set, in Sinhala or English, with the current approved
 *  wording and business details, kept as printed. Needs Customer access. Logged as rental.agreementPrint. */
export async function printAgreement(actorId: string, rentalId: string, language: string): Promise<{ ok: true; id: string } | { error: PrintError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  if (language !== 'si' && language !== 'en') return { error: 'languageInvalid' };
  return db.transaction(async (tx) => {
    if (!(await hasCustomerAccess(tx, actorId))) return { error: 'notAllowed' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
    const [r] = await tx.select({ r: rental, c: customer, s: rentalTermsSnapshot }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId))
      .innerJoin(rentalTermsSnapshot, eq(rentalTermsSnapshot.rentalId, rental.id)).where(eq(rental.id, rentalId));
    if (!r) return { error: 'notFound' } as const;
    if (r.r.status !== 'draft') return { error: 'notDraft' } as const;
    if (!r.r.termsSetAt) return { error: 'termsNotSet' } as const;
    const wording = await currentWording(tx);
    if (!wording) return { error: 'noWording' } as const;
    const st = await readSettings(tx);
    if (!st.businessName || !st.businessRegistration || !st.businessAddress || !st.businessPhones) return { error: 'noBusinessDetails' } as const;
    const [seg] = await tx.select({ s: rentalVehicleSegment, plate: vehicle.registration, model: vehicle.model }).from(rentalVehicleSegment)
      .innerJoin(vehicle, eq(vehicle.id, rentalVehicleSegment.vehicleId)).where(eq(rentalVehicleSegment.rentalId, rentalId)).orderBy(rentalVehicleSegment.position).limit(1);
    const [me] = await tx.select({ name: user.name }).from(user).where(eq(user.id, actorId));
    const est = estimate({ dailyRate: seg.s.dailyRate, kmPerDay: seg.s.kmPerDay, extraKmRate: seg.s.extraKmRate, longRentalExtra: seg.s.longRentalExtra,
      longRentalFromDay: seg.s.longRentalFromDay }, r.r.days);
    const content: AgreementContent = {
      number: rentalNumber(r.r.number), language, wordingVersion: wording.version, conditions: language === 'si' ? wording.textSi : wording.textEn,
      business: { name: st.businessName, registration: st.businessRegistration, address: st.businessAddress, phones: st.businessPhones },
      customer: { name: r.c.name, nic: r.c.nic, phone: r.c.phone, licenceNumber: r.c.licenceNumber },
      car: { registration: seg.plate, model: seg.model },
      pickupAt: r.r.pickupAt.toISOString(), deadlineAt: r.r.deadlineAt.toISOString(), days: r.r.days,
      dailyRate: seg.s.dailyRate, base: est.base, longRental: est.longRental, includedKm: est.includedKm, extraKmRate: seg.s.extraKmRate,
      deposit: r.r.depositAmount, depositWaived: r.r.depositWaivedReason !== null, rentPaid: r.r.rentPaid!, fuel: r.r.fuel!,
      printedAt: new Date().toISOString(), printedByName: me?.name ?? '',
    };
    const [p] = await tx.insert(agreementPrint).values({ rentalId, wordingId: wording.id, language, content, createdBy: actorId }).returning({ id: agreementPrint.id });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.agreementPrint', targetType: 'rental', targetId: rentalId,
      details: { name: r.c.name, number: content.number, language, version: wording.version } });
    return { ok: true, id: p.id } as const;
  });
}

/** A printout as it was printed, for its rental (Customer access is checked by the caller). */
export async function getPrint(rentalId: string, printId: string): Promise<AgreementContent | null> {
  if (!UUID.test(rentalId) || !UUID.test(printId)) return null;
  const [p] = await db.select({ content: agreementPrint.content }).from(agreementPrint).where(and(eq(agreementPrint.id, printId), eq(agreementPrint.rentalId, rentalId)));
  return p ? (p.content as AgreementContent) : null;
}

// --- The signed copy ---

export type SignedError = 'notAllowed' | 'notFound' | 'notDraft' | 'notPrinted' | 'reprintFirst' | 'fileType' | 'fileTooBig';

/** The newest printout of a rental, and whether it is newer than the last change of what is printed. */
async function newestPrint(q: Tx | typeof db, rentalId: string) {
  const [r] = await q.select({ status: rental.status, termsSetAt: rental.termsSetAt }).from(rental).where(eq(rental.id, rentalId));
  if (!r) return null;
  const [p] = await q.select({ id: agreementPrint.id, at: agreementPrint.createdAt }).from(agreementPrint).where(eq(agreementPrint.rentalId, rentalId))
    .orderBy(desc(agreementPrint.createdAt), desc(agreementPrint.id)).limit(1);
  return { status: r.status, termsSetAt: r.termsSetAt, print: p ?? null, printCurrent: !!p && (!r.termsSetAt || p.at >= r.termsSetAt) };
}

/** Uploads a photo or scan of the signed agreement. It signs the newest printout, which must be newer than the last
 *  change of what is printed (9 Nov 2026); otherwise "print again first". The newest copy counts. Logged. */
export async function uploadSigned(actorId: string, rentalId: string, bytes: Uint8Array): Promise<{ ok: true } | { error: SignedError }> {
  if (!UUID.test(rentalId)) return { error: 'notFound' };
  if (bytes.length > MAX_COPY_BYTES) return { error: 'fileTooBig' };
  const contentType = copyType(bytes);
  if (!contentType) return { error: 'fileType' };
  if (!(await hasCustomerAccess(db, actorId))) return { error: 'notAllowed' };
  // Checked before the file is stored, so a refused upload leaves no file (#55 review); checked again under the lock.
  const pre = await newestPrint(db, rentalId);
  if (!pre) return { error: 'notFound' };
  if (pre.status !== 'draft') return { error: 'notDraft' };
  if (!pre.print) return { error: 'notPrinted' };
  if (!pre.printCurrent) return { error: 'reprintFirst' };
  const storageKey = `agreements/${rentalId}/${randomUUID()}`;
  await putFile(storageKey, bytes, contentType);
  return db.transaction(async (tx) => {
    if (!(await hasCustomerAccess(tx, actorId))) return { error: 'notAllowed' } as const;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`sns.rental:${rentalId.toLowerCase()}`}))`);
    const now = await newestPrint(tx, rentalId);
    if (!now) return { error: 'notFound' } as const;
    if (now.status !== 'draft') return { error: 'notDraft' } as const;
    if (!now.print) return { error: 'notPrinted' } as const;
    if (!now.printCurrent) return { error: 'reprintFirst' } as const;
    const [r] = await tx.select({ number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
    await tx.insert(agreementSigned).values({ rentalId, printId: now.print.id, storageKey, contentType, size: bytes.length, createdBy: actorId });
    await tx.insert(auditEvent).values({ createdBy: actorId, action: 'rental.agreementSigned', targetType: 'rental', targetId: rentalId,
      details: { name: r.name, number: rentalNumber(r.number) } });
    return { ok: true } as const;
  });
}

export interface AgreementState {
  printed: boolean; lastPrintId: string | null; printCurrent: boolean; signedId: string | null; signedAt: Date | null; outOfDate: boolean;
}

/** Where the agreement stands: the newest printout (and whether it is still current), the newest signed copy, and
 *  whether that copy is out of date (it does not sign the newest printout, or that printout is older than the last
 *  change of what is printed; 9 Nov 2026). */
export async function agreementState(rentalId: string, q: Tx | typeof db = db): Promise<AgreementState | null> {
  if (!UUID.test(rentalId)) return null;
  const n = await newestPrint(q, rentalId);
  if (!n) return null;
  const [s] = await q.select({ id: agreementSigned.id, at: agreementSigned.createdAt, printId: agreementSigned.printId }).from(agreementSigned)
    .where(eq(agreementSigned.rentalId, rentalId)).orderBy(desc(agreementSigned.createdAt), desc(agreementSigned.id)).limit(1);
  return { printed: !!n.print, lastPrintId: n.print?.id ?? null, printCurrent: n.printCurrent, signedId: s?.id ?? null, signedAt: s?.at ?? null,
    outOfDate: !!s && (s.printId !== n.print?.id || !n.printCurrent) };
}

/** Opens the signed copy for someone with Customer access; the opening is in the activity log. No public link. */
export async function openSigned(actorId: string, rentalId: string, signedId: string): Promise<{ ok: true; bytes: Uint8Array; contentType: string } | { error: 'notAllowed' | 'notFound' }> {
  if (!UUID.test(rentalId) || !UUID.test(signedId)) return { error: 'notFound' };
  if (!(await hasCustomerAccess(db, actorId))) return { error: 'notAllowed' };
  const [d] = await db.select().from(agreementSigned).where(and(eq(agreementSigned.id, signedId), eq(agreementSigned.rentalId, rentalId)));
  if (!d) return { error: 'notFound' };
  const bytes = await getFile(d.storageKey);
  if (!bytes) return { error: 'notFound' };
  const [r] = await db.select({ number: rental.number, name: customer.name }).from(rental).innerJoin(customer, eq(customer.id, rental.customerId)).where(eq(rental.id, rentalId));
  await db.insert(auditEvent).values({ createdBy: actorId, action: 'rental.agreementOpened', targetType: 'rental', targetId: rentalId,
    details: { name: r?.name ?? '', number: r ? rentalNumber(r.number) : '' } });
  return { ok: true, bytes, contentType: d.contentType };
}
