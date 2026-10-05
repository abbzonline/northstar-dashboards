import { describe, expect, it } from 'vitest';
import { interpolateNumbers } from './CountUp';

describe('interpolateNumbers', () => {
  it('returns the exact original string at the end', () => {
    for (const s of ['67.9%', '605 ms / 1.66 s', '25.5K', '$1,213', '99.85%', '3.83']) {
      expect(interpolateNumbers(s, 1)).toBe(s);
    }
  });

  it('starts every number at zero with its own precision', () => {
    expect(interpolateNumbers('605 ms / 1.66 s', 0)).toBe('0 ms / 0.00 s');
    expect(interpolateNumbers('99.85%', 0)).toBe('0.00%');
  });

  it('keeps decimals and thousands separators mid-way', () => {
    expect(interpolateNumbers('605 ms / 1.66 s', 0.5)).toBe('303 ms / 0.83 s');
    expect(interpolateNumbers('$1,213', 0.5)).toBe('$607');
    expect(interpolateNumbers('$12,130', 0.5)).toBe('$6,065');
    expect(interpolateNumbers('25.5K', 0.5)).toBe('12.8K');
  });

  it('leaves text without numbers alone', () => {
    expect(interpolateNumbers('Ridgeline', 0.3)).toBe('Ridgeline');
  });
});
