// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader, BottomTabBar, BrandMark, LanguageSwitch, NavRail, PageHeader } from '../../src/ui';

afterEach(cleanup);

describe('BrandMark', () => {
  it('shows the supplied logo, or the mark alone', () => {
    const { container, rerender } = render(<BrandMark />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/plate/brand/sns-logo.png');
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('SNS Rent Car');
    rerender(<BrandMark variant="mark" size="sm" />);
    expect(container.querySelector('.rt-mark')?.className).toBe('rt-mark rt-mark-mark rt-mark-sm');
  });
});

describe('LanguageSwitch', () => {
  it('shows each option in its own script and tells which is chosen', async () => {
    const onChange = vi.fn();
    render(<LanguageSwitch lang="si" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'සිං' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'EN' }).getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(onChange).toHaveBeenCalledWith('en');
  });
  it('is marked unavailable while there is nothing to switch', () => {
    render(<LanguageSwitch lang="en" label="Language" />);
    expect(screen.getByRole('group', { name: 'Language' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'සිං' }).getAttribute('aria-disabled')).toBe('true');
  });
});

describe('AppHeader', () => {
  it('has the title, search link, New rental, language switch and the person', () => {
    render(<AppHeader title="අද · Today" subtitle="Thu 22 Oct 2026" search="හොයන්න" searchHref="/search" newHref="/rentals/new" user="S D De Silva" role="Owner" />);
    expect(screen.getByRole('banner').textContent).toContain('අද · Today');
    expect(screen.getByRole('link', { name: /හොයන්න/ }).getAttribute('href')).toBe('/search');
    expect(screen.getByRole('link', { name: /අලුත් කුලියක්/ }).getAttribute('href')).toBe('/rentals/new');
    expect(screen.getByRole('group', { name: /Language/ })).toBeTruthy();
    expect(screen.getByTitle('S D De Silva · Owner').textContent).toContain('SD');
  });
  it('leaves out New rental and search when not given (partners)', () => {
    render(<AppHeader title="මගේ මුදල් · My earnings" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('can show a plain search box and the logo', () => {
    const { container } = render(<AppHeader title="අද · Today" search="හොයන්න" showMark />);
    expect(screen.getByRole('searchbox', { name: 'හොයන්න' })).toBeTruthy();
    expect(container.querySelector('.rt-mark img')).toBeTruthy();
  });
});

describe('PageHeader', () => {
  it('has a real back link with a word for screen readers', () => {
    render(<PageHeader backHref="/" title="අද ව්‍යතිරේක · Today’s exceptions" subtitle="evening" />);
    expect(screen.getByRole('link', { name: 'ආපසු · Back' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('banner').textContent).toContain('evening');
  });
});

describe('NavRail', () => {
  const items = [
    { icon: 'home' as const, label: 'අද', href: '/', active: true },
    { icon: 'car' as const, label: 'වාහන', href: '/cars' },
    { icon: 'clipboard' as const, label: 'කුලී', href: '/rentals', badge: 1, badgeTone: 'overdue' as const, badgeHref: '/rentals?status=overdue' },
    { icon: 'wallet' as const, label: 'මුදල්', href: '/money' },
    { icon: 'stamp' as const, label: 'අනුමැති', href: '/approvals', badge: 3 },
    { icon: 'settings' as const, label: 'සැකසුම්', href: '/settings' },
  ];

  it('groups items by job with their headings, and puts Settings at the bottom', () => {
    const { container } = render(<NavRail items={items} />);
    const heads = [...container.querySelectorAll('.rt-side-head')].map((h) => h.textContent);
    expect(heads).toEqual(['වාහන සහ කුලී · Cars and rentals', 'මුදල් · Money', 'ව්‍යාපාරය · Running SNS']);
    expect(container.querySelector('.rt-side-foot')?.textContent).toContain('සැකසුම්');
  });

  it('marks the current page and gives each label its English echo', () => {
    render(<NavRail items={items} />);
    const today = screen.getByRole('link', { name: /අද/ });
    expect(today.getAttribute('aria-current')).toBe('page');
    expect(within(screen.getByRole('navigation')).getByText(/· Cars$/)).toBeTruthy();
  });

  it('makes a count its own link to the filtered list', () => {
    render(<NavRail items={items} />);
    const count = screen.getByRole('link', { name: '1 overdue, show them' });
    expect(count.getAttribute('href')).toBe('/rentals?status=overdue');
    expect(count.className).toContain('rt-side-badge-overdue');
    const waiting = screen.getByText('3', { selector: '.rt-side-badge' });
    expect(waiting.tagName).toBe('SPAN');
    expect(waiting.textContent).toBe('3 waiting');
  });

  it('marks only the current page', () => {
    render(<NavRail items={items} />);
    expect(screen.getByRole('link', { name: /වාහන/ }).getAttribute('aria-current')).toBeNull();
  });

  it('takes its screen-reader words as props, for the English interface', () => {
    const english = [
      { icon: 'home' as const, label: 'Today', href: '/', group: 0 as const },
      { icon: 'car' as const, label: 'Cars', href: '/cars', group: 1 as const, badge: 2, badgeHref: '/cars?x' },
      { icon: 'settings' as const, label: 'Settings', href: '/settings', group: 9 as const },
    ];
    const { container } = render(<NavRail items={english} labels={{ menu: 'Main menu', waiting: 'waiting', show: 'show them' }} />);
    expect(screen.getByRole('navigation', { name: 'Main menu' })).toBeTruthy();
    expect(container.querySelector('.rt-side-foot')?.textContent).toContain('Settings');
    expect(screen.getByRole('link', { name: '2 waiting, show them' })).toBeTruthy();
  });

  it('passes a click on an item to its handler', async () => {
    const onClick = vi.fn((e?: unknown) => (e as { preventDefault?: () => void })?.preventDefault?.());
    render(<NavRail items={[{ icon: 'car', label: 'වාහන', onClick }]} />);
    await userEvent.click(screen.getByRole('link', { name: /වාහන/ }));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('BottomTabBar', () => {
  const tabs = [
    { icon: 'car' as const, label: 'වාහන', href: '/', active: true },
    { icon: 'clipboard' as const, label: 'කුලී', href: '/rentals' },
    { icon: 'drawer' as const, label: 'ලාච්චුව', href: '/drawer' },
    { icon: 'more' as const, label: 'තවත්', href: '/more', badge: 2 },
  ];

  it('has labelled tabs, the current one marked, and badges', () => {
    render(<BottomTabBar tabs={tabs} />);
    const nav = screen.getByRole('navigation', { name: 'ප්‍රධාන මෙනුව · Main menu' });
    expect(within(nav).getAllByRole('link').map((a) => a.textContent)).toEqual(['වාහන', 'කුලී', 'ලාච්චුව', '2තවත්']);
    expect(within(nav).getByRole('link', { name: 'වාහන' }).getAttribute('aria-current')).toBe('page');
  });

  it('puts the centre action in the middle, with its label', () => {
    render(<BottomTabBar tabs={tabs} fab={{ icon: 'plus', label: 'අලුත්', href: '/rentals/new' }} label="Main menu" />);
    const links = within(screen.getByRole('navigation', { name: 'Main menu' })).getAllByRole('link');
    expect(links[2].textContent).toBe('අලුත්');
    expect(links[2].className).toContain('rt-tab-fab');
  });

  it('uses buttons for tabs without a link', async () => {
    const onClick = vi.fn();
    render(<BottomTabBar tabs={[{ icon: 'car', label: 'වාහන', onClick }]} fab={{ label: 'අලුත්', onClick }} />);
    await userEvent.click(screen.getByRole('button', { name: 'වාහන' }));
    await userEvent.click(screen.getByRole('button', { name: 'අලුත්' }));
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
