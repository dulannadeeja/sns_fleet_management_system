'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '../../../auth/require';
import { addWording, approveWording } from '../../../modules/rentals/agreements';

// Settings › Agreement wording (#55): the owner only; the module checks again and writes the activity log.
export type WordingState = { error?: string; values?: { textSi: string; textEn: string } };

export async function addWordingAction(_: WordingState, form: FormData): Promise<WordingState> {
  const person = await requireOwner();
  const values = { textSi: String(form.get('textSi') ?? ''), textEn: String(form.get('textEn') ?? '') };
  const result = await addWording(person.id, values);
  if ('error' in result) return { error: result.error, values };
  revalidatePath('/settings/agreement');
  redirect('/settings/agreement?saved=1');
}

export async function approveWordingAction(id: string, state: WordingState): Promise<WordingState> {
  const person = await requireOwner();
  const result = await approveWording(person.id, id);
  if ('error' in result) return { ...state, error: result.error };
  revalidatePath('/settings/agreement');
  redirect('/settings/agreement?approved=1');
}
