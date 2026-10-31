// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon, iconNames } from '../../src/ui';

describe('Icon', () => {
  it('draws a 24px-grid line icon in the text colour, hidden from screen readers by default', () => {
    const { container } = render(<Icon name="car" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.innerHTML).toContain('<path');
  });
  it('is announced when it has a title', () => {
    const { getByRole } = render(<Icon name="search" title="හොයන්න · Search" />);
    expect(getByRole('img', { name: 'හොයන්න · Search' })).toBeTruthy();
  });
  it('has every icon the design system has', () => {
    expect(iconNames).toEqual(expect.arrayContaining(['car', 'key', 'clockAlert', 'arrowLeft', 'arrowRight', 'plus', 'search', 'home', 'more']));
    expect(iconNames.length).toBe(45);
  });
});
