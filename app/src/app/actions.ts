'use server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '../auth/server';

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  // The language can change here; refresh the root layout too, so <html lang> follows (the layout is otherwise kept).
  revalidatePath('/', 'layout');
  redirect('/sign-in');
}
