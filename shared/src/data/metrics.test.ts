import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deriveDays, sum, windowCompare } from './derive';
import { extractEvents } from './events';
import { loadMetrics } from './loadMetrics';

const csv = readFileSync(resolve(__dirname, '../../../data/northstar_flagship_30_day_metrics.csv'), 'utf8');

describe('loadMetrics', () => {
  it('parses the supplied dataset', () => {
    const result = loadMetrics(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(31);
    expect(result.rows[0].date).toBe('2026-08-01');
    expect(result.rows[30].date).toBe('2026-08-31');
  });

  it('rejects a CSV with a missing column', () => {
    const [header, ...rest] = csv.split('\n');
    const broken = [header.replace('spend_usd,', ''), ...rest].join('\n');
    const result = loadMetrics(broken);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toContain('spend_usd');
  });

  it('rejects non-numeric values with a line number', () => {
    const lines = csv.split('\n');
    const spendIdx = lines[0].split(',').indexOf('spend_usd');
    const cells = lines[3].split(',');
    cells[spendIdx] = 'oops';
    lines[3] = cells.join(',');
    const result = loadMetrics(lines.join('\n'));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContain('Line 4: spend_usd "oops" is not a number');
  });

  it('rejects a header with no rows', () => {
    const result = loadMetrics(csv.split('\n')[0]);
    expect(result.ok).toBe(false);
  });
});

describe('derived metrics reconcile with the raw data', () => {
  const result = loadMetrics(csv);
  if (!result.ok) throw new Error('fixture failed to load');
  const days = deriveDays(result.rows);

  it('totals spend for the month', () => {
    expect(sum(days.map((d) => d.spend_usd))).toBeCloseTo(1213.12, 2);
    expect(days[30].cumulative_spend_usd).toBeCloseTo(1213.12, 2);
  });

  it('computes requests per ticket', () => {
    expect(days[0].requests_per_ticket).toBeCloseTo(4.35, 2);
    expect(days[30].requests_per_ticket).toBeCloseTo(6.55, 2);
  });

  it('compares first and last 7 days', () => {
    const req = windowCompare(days, 'requests');
    expect(req.first).toBeLessThan(req.last);
    expect(req.deltaPct).toBeCloseTo((req.last - req.first) / req.first, 10);
  });

  it('extracts the three operational events', () => {
    const events = extractEvents(result.rows);
    expect(events.map((e) => [e.date, e.kind])).toEqual([
      ['2026-08-09', 'incident'],
      ['2026-08-21', 'incident'],
      ['2026-08-24', 'change'],
    ]);
  });
});
