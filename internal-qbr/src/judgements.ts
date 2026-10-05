import { ACCOUNT } from './account';
import { fmtInt, fmtUsd, sum, type DailyMetric, type Judgement } from '@northstar/shared';

/**
 * Account-team judgement for the two P pillars of RAMP UP.
 * Internal only: the customer dashboard never imports this file.
 */
export function judgements(rows: DailyMetric[]): Record<'partnership' | 'profitability', Judgement> {
  const spend = sum(rows.map((r) => r.spend_usd));
  const agentHours = sum(rows.map((r) => r.automated_tier1_tickets * r.avg_handle_time_min)) / 60;
  const automated = sum(rows.map((r) => r.automated_tier1_tickets));

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
      score: 5,
      rationale:
        'Value delivered is far larger than the spend. A human team handling the same Tier-1 load would cost many times ' +
        'what Northstar paid for inference this month.',
      evidence: [
        `${fmtUsd(spend)} inference spend for the month`,
        `${fmtInt(automated)} Tier-1 tickets automated, roughly ${fmtInt(agentHours)} agent-hours at the current handle time`,
        'Caveat: from Fireworks’ side the account is small (~$15k annualised); expansion is the commercial lever',
      ],
    },
  };
}
