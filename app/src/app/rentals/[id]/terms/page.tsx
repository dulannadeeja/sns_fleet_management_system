import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { getCar } from '../../../../modules/cars/cars';
import { getCustomer } from '../../../../modules/customers/customers';
import { referencesOf } from '../../../../modules/customers/references';
import { rentalTerms } from '../../../../modules/rentals/rentals';
import { rentalReadiness } from '../../../../modules/rentals/terms';
import { Notice } from '../../../../ui';
import { AppFrame } from '../../../AppFrame';
import { Step } from '../../Step';
import { rentalWords } from '../../words';
import { TermsForm } from './TermsForm';
import '../../../cars/cars.css';
import '../../rentals.css';

// Screen 05.4 Deposit and payment (ST-05.4; the reference person choice, ST-05.5): step 4 of New rental, on a saved
// rental (system design 7.1, 8.1, 8.2, 6; Confirmed 8 Nov 2026). Changeable until handover. Needs Customer access; the
// module also needs "Set or waive a deposit".
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TermsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; ref?: string; existing?: string }> }) {
  const person = await requirePermission('customerAccess');
  const r = await rentalTerms((await params).id);
  if (!r) notFound();
  const sp = await searchParams;
  const [c, car, ready, refs, t, tr, w, format] = await Promise.all([getCustomer(r.customerId), getCar(r.segments[0].vehicleId), rentalReadiness(r.id), referencesOf(r.customerId),
    getTranslations('rentals'), getTranslations('rentals.reference'), rentalWords(), getFormatter()]);
  const when = (d: Date) => format.dateTime(d, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' });
  const tk = await getTranslations('customers');
  const preselect = typeof sp.ref === 'string' && UUID.test(sp.ref) && refs.some((x) => x.id === sp.ref) ? sp.ref : null;
  return (
    <AppFrame person={person} active="rentals" title={t('title')} subtitle={`${c?.name ?? ''} · ${car?.registration ?? ''}`} backHref={`/rentals/${r.id}`}>
      <Step n={4} name="terms" />
      {sp.saved === '1' ? <Notice>{t('terms.saved', { plate: car?.registration ?? '', deadline: when(r.deadlineAt) })}</Notice> : null}
      {sp.existing === '1' ? <Notice>{tr('existing')}</Notice> : null}
      <TermsForm rentalId={r.id} fuelPrice={r.fuelPricePerLitre} preselect={preselect} w={w.terms as unknown as Record<string, string> & { errors: Record<string, string> }}
        references={refs.map((x) => ({ id: x.id, name: x.name, nic: x.nic, missing: x.copiesMissing.map((k) => tk(`refKinds.${k}`)).join(', ') }))}
        saved={{ deposit: ready?.deposit ? String(ready.deposit) : '', waive: !!ready?.waivedReason, waiveReason: ready?.waivedReason ?? '', rentPaid: ready?.rentPaid ?? '',
          fuel: ready?.fuel ?? '', referenceRequired: ready?.referenceRequired ?? null, referencePersonId: ready?.referencePersonId ?? '' }} />
    </AppFrame>
  );
}
