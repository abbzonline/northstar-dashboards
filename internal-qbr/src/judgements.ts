import { ACCOUNT } from './account';
import { WARM_H100_MONTH, WARM_H100_MONTH_EU, fmtUsd, sum, type DailyMetric, type Judgement } from '@northstar/shared';

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
        `Current revenue: ${fmtUsd(spend)} for August at a contracted ~$1.12 per 1M tokens (approx. ${annualisedK} annualised)`,
        'Cost to serve: three operational events in month one (catalogue-sync incident, autoscaling threshold adjustment, RAG index refresh). One account team supports all five brands on a single shared deployment, so support effort does not scale per brand',
        `Deployment economics: Northstar pays per token while the dedicated GPU floor is a Fireworks-side cost. One warm H100 is approx. ${fmtUsd(Math.round(WARM_H100_MONTH / 100) * 100)}/month at list (approx. ${fmtUsd(Math.round(WARM_H100_MONTH_EU / 100) * 100)} at the EU rate), so Atlas alone utilises roughly a fifth of a GPU-day (inferred). No warm floor on Atlas unless telemetry shows it is needed; five brands on one multi-LoRA deployment turn any floor into utilised capacity`,
        'Strategic value: a recognised retail logo and a reference account for EMEA retail',
        'Upside: rollout to the four sister brands, each with its own catalogue, tone of voice and return policies. Each brand gets a dedicated LoRA adapter, RAG index and system prompt on the same open-weight base as Atlas',
      ],
    },
  };
}
