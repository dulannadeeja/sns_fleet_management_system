import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { permissionGrant, user } from '../../db/schema';
import { allows, type Permission } from '../../auth/permissions';

// Shared by the cars and packages rules (no React, no imports from either, so neither imports the other in a circle).
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Whether the acting person may do this, read again inside the caller's transaction. */
export async function actorMay(tx: Tx, actorId: string, permission: Permission): Promise<boolean> {
  const [actor] = await tx.select({ role: user.role, disabledAt: user.disabledAt }).from(user).where(eq(user.id, actorId));
  if (!actor) return false;
  const granted = new Set((await tx.select({ p: permissionGrant.permission }).from(permissionGrant).where(eq(permissionGrant.userId, actorId))).map((g) => g.p));
  return allows(actor, granted, permission);
}

/** Limits to stop typing mistakes on a car's package and terms and on starting packages (system design 4.2; Proposed:
 *  Dulan, 1 Nov 2026; for packages 2 Nov 2026). Whole numbers only. */
export const LIMITS = {
  dailyRate: [1, 100_000], kmPerDay: [1, 1_000], extraKmRate: [0, 1_000], longRentalExtra: [0, 100_000],
  longRentalFromDay: [2, 60], garageDayCharge: [0, 100_000], commissionPercent: [0, 100],
} as const satisfies Record<string, readonly [number, number]>;
