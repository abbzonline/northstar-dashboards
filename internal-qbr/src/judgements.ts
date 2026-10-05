import { ACCOUNT } from './account';
import { fmtUsd, sum, type DailyMetric, type Judgement } from '@northstar/shared';

/**
 * Account-team judgement for the two P pillars of RAMP UP.
 * Internal only: the customer dashboard never imports this file.
 */
export function judgements(rows: DailyMetric[]): Record<'partnership' | 'profitability', Judgement> {
  const spend = sum(rows.map((r) => r.spend_usd));
  const annualised = (spend / rows.length) * 365;
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
        'Cost to serve: three operational events in month one (catalogue-sync incident, autoscaling threshold adjustment, RAG index refresh). One account team supports all five brands on a single shared deployment, so support effort does not scale per brand',
        'Deployment economics: custom models run on dedicated deployments only, so Atlas carries a GPU floor (one warm H100 is approx. $5.8k/month at $8.00/GPU-hour; approx. $8.8k/month at the 1.5x region-restricted rate if EU residency is required). August billing is consistent only with aggressive scale-to-zero. One brand cannot keep a warm replica well utilised; five brands on one multi-LoRA deployment share it at approx. $1.2k–1.8k each',
        'Strategic value: a recognised retail logo and a reference account for EMEA retail',
        'Upside: rollout to the four sister brands, each with its own catalogue, tone of voice and return policies. Each brand gets a dedicated LoRA adapter, RAG index and system prompt on the same open-weight base as Atlas',
      ],
    },
  };
}
