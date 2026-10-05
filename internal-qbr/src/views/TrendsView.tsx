import {
  ChartCard,
  EventLegend,
  Section,
  TrendChart,
  fmtCompact,
  fmtDay,
  fmtInt,
  fmtMs,
  fmtPct,
  fmtUsd,
  series,
} from '@northstar/shared';
import { AVAILABILITY_TARGET, type Model } from '../model';
import { fmtPct2, fmtUsd2, pctChange, ppChange } from './format';

export function TrendsView({ m }: { m: Model }) {
  const { days, events, cmp, last } = m;
  return (
    <>
      <EventLegend events={events} />

      <Section id="adoption" title="Adoption">
        <ChartCard
          id="chart-requests"
          title="Requests vs Tier-1 tickets"
          headline={`Requests ${pctChange(cmp.req.deltaPct)} vs tickets ${pctChange(cmp.tickets.deltaPct)}: requests per ticket went from ${cmp.reqPerTicket.first.toFixed(1)} to ${cmp.reqPerTicket.last.toFixed(1)}.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[
              { key: 'requests', label: 'Requests', kind: 'area', color: series.primary, format: fmtInt },
              { key: 'tier1_tickets', label: 'Tier-1 tickets', kind: 'line', color: series.secondary, axis: 'right', format: fmtInt },
            ]}
            leftFormat={fmtCompact}
            rightFormat={fmtCompact}
            leftDomain={[0, 'auto']}
            rightDomain={[0, 'auto']}
          />
        </ChartCard>
        <ChartCard
          id="chart-automation"
          title="Tier-1 automation rate"
          headline={`7-day average up from ${fmtPct(cmp.automation.first)} to ${fmtPct(cmp.automation.last)}; ended the month at ${fmtPct(last.automation_rate_pct)}.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[{ key: 'automation_rate_pct', label: 'Automation rate', kind: 'line', color: series.primary, format: fmtPct }]}
            leftFormat={(n) => fmtPct(n, 0)}
            leftDomain={[60, 76]}
          />
        </ChartCard>
      </Section>

      <Section id="spend" title="Spend">
        <ChartCard
          id="chart-spend"
          title="Daily and cumulative spend"
          headline={`${fmtUsd2(m.totalSpend)} for the month. Daily spend ${pctChange(cmp.spend.deltaPct)}, tracking traffic.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[
              { key: 'spend_usd', label: 'Daily spend', kind: 'bar', color: series.primarySoft, format: fmtUsd2 },
              { key: 'cumulative_spend_usd', label: 'Cumulative', kind: 'line', color: series.primary, axis: 'right', format: fmtUsd2 },
            ]}
            leftFormat={(n) => fmtUsd(n)}
            rightFormat={(n) => fmtUsd(n)}
            leftDomain={[0, 'auto']}
            rightDomain={[0, 'auto']}
          />
        </ChartCard>
        <ChartCard
          id="chart-cost"
          title="Cost per 1,000 requests"
          headline={`${fmtUsd(cmp.costPer1k.first, 3)} → ${fmtUsd(cmp.costPer1k.last, 3)} per 1k requests (7-day average).`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[
              { key: 'cost_per_1k_requests_usd', label: 'Cost per 1k requests', kind: 'line', color: series.primary, format: (n) => fmtUsd(n, 3) },
            ]}
            leftFormat={(n) => fmtUsd(n, 2)}
            leftDomain={[0, 'auto']}
          />
        </ChartCard>
      </Section>

      <Section id="reliability" title="Reliability">
        <ChartCard
          id="chart-availability"
          title="Availability"
          headline={`Averaged ${fmtPct2(m.avgAvailability)}; ${m.daysBelowTarget} of ${days.length} days below ${AVAILABILITY_TARGET}%. Lowest ${fmtPct2(m.worstAvailability.availability_pct)} on ${fmtDay(m.worstAvailability.date)}.`}
          footnote={`${AVAILABILITY_TARGET}% is an assumed enterprise target; no SLA was provided.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[{ key: 'availability_pct', label: 'Availability', kind: 'line', color: series.primary, format: (n) => fmtPct(n, 3) }]}
            refLines={[{ y: AVAILABILITY_TARGET, label: `${AVAILABILITY_TARGET}% target` }]}
            leftFormat={fmtPct2}
            leftDomain={[99.6, 100]}
          />
        </ChartCard>
        <ChartCard
          id="chart-errors"
          title="Error rate"
          headline={`Averaged ${fmtPct2(m.avgError)}; peaked at ${fmtPct2(m.worstError.error_rate_pct)} on ${fmtDay(m.worstError.date)}.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[{ key: 'error_rate_pct', label: 'Error rate', kind: 'line', color: series.bad, format: fmtPct2 }]}
            leftFormat={(n) => fmtPct(n, 1)}
            leftDomain={[0, 'auto']}
          />
        </ChartCard>
      </Section>

      <Section id="latency" title="Latency">
        <ChartCard
          id="chart-latency"
          title="P50 and P95 latency"
          headline={`P95 ${fmtMs(cmp.p95.first)} → ${fmtMs(cmp.p95.last)} and P50 ${fmtMs(cmp.p50.first)} → ${fmtMs(cmp.p50.last)} while traffic grew ${pctChange(cmp.req.deltaPct)}. P95 peaked at ${fmtMs(m.worstP95.p95_latency_ms)} on ${fmtDay(m.worstP95.date)}.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[
              { key: 'p95_latency_ms', label: 'P95', kind: 'line', color: series.primary, format: fmtMs },
              { key: 'p50_latency_ms', label: 'P50', kind: 'line', color: series.secondary, format: fmtMs },
            ]}
            leftFormat={fmtMs}
            leftDomain={[0, 2400]}
          />
        </ChartCard>
      </Section>

      <Section id="quality" title="Quality">
        <ChartCard
          id="chart-quality"
          title="Grounding, eval pass and escalation"
          headline={`Eval pass ${ppChange(cmp.evalPass.delta)}, grounded answers ${ppChange(cmp.grounded.delta)}, escalations ${ppChange(cmp.escalation.delta)} (7-day averages).`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[
              { key: 'grounded_answer_rate_pct', label: 'Grounded answers', kind: 'line', color: series.primary, format: fmtPct },
              { key: 'quality_eval_pass_rate_pct', label: 'Eval pass', kind: 'line', color: series.tertiary, format: fmtPct },
              { key: 'escalation_rate_pct', label: 'Escalation', kind: 'line', color: series.secondary, axis: 'right', format: fmtPct },
            ]}
            leftFormat={(n) => fmtPct(n, 0)}
            rightFormat={(n) => fmtPct(n, 0)}
            leftDomain={[88, 100]}
            rightDomain={[0, 20]}
          />
        </ChartCard>
        <ChartCard
          id="chart-csat-aht"
          title="CSAT and average handle time"
          headline={`CSAT ${cmp.csat.first.toFixed(1)} → ${cmp.csat.last.toFixed(1)}; handle time ${cmp.aht.first.toFixed(2)} → ${cmp.aht.last.toFixed(2)} min.`}
          footnote="No pre-launch baseline is in the dataset. The brief's 35% handle-time cut and +12 CSAT are versus pre-deployment."
        >
          <TrendChart
            data={days}
            events={events}
            series={[
              { key: 'csat_score', label: 'CSAT', kind: 'line', color: series.primary, format: (n) => n.toFixed(1) },
              { key: 'avg_handle_time_min', label: 'Avg handle time (min)', kind: 'line', color: series.secondary, axis: 'right', dashed: true, format: (n) => `${n.toFixed(2)} min` },
            ]}
            leftFormat={(n) => n.toFixed(0)}
            rightFormat={(n) => `${n.toFixed(1)}m`}
            leftDomain={[78, 86]}
            rightDomain={[6, 10]}
          />
        </ChartCard>
      </Section>
    </>
  );
}
