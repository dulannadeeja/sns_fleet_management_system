import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { bi, cx } from './text';

/** Phone page header: back link, title (Sinhala · English), subtitle, optional action. */
export interface PageHeaderProps { backHref?: string; backLabel?: string; title: string; subtitle?: string; numeric?: boolean; children?: ReactNode; className?: string }

export function PageHeader({ backHref, backLabel, title, subtitle, numeric, children, className }: PageHeaderProps) {
  return (
    <header className={cx('rt-pagehead', className)}>
      {backHref ? <a className="rt-pagehead-back" href={backHref} aria-label={backLabel ?? 'ආපසු · Back'}><Icon name="arrowLeft" size={22} /></a> : null}
      <div className="rt-pagehead-text">
        <div className={cx('rt-pagehead-title', numeric && 'rt-num')}>{bi(title)}</div>
        {subtitle ? <div className="rt-pagehead-sub">{subtitle}</div> : null}
      </div>
      {children ? <div className="rt-pagehead-act">{children}</div> : null}
    </header>
  );
}
