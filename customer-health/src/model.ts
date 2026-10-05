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
  type OpsEvent,
} from '@northstar/shared';

/** Proposed availability target. No SLA was in place for August. */
export const AVAILABILITY_TARGET = 99.9;

/** Operational events restated in customer language (keyed by date). */
const EVENT_NOTES: Record<string, string> = {
  '2026-08-09': 'A product-catalogue sync briefly slowed responses and raised errors; resolved the same day',
  '2026-08-21': 'Promotion traffic spiked; capacity scaling was adjusted to respond faster to bursts',
  '2026-08-24': 'The knowledge index was refreshed; answers to return-policy questions became better grounded',
};

/** Everything the customer views derive from the CSV. Measured pillars only (R, A, M, U). */
export function buildModel(rows: DailyMetric[]) {
  const days = deriveDays(rows);
  const periodAvg = (key: NumericKey<DailyMetric>) => mean(days.map((d) => d[key]));
  const events: OpsEvent[] = extractEvents(rows).map((e) => ({ ...e, note: EVENT_NOTES[e.date] ?? e.note }));

  return {
    days,
    events,
    first: days[0],
    last: days[days.length - 1],
    health: computeHealth(rows, {}),
    periodAvg,
    cmp: {
      req: windowCompare(days, 'requests'),
      tickets: windowCompare(days, 'tier1_tickets'),
      reqPerTicket: windowCompare(days, 'requests_per_ticket'),
      automation: windowCompare(days, 'automation_rate_pct'),
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
    totalTokens: sum(days.map((d) => d.total_tokens)),
    avgAvailability: periodAvg('availability_pct'),
    worstAvailability: minBy(days, (d) => d.availability_pct),
    daysAtTarget: days.filter((d) => d.availability_pct >= AVAILABILITY_TARGET).length,
    firstAutomation70: days.find((d) => d.automation_rate_pct >= 70)?.date,
    avgError: periodAvg('error_rate_pct'),
    worstError: maxBy(days, (d) => d.error_rate_pct),
    worstP95: maxBy(days, (d) => d.p95_latency_ms),
  };
}

export type Model = ReturnType<typeof buildModel>;
