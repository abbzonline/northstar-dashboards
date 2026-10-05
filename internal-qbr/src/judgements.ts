import { ACCOUNT } from './account';
import { fmtUsd, sum, type DailyMetric, type Judgement } from '@northstar/shared';

/** Fireworks' annualised revenue run rate (company tear sheet, Jul 2026: "$1B+ ARR"). */
const FIREWORKS_RUN_RATE_USD = 1_000_000_000;

/**
 * Account-team judgement for the two P pillars of RAMP UP.
 * Internal only: the customer dashboard never imports this file.
 */
export function judgements(rows: DailyMetric[]): Record<'partnership' | 'profitability', Judgement> {
  const spend = sum(rows.map((r) => r.spend_usd));
  const annualised = (spend / rows.length) * 365;
  const shareOfRunRate = (annualised / FIREWORKS_RUN_RATE_USD) * 100;
  const opsEvents = rows.filter((r) => r.operational_note).length;
  const annualisedK = `$${Math.round(annualised / 1000)}k`;

  return {
    partnership: {
      score: 2,
      rationale:
        `Live on one brand out of five. The ${ACCOUNT.brand} team is engaged, but the wider business has not ` +
        'bought in: the four sister brands have no commitment, sponsor or timeline yet.',
      evidence: [
        `Single deployment: ${ACCOUNT.modelId} (${ACCOUNT.brand})`,
        'Expansion to the four other brands is still a proposal, not a plan',
        'Next step: secure an executive sponsor above brand level at the EBR',
      ],
    },
    profitability: {
      score: 1,
      rationale:
        `At about ${annualisedK} a year, ${ACCOUNT.brand} doesn't move the needle for a company with a $1B+ run ` +
        'rate, and it needed hands-on engineering in its first month. The commercial case rests on expansion.',
      evidence: [
        `${fmtUsd(spend)} revenue in ${rows.length} days, about ${annualisedK} annualised: ${shareOfRunRate.toFixed(4)}% of the $1B+ run rate`,
        `${opsEvents} hands-on interventions in month one (catalog sync incident, autoscaling change, RAG index refresh)`,
        'Assumes per-token serverless pricing (~$1.11 per 1M tokens); on dedicated GPUs the account would likely be loss-making',
        'Lever: the four sister brands on a shared model',
      ],
    },
  };
}
