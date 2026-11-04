'use server';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '../../../auth/require';
import { tick } from '../../../modules/golive/golive';

// Screen 01.3 Ready to start (ST-01.3): the owner ticks an item done or not done; the module checks again.
export type TickState = { error?: string; values?: { reason: string } };

export async function tickAction(item: string, was: boolean, _: TickState, form: FormData): Promise<TickState> {
  const person = await requireOwner();
  const done = String(form.get('done')) === '1';
  const reason = String(form.get('reason') ?? '');
  const result = await tick(person.id, item, done, reason, was);
  revalidatePath('/settings/golive');
  revalidatePath('/');
  if ('error' in result) return { error: result.error, values: { reason } };
  return {};
}
