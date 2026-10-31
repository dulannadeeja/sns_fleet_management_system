// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { bi, nb } from '../../src/ui/text';

describe('bi: "සිංහල · English" labels', () => {
  it('keeps the Sinhala as the label and the English as a quieter echo', () => {
    const { container } = render(<p>{bi('වාහන · Cars')}</p>);
    expect(container.textContent).toBe('වාහන · Cars');
    expect(container.querySelector('.rt-en')?.textContent).toBe(' · Cars');
  });
  it('leaves other text alone', () => {
    expect(bi('Partner cash-outs')).toBe('Partner cash-outs');
    expect(bi('CBK 4127 · Wagon R')).toBe('CBK 4127 · Wagon R');
  });
});

describe('nb: record ids never break', () => {
  it('uses a non-breaking hyphen in ids like R-0218', () => {
    expect(nb('R-0218 · HNB-509377')).toBe('R‑0218 · HNB‑509377');
  });
});
