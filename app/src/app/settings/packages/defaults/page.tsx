import { getTranslations } from 'next-intl/server';
import { requirePermission } from '../../../../auth/require';
import { mayDo } from '../../../../auth/access';
import { readDefaults } from '../../../../modules/cars/packages';
import { SettingsFrame } from '../../SettingsFrame';
import { DefaultsForm } from '../PackageForms';
import { packageWords } from '../words';
import '../../../cars/cars.css';

// 04.6 › Change the defaults (system design 4.2): the commission is seen with "See partner earnings and terms" and
// changed only with "Add or edit partners".
export default async function DefaultsPage() {
  const person = await requirePermission('editCarsAndPackages');
  const [p, w, defaults, seeCommission, editPartners] = await Promise.all([
    getTranslations('cars.packages'), packageWords(), readDefaults(), mayDo(person, 'seePartnerEarnings'), mayDo(person, 'editPartners')]);
  // Nothing about the commission goes to the browser for people who may not see it.
  const shown: Record<string, number> = { longRentalExtra: defaults.longRentalExtra, longRentalFromDay: defaults.longRentalFromDay, garageDayCharge: defaults.garageDayCharge,
    ...(seeCommission ? { commissionPercent: defaults.commissionPercent } : {}) };
  return (
    <SettingsFrame person={person} active="packages" subtitle={p('defaultsTitle')} backHref="/settings/packages">
      <h2 className="set-rules-title" style={{ margin: 0 }}>{p('defaultsTitle')}</h2>
      <DefaultsForm defaults={shown} seeCommission={seeCommission} editCommission={seeCommission && editPartners} w={w} />
    </SettingsFrame>
  );
}
