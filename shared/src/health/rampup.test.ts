import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadMetrics } from '../data/loadMetrics';
import { computeHealth, scoreValue, statusFor, type Judgement } from './rampup';

const csv = readFileSync(resolve(__dirname, '../../../data/northstar_flagship_30_day_metrics.csv'), 'utf8');
const loaded = loadMetrics(csv);
if (!loaded.ok) throw new Error('fixture failed to load');
const rows = loaded.rows;

const judgements: Record<string, Judgement> = {
  partnership: { score: 2, rationale: 'test' },
  profitability: { score: 5, rationale: 'test' },
};

describe('scoreValue', () => {
  it('scores higher-is-better bands inclusively at each edge', () => {
    const bands = { direction: 'higher' as const, edges: [99.9, 99.7, 99.5, 99.3] as [number, number, number, number] };
    expect(scoreValue(99.9, bands)).toBe(5);
    expect(scoreValue(99.89, bands)).toBe(4);
    expect(scoreValue(99.3, bands)).toBe(2);
    expect(scoreValue(99.29, bands)).toBe(1);
  });

  it('scores lower-is-better bands', () => {
    const bands = { direction: 'lower' as const, edges: [0.5, 1, 2, 5] as [number, number, number, number] };
    expect(scoreValue(0.5, bands)).toBe(5);
    expect(scoreValue(1.04, bands)).toBe(3);
    expect(scoreValue(6, bands)).toBe(1);
  });
});

describe('statusFor (bands out of 5)', () => {
  it('maps scores to statuses', () => {
    expect(statusFor(3.75)).toBe('healthy');
    expect(statusFor(3.74)).toBe('watch');
    expect(statusFor(2.5)).toBe('watch');
    expect(statusFor(2.49)).toBe('at-risk');
  });
});

describe('computeHealth on the Northstar dataset (full-period averages)', () => {
  const health = computeHealth(rows, judgements);
  const pillar = (key: string) => health.pillars.find((p) => p.key === key)!;
  const metric = (key: string, id: string) => {
    const p = pillar(key);
    if (p.kind !== 'measured') throw new Error(`${key} is not measured`);
    return p.metrics.find((m) => m.def.id === id)!;
  };

  it('scores the whole period, not a trailing window', () => {
    expect(health.window.days).toBe(31);
    expect(health.window.isFullPeriod).toBe(true);
  });

  it('scores each measured metric against its bands', () => {
    expect(metric('reliability', 'availability')).toMatchObject({ value: 99.85, score: 4 });
    expect(metric('reliability', 'errors')).toMatchObject({ value: 1.04, score: 3 });
    expect(metric('adoption', 'automation')).toMatchObject({ value: 67.9, score: 3 });
    expect(metric('model-quality', 'grounded')).toMatchObject({ value: 93.9, score: 4 });
    expect(metric('user-outcomes', 'csat')).toMatchObject({ value: 82.3, score: 4 });
    expect(metric('user-outcomes', 'fcr').score).toBe(4);
  });

  it('weights pillars 20/20/20/10/20/10 and lands just inside Healthy', () => {
    const weights = health.pillars.map((p) => p.weight);
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(health.score).toBeCloseTo(3.77, 2);
    expect(health.status).toBe('healthy');
  });

  it('redistributes weight when a judgement is missing', () => {
    const measuredOnly = computeHealth(rows, {});
    expect(measuredOnly.pillars).toHaveLength(4);
    expect(measuredOnly.pillars.reduce((a, p) => a + p.weight, 0)).toBeCloseTo(0.8, 10);
  });
});
