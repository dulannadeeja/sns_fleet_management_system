// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, TextField } from '../../src/ui';

afterEach(cleanup);

describe('TextField', () => {
  it('labels the input, says required in words, and keeps input attributes', () => {
    render(<TextField label="දුරකථන අංකය · Phone number" name="phone" inputMode="tel" required />);
    const input = screen.getByRole('textbox', { name: /දුරකථන අංකය/ });
    expect(input.getAttribute('inputmode')).toBe('tel');
    expect(input.hasAttribute('required')).toBe(true);
    expect(screen.getByText(/අනිවාර්යයි · required/)).toBeTruthy();
  });
  it('marks an error and points the input to it', () => {
    render(<TextField label="මුරපදය · Password" name="password" type="password" hint="At least 8 characters." error="Too short." />);
    const input = document.getElementById('password')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('password-error password-hint');
    expect(screen.getByRole('alert').textContent).toBe('Too short.');
  });
});

describe('Button', () => {
  it('is a verb with an icon, primary by default, and a button unless told otherwise', async () => {
    const onClick = vi.fn();
    render(<Button icon="check" onClick={onClick}>ඇතුල් වෙන්න</Button>);
    const b = screen.getByRole('button', { name: 'ඇතුල් වෙන්න' });
    expect(b.className).toBe('rt-btn rt-btn-primary');
    expect(b.getAttribute('type')).toBe('button');
    await userEvent.click(b);
    expect(onClick).toHaveBeenCalled();
  });
  it('can submit a form and fill the width', () => {
    render(<Button type="submit" full variant="secondary">Save</Button>);
    const b = screen.getByRole('button', { name: 'Save' });
    expect(b.getAttribute('type')).toBe('submit');
    expect(b.className).toBe('rt-btn rt-btn-secondary rt-btn-full');
  });
});
