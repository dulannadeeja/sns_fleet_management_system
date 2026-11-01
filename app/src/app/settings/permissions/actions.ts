'use server';
import { revalidatePath } from 'next/cache';
import { requireOwner } from '../../../auth/require';
import { setPermission, type PeopleError } from '../../../modules/people/people';

/** Screen 15.1: the owner gives or takes away one permission (ST-15.1, AT-58); logged with who and when. */
export async function setPermissionAction(personId: string, permission: string, allowed: boolean): Promise<{ error?: PeopleError }> {
  const owner = await requireOwner();
  const result = await setPermission(owner.id, personId, permission, allowed);
  if ('error' in result) return { error: result.error };
  revalidatePath('/settings', 'layout');
  return {};
}
