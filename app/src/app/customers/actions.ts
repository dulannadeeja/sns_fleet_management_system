'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '../../auth/require';
import { addCopy, addCustomer, COPY_KINDS, correctCustomer, type Copy } from '../../modules/customers/customers';

// Screens 08.2 and 08.3: requirePermission("Customer access"), then the customers module, which checks again and writes
// the activity log. Files are checked by the module from their own bytes (type and size) before anything is saved.
export type CustomerFormState = { error?: string; kind?: string; fields?: string[]; values?: Record<string, string> };

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
const DETAILS = ['name', 'nic', 'phone', 'address', 'licenceNumber', 'licenceExpires'] as const;

async function filesOf(form: FormData): Promise<Copy[]> {
  const copies: Copy[] = [];
  for (const kind of COPY_KINDS) {
    const f = form.get(kind);
    if (f instanceof File && f.size > 0) copies.push({ kind, bytes: new Uint8Array(await f.arrayBuffer()) });
  }
  return copies;
}

export async function addCustomerAction(_: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const person = await requirePermission('customerAccess');
  const values = Object.fromEntries(DETAILS.map((k) => [k, text(form, k)]));
  const result = await addCustomer(person.id, { name: values.name, nic: values.nic, phone: values.phone, address: values.address, licenceNumber: values.licenceNumber, licenceExpires: values.licenceExpires }, await filesOf(form));
  if ('existing' in result) redirect(`/customers/${result.existing}?existing=1`); // AT-51: the existing customer opens
  if ('error' in result) return { error: result.error, kind: result.kind, values };
  revalidatePath('/customers');
  redirect(`/customers/${result.id}?saved=1`);
}

export async function correctCustomerAction(customerId: string, _: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const person = await requirePermission('customerAccess');
  const read = (prefix: string) => ({ name: text(form, `${prefix}name`), phone: text(form, `${prefix}phone`), address: text(form, `${prefix}address`), licenceNumber: text(form, `${prefix}licenceNumber`), licenceExpires: text(form, `${prefix}licenceExpires`) });
  const values = read('');
  const result = await correctCustomer(person.id, customerId, values, read('was.'));
  if ('error' in result) return { error: result.error, fields: result.fields, values };
  revalidatePath(`/customers/${customerId}`);
  revalidatePath('/customers');
  redirect(`/customers/${customerId}?saved=1`);
}

export async function addCopyAction(customerId: string, kind: string, _: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const person = await requirePermission('customerAccess');
  const f = form.get('file');
  if (!(f instanceof File) || f.size === 0) return { error: 'fileType', kind };
  const result = await addCopy(person.id, customerId, kind, new Uint8Array(await f.arrayBuffer()));
  if ('error' in result) return { error: result.error, kind };
  revalidatePath(`/customers/${customerId}`);
  revalidatePath('/customers');
  redirect(`/customers/${customerId}?copy=1`);
}
