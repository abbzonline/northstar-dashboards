/** One row of northstar_flagship_30_day_metrics.csv. */
export interface DailyMetric {
  date: string; // ISO yyyy-mm-dd
  deployment: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  spend_usd: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  error_rate_pct: number;
  availability_pct: number;
  tier1_tickets: number;
  automated_tier1_tickets: number;
  automation_rate_pct: number;
  avg_handle_time_min: number;
  csat_score: number;
  grounded_answer_rate_pct: number;
  quality_eval_pass_rate_pct: number;
  escalation_rate_pct: number;
  operational_note: string | null;
}

export const NUMERIC_COLUMNS = [
  'requests',
  'input_tokens',
  'output_tokens',
  'total_tokens',
  'spend_usd',
  'p50_latency_ms',
  'p95_latency_ms',
  'error_rate_pct',
  'availability_pct',
  'tier1_tickets',
  'automated_tier1_tickets',
  'automation_rate_pct',
  'avg_handle_time_min',
  'csat_score',
  'grounded_answer_rate_pct',
  'quality_eval_pass_rate_pct',
  'escalation_rate_pct',
] as const satisfies readonly (keyof DailyMetric)[];

export const REQUIRED_COLUMNS = ['date', 'deployment', ...NUMERIC_COLUMNS, 'operational_note'] as const;
