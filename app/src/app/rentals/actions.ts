'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '../../auth/require';
import { createRental } from '../../modules/rentals/rentals';

// New rental (#51): requirePermission("Customer access"), then the rentals module, which checks everything again in one
// transaction and writes the activity log. The pickup is the moment of the save (05.3 shows "now").
export type SaveState = { error?: string; days?: string };

export async function saveRentalAction(customerId: string, vehicleId: string, goAheadId: string | null, _: SaveState, form: FormData): Promise<SaveState> {
  const person = await requirePermission('customerAccess');
  const daysText = String(form.get('days') ?? '').trim();
  const days = /^\d{1,3}$/.test(daysText) ? Number(daysText) : NaN;
  const result = await createRental(person.id, { customerId, vehicleId, pickupAt: new Date(), days, ...(goAheadId ? { goAheadId } : {}) });
  if ('error' in result) return { error: result.error, days: daysText };
  revalidatePath('/rentals/new/car');
  redirect(`/rentals/${result.id}?saved=1`);
}
