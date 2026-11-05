// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PlateBadge, StatusChip, VehicleImage } from '../../src/ui';

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

describe('VehicleImage', () => {
  it('shows the model\'s image, the 512px file for heroes, and the generic car for any other model', () => {
    const { container } = render(<><VehicleImage model="Wagon R" /><VehicleImage model="prius" size="lg" /><VehicleImage model="Vitz" label="A Vitz" /></>);
    const imgs = [...container.querySelectorAll('img.rt-vimg')] as HTMLImageElement[];
    expect(imgs.map((i) => i.getAttribute('src'))).toEqual(['/plate/vehicles/256/sns-vehicle-wagon-r.png', '/plate/vehicles/512/sns-vehicle-prius.png', '/plate/vehicles/256/sns-vehicle-generic.png']);
    expect(imgs[0].getAttribute('alt')).toBe('');
    expect(screen.getByAltText('A Vitz')).toBeTruthy();
  });
});
