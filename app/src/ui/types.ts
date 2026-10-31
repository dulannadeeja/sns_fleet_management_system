// Props as in design-system/components/index.d.ts (the master). Keep names and shapes identical.
export type Lang = 'si' | 'en';
export type IconName = 'car' | 'key' | 'check' | 'clockAlert' | 'clock' | 'wrench' | 'pause' | 'link' | 'unlink' | 'lock' | 'eyeOff' | 'hourglass' | 'banknote' | 'drawer' | 'alert' | 'info' | 'question' | 'flag' | 'stamp' | 'plus' | 'camera' | 'phone' | 'search' | 'home' | 'clipboard' | 'users' | 'handshake' | 'wallet' | 'chart' | 'settings' | 'arrowRight' | 'arrowLeft' | 'returnCar' | 'file' | 'x' | 'calendar' | 'calendarPlus' | 'gauge' | 'fuel' | 'pen' | 'idcard' | 'more' | 'swap' | 'receipt' | 'box';

export interface NavItem { icon: IconName; label: string; active?: boolean; badge?: number | string; badgeTone?: 'overdue' | 'waiting'; badgeHref?: string; group?: 0 | 1 | 2 | 3 | 9; en?: string; href?: string; onClick?: () => void }
