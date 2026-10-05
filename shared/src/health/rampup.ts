/**
 * RAMP UP account-health score, adapted from GitLab's PROVE framework.
 *
 *   R  Reliability     20%  measured
 *   A  Adoption        20%  measured
 *   M  Model quality   20%  measured
 *   P  Partnership     10%  judgement (internal only)
 *   U  User outcomes   20%  measured
 *   P  Profitability   10%  judgement (internal only): what the account is worth to Fireworks
 *
 * Every pillar scores 1–5. Measured pillars average their metric scores; each metric is
 * scored against published benchmark bands using its average over the whole reporting
 * period (not a trailing window), so a strong final week can't flatter the score.
 * Volume trend is the one comparison metric (first vs last 7 days). Values are rounded to display precision
 * before scoring, so the number on screen is the number that was scored.
 * Status is banded on the same 1–5 scale: Healthy ≥ 4, Positive-Watch ≥ 3, Negative-Watch ≥ 2, At risk below.
 */
import type { DailyMetric } from '../data/schema';
import { mean, round } from '../data/derive';
import { fmtMinSec, fmtMs, fmtPct } from '../format';

export type Score = 1 | 2 | 3 | 4 | 5;

/** Lower edge (or upper edge, for lower-is-better metrics) of scores 5, 4, 3 and 2. Anything beyond is a 1. */
export interface Bands {
  direction: 'higher' | 'lower';
  edges: [number, number, number, number];
}

export interface MetricDef {
  id: string;
  label: string;
  /** Value over the scoring window (the full period by default); `all` is the full dataset for trend metrics. */
  value: (window: DailyMetric[], all: DailyMetric[]) => number;
  precision: number;
  format: (n: number) => string;
  /** Formatter for band edges when they need more precision than the value (defaults to `format`). */
  bandFormat?: (n: number) => string;
  bands: Bands;
  /** Relative weight inside its pillar (default 1). */
  weight?: number;
  note?: string;
}

interface PillarBase {
  key: string;
  letter: string;
  name: string;
  /** Share of the overall score, 0–1. */
  weight: number;
  summary: string;
}

export interface MeasuredPillarDef extends PillarBase {
  kind: 'measured';
  metrics: MetricDef[];
}

export interface JudgementPillarDef extends PillarBase {
  kind: 'judgement';
}

export type PillarDef = MeasuredPillarDef | JudgementPillarDef;

/** A judgement score supplied by the account team (kept out of shared code). */
export interface Judgement {
  score: Score;
  rationale: string;
  evidence?: string[];
}

export function scoreValue(value: number, { direction, edges }: Bands): Score {
  const passes = (edge: number) => (direction === 'higher' ? value >= edge : value <= edge);
  if (passes(edges[0])) return 5;
  if (passes(edges[1])) return 4;
  if (passes(edges[2])) return 3;
  if (passes(edges[3])) return 2;
  return 1;
}

/** "≥ 95% · ≥ 90% · …" style labels for scores 5→2, used in the methodology table. */
export function bandLabels(metric: MetricDef): string[] {
  const op = metric.bands.direction === 'higher' ? '≥' : '≤';
  const f = metric.bandFormat ?? metric.format;
  return metric.bands.edges.map((e) => `${op} ${f(e)}`);
}

const avg = (rows: DailyMetric[], key: keyof DailyMetric) => mean(rows.map((r) => r[key] as number));

