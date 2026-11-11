import { inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { rental } from '../../db/schema';

// One place that adds up a rental's money (system design 8.1 to 8.3; #53, #64, #65). Every reader of "paid", "held" or
// "written off" uses it: the bill (paidAndHeld), the payment cap (payments.ts), the debt (debtOf) and the deposit's
// settlement. Paid = payments put on the bill + their approved corrections + any deposit used for it − money paid back
// above the bill. Held = deposit received (and its corrections) − deposit used or refunded. Written off can no longer be
// paid. Whole rupees.

type Q = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;
export interface Figures { paid: number; held: number; writtenOff: number; refunded: number }
const ZERO: Figures = { paid: 0, held: 0, writtenOff: 0, refunded: 0 };

export async function moneyOf(q: Q, rentalIds: string[]): Promise<Map<string, Figures>> {
  const out = new Map<string, Figures>();
  const ids = [...new Set(rentalIds.map((i) => i.toLowerCase()))];
  if (!ids.length) return out;
  // The subqueries name "rental"."id" in full: a bare column there would be read from the inner table.
  const rows = await q.select({
    id: rental.id,
    allocated: sql<string>`coalesce((select sum(amount) from payment_allocation a where a.rental_id = "rental"."id"), 0)`,
    adjusted: sql<string>`coalesce((select sum(amount) from payment_adjustment j where j.rental_id = "rental"."id"), 0)`,
    appliedTo: sql<string>`coalesce((select sum(amount) from deposit_movement d where d.to_rental_id = "rental"."id" and d.kind = 'applied'), 0)`,
    refunded: sql<string>`coalesce((select sum(amount) from refund f where f.rental_id = "rental"."id"), 0)`,
    held: sql<string>`coalesce((select sum(case when d.kind in ('received', 'adjusted') then d.amount else -d.amount end) from deposit_movement d where d.rental_id = "rental"."id"), 0)`,
    writtenOff: sql<string>`coalesce((select sum(amount) from write_off_line w where w.rental_id = "rental"."id"), 0)`,
  }).from(rental).where(inArray(rental.id, ids));
  for (const r of rows) {
    out.set(r.id, { paid: Number(r.allocated) + Number(r.adjusted) + Number(r.appliedTo) - Number(r.refunded), held: Number(r.held), writtenOff: Number(r.writtenOff),
      refunded: Number(r.refunded) });
  }
  return out;
}

export async function moneyOne(q: Q, rentalId: string): Promise<Figures> {
  return (await moneyOf(q, [rentalId])).get(rentalId.toLowerCase()) ?? ZERO;
}
