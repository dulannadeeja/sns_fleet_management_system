import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { bi, cx } from './text';
import type { IconName } from './types';

/** Inline message: info, warning or danger. */
export interface NoticeProps { tone?: 'info' | 'warning' | 'danger'; title?: string; icon?: IconName; children?: ReactNode; className?: string }

export function Notice({ tone = 'info', title, icon, children, className }: NoticeProps) {
  return (
    <div className={cx('rt-notice', `rt-notice-${tone}`, className)} role={tone === 'danger' ? 'alert' : 'note'}>
      <Icon name={icon ?? (tone === 'info' ? 'info' : 'alert')} size={20} />
      <div>{title ? <b>{bi(title)}</b> : null}{children}</div>
    </div>
  );
}