/** Band calibration is documented in docs/RAMPUP.md. */
export const RAMPUP: PillarDef[] = [
  {
    kind: 'measured',
    key: 'reliability',
    letter: 'R',
    name: 'Reliability',
    weight: 0.2,
    summary: 'Is the platform up, error-free and fast?',
    metrics: [
      {
        id: 'availability',
        label: 'Availability',
        value: (w) => avg(w, 'availability_pct'),
        precision: 2,
        format: (n) => fmtPct(n, 2),
        bands: { direction: 'higher', edges: [99.9, 99.7, 99.5, 99.3] },
      },
      {
        id: 'errors',
        label: 'Error rate',
        value: (w) => avg(w, 'error_rate_pct'),
        precision: 2,
        format: (n) => fmtPct(n, 2),
        bands: { direction: 'lower', edges: [0.5, 1, 2, 5] },
      },
      {
        id: 'p50',
        label: 'P50 latency',
        value: (w) => avg(w, 'p50_latency_ms'),
        precision: 0,
        format: fmtMs,
        bands: { direction: 'lower', edges: [300, 500, 800, 1200] },
        weight: 0.5,
        note: 'Assumed time-to-first-token: ~331 output tokens in ~600 ms end-to-end would be implausible.',
      },
      {
        id: 'p95',
        label: 'P95 latency',
        value: (w) => avg(w, 'p95_latency_ms'),
        precision: 0,
        format: fmtMs,
        bands: { direction: 'lower', edges: [1000, 1500, 2000, 3000] },
        weight: 0.5,
      },
    ],
  },
  {
    kind: 'measured',
    key: 'adoption',
    letter: 'A',
    name: 'Adoption',
    weight: 0.2,
    summary: 'Is Northstar putting more of its support load on the model?',
    metrics: [
      {
        id: 'automation',
        label: 'Tier-1 automation',
        value: (w) => avg(w, 'automation_rate_pct'),
        precision: 1,
        format: (n) => fmtPct(n, 1),
        bands: { direction: 'higher', edges: [80, 70, 60, 45] },
      },
      {
        id: 'volume-trend',
        label: 'Request volume trend',
        value: (_w, all) => {
          const first = avg(all.slice(0, 7), 'requests');
          const last = avg(all.slice(-7), 'requests');
          return ((last - first) / first) * 100;
        },
        precision: 0,
        format: (n) => `${n > 0 ? '+' : ''}${n.toFixed(0)}%`,
        bands: { direction: 'higher', edges: [10, 2, -2, -10] },
      },
    ],
  },
  {
    kind: 'measured',
    key: 'model-quality',
    letter: 'M',
    name: 'Model quality',
    weight: 0.2,
    summary: 'Are the answers right?',
    metrics: [
      {
        id: 'grounded',
        label: 'Grounded answers',
        value: (w) => avg(w, 'grounded_answer_rate_pct'),
        precision: 1,
        format: (n) => fmtPct(n, 1),
        bands: { direction: 'higher', edges: [95, 90, 85, 80] },
        note: 'Share of responses passing a groundedness check (scored 1–5, pass at 3).',
      },
      {
        id: 'eval-pass',
        label: 'Eval pass rate',
        value: (w) => avg(w, 'quality_eval_pass_rate_pct'),
        precision: 1,
        format: (n) => fmtPct(n, 1),
        bands: { direction: 'higher', edges: [95, 90, 85, 80] },
        note: 'Assumed composite: passes only if every component check passes.',
      },
    ],
  },
  {
    kind: 'judgement',
    key: 'partnership',
    letter: 'P',
    name: 'Partnership',
    weight: 0.1,
    summary: 'How committed is Northstar beyond the first deployment?',
  },
  {
    kind: 'measured',
    key: 'user-outcomes',
    letter: 'U',
    name: 'User outcomes',
    weight: 0.2,
    summary: "What did Northstar's shoppers experience?",
    metrics: [
      {
        id: 'csat',
        label: 'CSAT',
        value: (w) => avg(w, 'csat_score'),
        precision: 1,
        format: (n) => n.toFixed(1),
        bandFormat: (n) => n.toFixed(0),
        bands: { direction: 'higher', edges: [85, 70, 60, 50] },
        note: 'csat_score assumed to be % of satisfied responses (4–5 on a 5-point scale).',
      },
      {
        id: 'handle-time',
        label: 'Avg handle time',
        value: (w) => avg(w, 'avg_handle_time_min'),
        precision: 2,
        format: fmtMinSec,
        bands: { direction: 'lower', edges: [2.05, 12.12, 68, 120] },
      },
      {
        id: 'fcr',
        label: 'First-contact resolution',
        value: (w) => 100 - avg(w, 'escalation_rate_pct'),
        precision: 1,
        format: (n) => fmtPct(n, 1),
        bandFormat: (n) => fmtPct(n, 2),
        bands: { direction: 'higher', edges: [93.95, 82.43, 68.12, 58] },
        note: 'Proxy: 100% − escalation rate.',
      },
    ],
  },
  {
    kind: 'judgement',
    key: 'profitability',
    letter: 'P',
    name: 'Profitability',
    weight: 0.1,
    summary: 'Is the account commercially worth it to Fireworks?',
  },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface MetricResult {
  def: MetricDef;
  value: number;
  score: Score;
}

export type PillarResult =
  | (Omit<MeasuredPillarDef, 'metrics'> & { score: number; metrics: MetricResult[] })
  | (JudgementPillarDef & { score: number; judgement: Judgement });

export type HealthStatus = 'healthy' | 'positive-watch' | 'negative-watch' | 'at-risk';

export interface HealthResult {
  pillars: PillarResult[];
  /** Weighted score, 1–5. */
  score: number;
  status: HealthStatus;
  window: { from: string; to: string; days: number; isFullPeriod: boolean };
}

/** Status bands on the 1–5 scale, best first. A score takes the first band whose `min` it reaches. */
export const STATUS_BANDS: { status: HealthStatus; label: string; min: number }[] = [
  { status: 'healthy', label: 'Healthy', min: 4 },
  { status: 'positive-watch', label: 'Positive-Watch', min: 3 },
  { status: 'negative-watch', label: 'Negative-Watch', min: 2 },
  { status: 'at-risk', label: 'At risk', min: -Infinity },
];

export function statusFor(score: number): HealthStatus {
  return STATUS_BANDS.find((b) => score >= b.min)!.status;
}

export function computeHealth(
  rows: DailyMetric[],
  judgements: Partial<Record<string, Judgement>>,
  pillars: PillarDef[] = RAMPUP,
  /** Omit to score the whole period (the agreed default). */
  windowDays?: number,
): HealthResult {
  const window = windowDays ? rows.slice(-windowDays) : rows;

  const results: PillarResult[] = pillars
    .filter((p) => p.kind === 'measured' || judgements[p.key])
    .map((p) => {
      if (p.kind === 'judgement') {
        const judgement = judgements[p.key]!;
        return { ...p, score: judgement.score, judgement };
      }
      const metrics = p.metrics.map((def) => {
        const value = round(def.value(window, rows), def.precision);
        return { def, value, score: scoreValue(value, def.bands) };
      });
      const totalWeight = metrics.reduce((s, m) => s + (m.def.weight ?? 1), 0);
      const score = metrics.reduce((s, m) => s + m.score * (m.def.weight ?? 1), 0) / totalWeight;
      return { ...p, metrics, score };
    });

  // Missing pillars (e.g. judgements not supplied) have their weight redistributed, as in GitLab's model.
  const totalWeight = results.reduce((s, p) => s + p.weight, 0);
  const score = results.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight;
  return {
    pillars: results,
    score,
    status: statusFor(score),
    window: { from: window[0].date, to: window[window.length - 1].date, days: window.length, isFullPeriod: window.length === rows.length },
  };
}

// ---------------------------------------------------------------------------
// Top risks
// ---------------------------------------------------------------------------

export interface RiskItem {
  key: string;
  letter: string;
  pillar: string;
  label: string;
  kind: 'measured' | 'judgement';
  score: Score;
  /** Exact distance from a perfect 5, including how deep the value sits inside its band. */
  distance: number;
  /** Formatted current value (measured items only). */
  value?: string;
  /** Thresholds for the next band and for a 5, e.g. [{ score: 4, threshold: "≤ 500 ms" }, { score: 5, … }]. */
  targets?: { score: Score; threshold: string }[];
  /** Judgement rationale (judgement items only). */
  rationale?: string;
}

/**
 * Exact position of a value on the 1–5 scale: its whole-number score plus how far it has
 * travelled from that band's edge towards the next one. E.g. P50 605 ms sits 65% of the way
 * from 800 ms (a 3) to 500 ms (a 4), so 3.65. Scores of 5 stay 5; scores of 1 stay 1.
 */
export function exactPosition(value: number, score: Score, bands: Bands): number {
  if (score === 5 || score === 1) return score;
  // edges are listed for scores 5,4,3,2, so the edge for score s is at index 5 - s.
  const from = bands.edges[5 - score];
  const to = bands.edges[4 - score];
  return score + Math.max(0, Math.min(1, (value - from) / (to - from)));
}

/**
 * The items furthest from a perfect 5: every measured metric plus each judgement pillar,
 * ordered by exact distance from 5 (largest first).
 */
export function rankRisks(health: HealthResult, limit = 3): RiskItem[] {
  const items: RiskItem[] = health.pillars.flatMap((p): RiskItem[] => {
    if (p.kind === 'judgement') {
      return [
        {
          key: p.key,
          letter: p.letter,
          pillar: p.name,
          label: p.name,
          kind: 'judgement',
          score: p.judgement.score,
          distance: 5 - p.judgement.score,
          rationale: p.judgement.rationale,
        },
      ];
    }
    return p.metrics.map((m) => {
      const op = m.def.bands.direction === 'higher' ? '≥' : '≤';
      const f = m.def.bandFormat ?? m.def.format;
      // edges are listed for scores 5,4,3,2: the edge for score t is at index 5 - t.
      const targetScores = [...new Set([m.score + 1, 5])].filter((t) => t > m.score && t <= 5) as Score[];
      return {
        key: `${p.key}:${m.def.id}`,
        letter: p.letter,
        pillar: p.name,
        label: m.def.label,
        kind: 'measured',
        score: m.score,
        distance: 5 - exactPosition(m.value, m.score, m.def.bands),
        value: m.def.format(m.value),
        targets: targetScores.map((t) => ({ score: t, threshold: `${op} ${f(m.def.bands.edges[5 - t])}` })),
      };
    });
  });

  return items
    .filter((i) => i.distance > 0)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, limit);
}
