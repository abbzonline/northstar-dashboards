import { ACCOUNT } from './account';
import { fmtUsd, sum, type DailyMetric, type Judgement } from '@northstar/shared';

/**
 * Account-team judgement for the two P pillars of RAMP UP.
 * Internal only: the customer dashboard never imports this file.
 */
export function judgements(rows: DailyMetric[]): Record<'partnership' | 'profitability', Judgement> {
  const spend = sum(rows.map((r) => r.spend_usd));
  const annualised = (spend / rows.length) * 365;
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
        'Current revenue is immaterial relative to the revenue ceiling across Northstar. The ' +
        `${ACCOUNT.brand} deployment serves as a proof of concept to secure approval for rollouts across the ` +
        'other four brands, which carry significantly higher customer volumes.',
      evidence: [
        `Current revenue: ${fmtUsd(spend)} for August (approx. ${annualisedK} annualised)`,
        `Cost to serve: ${opsEvents} engineering interventions in month one (catalog sync, autoscaling, RAG index refresh)`,
        'Pricing assumption: per-token serverless (approx. $1.11 per 1M tokens); dedicated capacity would not be margin-positive at current volume',
        'Upside: group-wide rollout to the four sister brands on a shared model',
      ],
    },
  };
}
