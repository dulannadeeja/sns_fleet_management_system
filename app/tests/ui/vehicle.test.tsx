// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PlateBadge, StatusChip } from '../../src/ui';

afterEach(cleanup);

describe('PlateBadge', () => {
  it('shows the number exactly as written, labelled for screen readers', () => {
    render(<PlateBadge plate="CBK 4127" size="lg" lang="en" />);
    const plate = screen.getByLabelText('Registration CBK 4127');
    expect(plate.textContent).toBe('CBK 4127');
    expect(plate.className).toBe('rt-plate rt-plate-lg');
  });
});

describe('StatusChip', () => {
  it('pairs colour, icon and word; Sinhala by default', () => {
    const { container } = render(<StatusChip status="available" size="sm" />);
    expect(screen.getByText('නිදහස්')).toBeTruthy();
    expect(container.querySelector('.rt-chip.rt-chip-available.rt-chip-sm svg')).toBeTruthy();
  });
  it('speaks English when asked, and adds a detail', () => {
    render(<StatusChip status="repair" lang="en" detail="AC fault" />);
    expect(screen.getByText('Under repair')).toBeTruthy();
    expect(screen.getByText('· AC fault')).toBeTruthy();
  });
});
