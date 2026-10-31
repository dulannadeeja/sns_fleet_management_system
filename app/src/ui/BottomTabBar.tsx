'use client';

import { Icon } from './Icon';
import { cx } from './text';
import type { IconName, NavItem } from './types';

/** Phone navigation: 4 tabs, icon above a visible label; optional raised centre action (`fab`) for the one most frequent task. */
export interface BottomTabBarProps { tabs: NavItem[]; fab?: { icon?: IconName; label: string; href?: string; active?: boolean; onClick?: () => void }; label?: string; className?: string }

export function BottomTabBar({ tabs, fab, label = 'ප්‍රධාන මෙනුව · Main menu', className }: BottomTabBarProps) {
  const items = tabs.map((t) => {
    const inner = (
      <>
        <span className="rt-tab-ico"><Icon name={t.icon} size={24} />{t.badge ? <span className="rt-tab-badge">{t.badge}</span> : null}</span>
        <span>{t.label}</span>
      </>
    );
    return t.href
      ? <a key={t.label} href={t.href} className="rt-tab" aria-current={t.active ? 'page' : undefined} onClick={t.onClick}>{inner}</a>
      : <button key={t.label} type="button" className="rt-tab" aria-current={t.active ? 'page' : undefined} onClick={t.onClick}>{inner}</button>;
  });
  if (fab) {
    const inner = (<><span className="rt-fab"><Icon name={fab.icon ?? 'plus'} size={26} /></span><span>{fab.label}</span></>);
    const node = fab.href
      ? <a key="fab" href={fab.href} className="rt-tab rt-tab-fab" aria-current={fab.active ? 'page' : undefined} onClick={fab.onClick}>{inner}</a>
      : <button key="fab" type="button" className="rt-tab rt-tab-fab" aria-current={fab.active ? 'page' : undefined} onClick={fab.onClick}>{inner}</button>;
    items.splice(Math.ceil(items.length / 2), 0, node);
  }
  return <nav className={cx('rt-tabs', className)} aria-label={label}>{items}</nav>;
}
