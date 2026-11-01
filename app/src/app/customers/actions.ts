'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePermission } from '../../auth/require';
import { addCopy, addCustomer, COPY_KINDS, correctCustomer, correctNic, type Copy } from '../../modules/customers/customers';
import { MAX_COPY_BYTES } from '../../storage/kinds';

// Screens 08.2 and 08.3: requirePermission("Customer access"), then the customers module, which checks again and writes
// the activity log. Files are checked by the module from their own bytes (type and size) before anything is saved.
export type CustomerFormState = { error?: string; kind?: string; fields?: string[]; values?: Record<string, string> };

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
const DETAILS = ['name', 'nic', 'phone', 'address', 'licenceNumber', 'licenceExpires'] as const;

/** The chosen files, or the first one over 10 MB (checked before reading it into memory, #19 review). */
async function filesOf(form: FormData): Promise<Copy[] | { tooBig: string }> {
  const copies: Copy[] = [];
  for (const kind of COPY_KINDS) {
    const f = form.get(kind);
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > MAX_COPY_BYTES) return { tooBig: kind };
    copies.push({ kind, bytes: new Uint8Array(await f.arrayBuffer()) });
  }
  return copies;
}

export async function addCustomerAction(_: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const person = await requirePermission('customerAccess');
  const values = Object.fromEntries(DETAILS.map((k) => [k, text(form, k)]));
  const files = await filesOf(form);
  if ('tooBig' in files) return { error: 'fileTooBig', kind: files.tooBig, values };
  const result = await addCustomer(person.id, { name: values.name, nic: values.nic, phone: values.phone, address: values.address, licenceNumber: values.licenceNumber, licenceExpires: values.licenceExpires }, files);
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
  if (f.size > MAX_COPY_BYTES) return { error: 'fileTooBig', kind };
  const result = await addCopy(person.id, customerId, kind, new Uint8Array(await f.arrayBuffer()));
  if ('error' in result) return { error: result.error, kind };
  revalidatePath(`/customers/${customerId}`);
  revalidatePath('/customers');
  redirect(`/customers/${customerId}?copy=1`);
}

/** 08.2: the owner or the admin corrects a mistyped NIC, with a reason (system design 6, Proposed). */
export async function correctNicAction(customerId: string, _: CustomerFormState, form: FormData): Promise<CustomerFormState> {
  const person = await requirePermission('customerAccess');
  const result = await correctNic(person.id, customerId, text(form, 'nic'), text(form, 'reason'));
  if ('error' in result) return { error: result.error, values: { nic: text(form, 'nic'), reason: text(form, 'reason') } };
  revalidatePath(`/customers/${customerId}`);
  revalidatePath('/customers');
  redirect(`/customers/${customerId}?nic=1`);
}
