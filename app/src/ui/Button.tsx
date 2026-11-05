import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { cx } from './text';
import type { IconName } from './types';

/** A verb with an icon, 48px tall. One primary per screen. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; icon?: IconName; full?: boolean }

export function Button({ variant = 'primary', icon, full, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button {...rest} type={type} className={cx('rt-btn', `rt-btn-${variant}`, full && 'rt-btn-full', className)}>
      {icon ? <Icon name={icon} size={20} /> : null}<span>{children}</span>
    </button>
  );
}
