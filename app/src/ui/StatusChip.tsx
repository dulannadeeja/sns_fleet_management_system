import { Icon } from './Icon';
import { cx } from './text';
import type { IconName, Lang } from './types';

/** A car's status: colour, icon and word, Sinhala by default (design-system/components/StatusChip). */
export type VehicleStatus = 'overdue' | 'available' | 'rented' | 'repair' | 'unavailable' | 'retired';
export interface StatusChipProps { status: VehicleStatus; lang?: Lang; detail?: string; size?: 'sm' | 'md'; label?: string; icon?: IconName; className?: string }

// The design system's own words (the Sinhala labels are drafts for SNS review).
const STATUS: Record<VehicleStatus, { icon: IconName; si: string; en: string }> = {
  overdue: { icon: 'clockAlert', si: 'පරක්කුයි', en: 'Overdue' },
  available: { icon: 'check', si: 'නිදහස්', en: 'Available' },
  rented: { icon: 'key', si: 'කුලියට ගිහින්', en: 'Rented' },
  repair: { icon: 'wrench', si: 'අලුත්වැඩියාවට', en: 'Under repair' },
  unavailable: { icon: 'pause', si: 'තාවකාලිකව කුලියට නැහැ', en: 'Temporarily unavailable' },
  retired: { icon: 'box', si: 'ඉවත් කළා', en: 'Retired' },
};

export function StatusChip({ status, lang = 'si', detail, size, label, icon, className }: StatusChipProps) {
  const m = STATUS[status] ?? STATUS.available;
  return (
    <span className={cx('rt-chip', `rt-chip-${status}`, size === 'sm' && 'rt-chip-sm', className)}>
      <Icon name={icon ?? m.icon} size={size === 'sm' ? 16 : 18} />
      <span>{label ?? (lang === 'en' ? m.en : m.si)}</span>
      {detail ? <span className="rt-chip-detail">{`· ${detail}`}</span> : null}
    </span>
  );
}
