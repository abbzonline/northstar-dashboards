import type { DailyMetric } from './schema';

/** Keys of T whose values are numbers. */
export type NumericKey<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

/** Daily row plus the ratios the charts need. */
export interface DerivedDay extends DailyMetric {
  cumulative_spend_usd: number;
  cost_per_1k_requests_usd: number;
  requests_per_ticket: number;
}

export function deriveDays(rows: DailyMetric[]): DerivedDay[] {
  let cumulative = 0;
  return rows.map((r) => {
    cumulative += r.spend_usd;
    return {
      ...r,
      cumulative_spend_usd: round(cumulative, 2),
      cost_per_1k_requests_usd: round((r.spend_usd / r.requests) * 1000, 4),
      requests_per_ticket: round(r.requests / r.tier1_tickets, 2),
    };
  });
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const round = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp;

/** Mean of a column over the first and last `window` days, and the change between them. */
export function windowCompare<T>(rows: T[], key: NumericKey<T>, window = 7) {
  const values = rows.map((r) => r[key] as number);
  const first = mean(values.slice(0, window));
  const last = mean(values.slice(-window));
  return { first, last, delta: last - first, deltaPct: first ? (last - first) / first : NaN };
}

export function minBy<T>(rows: T[], f: (r: T) => number): T {
  return rows.reduce((best, r) => (f(r) < f(best) ? r : best));
}

export function maxBy<T>(rows: T[], f: (r: T) => number): T {
  return rows.reduce((best, r) => (f(r) > f(best) ? r : best));
}
