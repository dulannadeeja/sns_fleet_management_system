// Rental days and the estimate (system design 5.1 to 5.3, Confirmed; TRD › Integrity rules "Business days"). Pure
// functions, no database: the one place a pickup time becomes a deadline and days and km become money.

/** Sri Lanka keeps UTC+05:30 all year (no summer time), so a fixed offset reads Asia/Colombo exactly. */
const COLOMBO_MINUTES = 330;
const DAY_MS = 86_400_000;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function minutesOf(time: string): number {
  const m = HHMM.exec(time);
  if (!m) throw new Error(`a time must be HH:MM, got ${time}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

function wholeDays(days: number): void {
  if (!Number.isSafeInteger(days) || days < 1) throw new Error(`a rental is one or more whole days, got ${days}`);
}

/**
 * The return deadline for a pickup (5.1): before the cutoff, day one ends at the next morning's deadline; at or after
 * it, the morning after that. Each further day adds one day. The cutoff and deadline are the rental's own saved copy.
 */
export function deadlineFor(pickup: Date, days: number, cutoff: string, deadline: string): Date {
  wholeDays(days);
  const cut = minutesOf(cutoff);
  const end = minutesOf(deadline);
  const local = pickup.getTime() + COLOMBO_MINUTES * 60_000;
  const localDayStart = Math.floor(local / DAY_MS) * DAY_MS;
  const minuteOfDay = Math.floor((local - localDayStart) / 60_000);
  const firstEndDay = localDayStart + (minuteOfDay < cut ? 1 : 2) * DAY_MS;
  return new Date(firstEndDay + (days - 1) * DAY_MS + (end - COLOMBO_MINUTES) * 60_000);
}

/** The first return deadline (the saved time of day, Asia/Colombo) after a moment: "due back by" on the rentals list. */
export function nextDeadlineAfter(now: Date, deadline: string): Date {
  const end = minutesOf(deadline);
  const local = now.getTime() + COLOMBO_MINUTES * 60_000;
  const localDayStart = Math.floor(local / DAY_MS) * DAY_MS;
  const today = localDayStart + end * 60_000 - COLOMBO_MINUTES * 60_000;
  return new Date(today > now.getTime() ? today : today + DAY_MS);
}

/** Each rental day of a rental and when it ends (5.1): day n ends at the deadline of an n-day rental from the pickup.
 *  Each day's rent becomes final at that day's close (Phase 3, AT-14). */
export function rentalDays(pickup: Date, days: number, cutoff: string, deadline: string): { n: number; endsAt: Date }[] {
  wholeDays(days);
  return Array.from({ length: days }, (_, i) => ({ n: i + 1, endsAt: deadlineFor(pickup, i + 1, cutoff, deadline) }));
}

export interface RateTerms { dailyRate: number; kmPerDay: number; extraKmRate: number; longRentalExtra: number; longRentalFromDay: number }
export interface Estimate {
  days: number; base: number; longRentalDays: number; longRental: number;
  includedKm: number; extraKm: number | null; extraKmCharge: number; total: number;
}

/**
 * The bill for one car at constant terms (5.3): base = days × rate; km are pooled over the rental; from the surcharge's
 * starting day each day adds the long-rental extra. With `km` (driven), the extra km are charged too. Whole rupees.
 * Discounts, late charges, early returns and swaps are decisions recorded elsewhere, never assumed here.
 */
export function estimate(terms: RateTerms, days: number, km?: number): Estimate {
  wholeDays(days);
  for (const [k, v] of Object.entries(terms)) if (!Number.isSafeInteger(v) || v < 0) throw new Error(`${k} must be a whole number, got ${v}`);
  if (km !== undefined && (!Number.isSafeInteger(km) || km < 0)) throw new Error(`km must be a whole number of 0 or more, got ${km}`);
  const base = days * terms.dailyRate;
  const longRentalDays = Math.max(0, days - terms.longRentalFromDay + 1);
  const longRental = longRentalDays * terms.longRentalExtra;
  const includedKm = days * terms.kmPerDay;
  const extraKm = km === undefined ? null : Math.max(0, km - includedKm);
  const extraKmCharge = (extraKm ?? 0) * terms.extraKmRate;
  return { days, base, longRentalDays, longRental, includedKm, extraKm, extraKmCharge, total: base + longRental + extraKmCharge };
}
