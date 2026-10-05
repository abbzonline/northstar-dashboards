import { describe, expect, it } from 'vitest';
import { parseHash, viewHref } from './router';

describe('parseHash', () => {
  it('reads the view and optional anchor', () => {
    expect(parseHash('#/plan')).toEqual({ view: 'plan', anchor: undefined });
    expect(parseHash('#/trends/chart-latency')).toEqual({ view: 'trends', anchor: 'chart-latency' });
  });

  it('defaults to the health view', () => {
    expect(parseHash('')).toEqual({ view: 'health' });
    expect(parseHash('#/nonsense')).toEqual({ view: 'health' });
  });

  it('keeps old chart links working by sending them to the trends view', () => {
    expect(parseHash('#chart-quality')).toEqual({ view: 'trends', anchor: 'chart-quality' });
  });

  it('round-trips with viewHref', () => {
    expect(parseHash(viewHref('trends', 'chart-spend'))).toEqual({ view: 'trends', anchor: 'chart-spend' });
  });
});
