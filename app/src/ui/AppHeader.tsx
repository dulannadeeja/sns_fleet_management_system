import { BrandMark } from './BrandMark';
import { Icon } from './Icon';
import { LanguageSwitch } from './LanguageSwitch';
import { bi, cx } from './text';
import type { Lang } from './types';

/** Light desktop top bar: page title + subtitle, search (a link to the search screen), New rental, language switch, initials (+ name and role at 1,100px and wider). */
export interface AppHeaderProps { title: string; subtitle?: string; search?: string; searchHref?: string; newHref?: string; newLabel?: string; showMark?: boolean; user?: string; role?: string; lang?: Lang; onLang?: (lang: Lang) => void; className?: string }

export function AppHeader(p: AppHeaderProps) {
  const initials = (p.user ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <header className={cx('rt-header', p.className)}>
      {p.showMark ? <BrandMark /> : null}
      <div className="rt-header-title"><span>{bi(p.title)}</span>{p.subtitle ? <small>{p.subtitle}</small> : null}</div>
      {p.searchHref ? (
        <a className="rt-search rt-search-link" href={p.searchHref}><Icon name="search" size={20} /><span>{p.search ?? 'හොයන්න · Search'}</span></a>
      ) : p.search ? (
        <label className="rt-search"><Icon name="search" size={20} /><input type="search" placeholder={p.search} aria-label={p.search} /></label>
      ) : null}
      {p.newHref ? (
        <a className="rt-btn rt-btn-primary rt-header-new" href={p.newHref}><Icon name="plus" size={20} /><span>{bi(p.newLabel ?? 'අලුත් කුලියක් · New rental')}</span></a>
      ) : null}
      <LanguageSwitch lang={p.lang} onChange={p.onLang} onLight />
      {p.user ? (
        <div className="rt-header-user" title={p.user + (p.role ? ` · ${p.role}` : '')}>
          <span className="rt-avatar" aria-hidden="true">{initials}</span>
          <span className="rt-header-who">{p.user}{p.role ? <small>{p.role}</small> : null}</span>
        </div>
      ) : null}
    </header>
  );
}
