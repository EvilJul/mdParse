import { describe, it, expect } from 'vitest';
import { generateFileId, isMac } from '../helpers';

describe('generateFileId', () => {
  it('returns a 7-character string', () => {
    const id = generateFileId();
    expect(id).toHaveLength(7);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateFileId()));
    expect(ids.size).toBe(100);
  });

  it('contains only alphanumeric chars', () => {
    const id = generateFileId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe('isMac', () => {
  it('returns false in jsdom (non-Mac user agent)', () => {
    expect(isMac).toBe(false);
  });
});
