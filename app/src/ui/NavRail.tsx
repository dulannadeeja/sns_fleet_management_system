import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';
import { Icon } from './Icon';
import { bi, cx } from './text';
import type { NavItem } from './types';

/** Desktop navigation: 264px labelled sidebar grouped by job; logo on top, Settings at the bottom. Trimmed by permission. New rental lives in AppHeader. */
export interface NavRailProps { items: NavItem[]; newHref?: string; newLabel?: string; footer?: ReactNode; className?: string }

// Groups and English echoes by the Sinhala label, as in design-system/components/bundle.js.
const NAV_EN: Record<string, string> = { 'අද': 'Today', 'උදේ check': 'Morning check', 'වාහන': 'Cars', 'කුලී': 'Rentals', 'පාරිභෝගිකයෝ': 'Customers',
  'මුදල්': 'Money', 'ලාච්චුව': 'Drawer', 'Partner ගණන්': 'Partners', 'පඩි': 'Payroll', 'මගේ පඩිපත': 'My payslip',
  'මගේ මුදල්': 'My earnings', 'මුදල් ගන්න': 'Cash out', 'අනුමැති': 'Approvals', 'නඩත්තුව': 'Maintenance', 'වාර්තා': 'Reports', 'සැකසුම්': 'Settings' };
const NAV_GROUP: Record<string, number> = { 'අද': 0, 'උදේ check': 0, 'වාහන': 1, 'කුලී': 1, 'පාරිභෝගිකයෝ': 1, 'මුදල්': 2, 'ලාච්චුව': 2, 'Partner ගණන්': 2, 'පඩි': 2,
  'මගේ පඩිපත': 2, 'මගේ මුදල්': 2, 'මුදල් ගන්න': 2, 'අනුමැති': 3, 'නඩත්තුව': 3, 'වාර්තා': 3, 'සැකසුම්': 9 };
const NAV_HEAD: Record<number, string> = { 1: 'වාහන සහ කුලී · Cars and rentals', 2: 'මුදල් · Money', 3: 'ව්‍යාපාරය · Running SNS' };

function Link({ it }: { it: NavItem }) {
  const en = it.en ?? NAV_EN[it.label];
  const overdue = it.badgeTone === 'overdue';
  const countLabel = `${it.badge}${overdue ? ' overdue' : ' waiting'}${it.badgeHref ? ', show them' : ''}`;
  return (
    <div className={cx('rt-side-row', it.active && 'rt-side-row-active')}>
      <a href={it.href ?? '#'} className="rt-side-item" aria-current={it.active ? 'page' : undefined} onClick={it.onClick} title={en ? `${it.label} · ${en}` : it.label}>
        <span className="rt-side-ico"><Icon name={it.icon} size={20} /></span>
        <span className="rt-side-label">{it.label}{en ? <span className="rt-en">{` · ${en}`}</span> : null}</span>
      </a>
      {it.badge ? (it.badgeHref
        ? <a className={cx('rt-side-badge', overdue && 'rt-side-badge-overdue')} href={it.badgeHref} aria-label={countLabel}>{it.badge}</a>
        : <span className={cx('rt-side-badge', overdue && 'rt-side-badge-overdue')} aria-label={countLabel}>{it.badge}</span>) : null}
    </div>
  );
}

export function NavRail({ items, newHref, newLabel, footer, className }: NavRailProps) {
  const groups = new Map<number, NavItem[]>();
  const bottom: NavItem[] = [];
  for (const it of items) {
    const g = it.group ?? NAV_GROUP[it.label] ?? 0;
    if (g === 9) bottom.push(it);
    else groups.set(g, [...(groups.get(g) ?? []), it]);
  }
  return (
    <nav className={cx('rt-side', className)} aria-label="ප්‍රධාන මෙනුව · Main menu">
      <div className="rt-side-mark"><BrandMark className="rt-side-logo" /><BrandMark variant="mark" className="rt-side-logo-mark" /></div>
      {newHref ? <a href={newHref} className="rt-btn rt-btn-primary rt-btn-full"><Icon name="plus" size={20} /><span>{bi(newLabel ?? 'අලුත් කුලියක් · New rental')}</span></a> : null}
      <div className="rt-side-groups">
        {[...groups.keys()].sort().map((g) => (
          <div key={g} className="rt-side-group">
            {NAV_HEAD[g] ? <div className="rt-side-head">{bi(NAV_HEAD[g])}</div> : null}
            {groups.get(g)!.map((it, i) => <Link key={i} it={it} />)}
          </div>
        ))}
      </div>
      {bottom.length ? <div className="rt-side-foot">{bottom.map((it, i) => <Link key={i} it={it} />)}</div> : null}
      {footer ? <div className="rt-side-foot">{footer}</div> : null}
    </nav>
  );
}
