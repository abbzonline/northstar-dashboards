import {
  computeHealth,
  deriveDays,
  extractEvents,
  maxBy,
  mean,
  minBy,
  sum,
  windowCompare,
  type DailyMetric,
  type NumericKey,
} from '@northstar/shared';
import { judgements } from './judgements';

/** Assumed enterprise availability target; not stated in the brief. */
export const AVAILABILITY_TARGET = 99.9;

/** Everything the three views derive from the CSV, computed once. */
export function buildModel(rows: DailyMetric[]) {
  const days = deriveDays(rows);
  const periodAvg = (key: NumericKey<DailyMetric>) => mean(days.map((d) => d[key]));

  return {
    rows,
    days,
    events: extractEvents(rows),
    first: days[0],
    last: days[days.length - 1],
    health: computeHealth(rows, judgements(rows)),
    periodAvg,

    // Week-1 vs final-week comparisons (7-day means).
    cmp: {
      req: windowCompare(days, 'requests'),
      tickets: windowCompare(days, 'tier1_tickets'),
      reqPerTicket: windowCompare(days, 'requests_per_ticket'),
      automation: windowCompare(days, 'automation_rate_pct'),
      automated: windowCompare(days, 'automated_tier1_tickets'),
      spend: windowCompare(days, 'spend_usd'),
      costPer1k: windowCompare(days, 'cost_per_1k_requests_usd'),
      p50: windowCompare(days, 'p50_latency_ms'),
      p95: windowCompare(days, 'p95_latency_ms'),
      evalPass: windowCompare(days, 'quality_eval_pass_rate_pct'),
      grounded: windowCompare(days, 'grounded_answer_rate_pct'),
      escalation: windowCompare(days, 'escalation_rate_pct'),
      csat: windowCompare(days, 'csat_score'),
      aht: windowCompare(days, 'avg_handle_time_min'),
    },

    totalSpend: sum(days.map((d) => d.spend_usd)),
    totalRequests: sum(days.map((d) => d.requests)),
    avgAvailability: periodAvg('availability_pct'),
    worstAvailability: minBy(days, (d) => d.availability_pct),
    daysBelowTarget: days.filter((d) => d.availability_pct < AVAILABILITY_TARGET).length,
    avgError: periodAvg('error_rate_pct'),
    worstError: maxBy(days, (d) => d.error_rate_pct),
    worstP95: maxBy(days, (d) => d.p95_latency_ms),
  };
}

export type Model = ReturnType<typeof buildModel>;
