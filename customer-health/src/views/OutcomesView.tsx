import {
  ChartCard,
  HealthPanel,
  KpiTile,
  Section,
  TrendChart,
  fmtCompact,
  fmtDay,
  fmtInt,
  fmtMinSec,
  fmtMs,
  fmtPct,
  fmtSigned,
  series,
} from '@northstar/shared';
import { AVAILABILITY_TARGET, type Model } from '../model';
import { viewHref, type ViewId } from '../router';
import { fmtPct2, pctChange, ppChange } from './format';

export function OutcomesView({ m, single = false }: { m: Model; single?: boolean }) {
  // On the single page, tiles scroll to the chart on the same page instead of switching view.
  const chartHref = (view: ViewId, anchor: string) => viewHref(single ? 'all' : view, anchor);
  const { cmp, periodAvg, days, events } = m;
  return (
    <>
      <Section id="health" title="Operational health">
        <HealthPanel health={m.health} label="Operational health, 1–5" showStatus={false} marker="icon" showWeights={false} showNotes={false} />
      </Section>

      <div className="section__head kpis-head">
        <h2 className="section__title">Headline metrics</h2>
        <p className="kpis-head__note">
          August averages. The change line compares the first week with the final week. Select a result to see its
          trend.
        </p>
      </div>
      <div className="kpis" aria-label="Headline metrics. Select one to see its trend">
        <KpiTile
          href={chartHref('outcomes', 'chart-automation')}
          label="Tier-1 automation"
          value={fmtPct(periodAvg('automation_rate_pct'))}
          delta={`${ppChange(cmp.automation.delta)} since week 1`}
          deltaGood={cmp.automation.delta > 0}
          sub={`Final week ${fmtPct(cmp.automation.last)}; 70% reached from ${m.firstAutomation70 ? fmtDay(m.firstAutomation70) : '—'}`}
        />
        <KpiTile
          href={chartHref('quality', 'chart-csat-aht')}
          label="Avg handle time"
          value={fmtMinSec(periodAvg('avg_handle_time_min'))}
          delta={`${fmtMinSec(cmp.aht.first)} → ${fmtMinSec(cmp.aht.last)}, week 1 → week 4`}
          deltaGood={cmp.aht.delta < 0}
          sub="−35% vs pre-launch baseline, supplied by Northstar"
        />
        <KpiTile
          href={chartHref('quality', 'chart-csat-aht')}
          label="CSAT"
          value={periodAvg('csat_score').toFixed(1)}
          delta={`${cmp.csat.first.toFixed(1)} → ${cmp.csat.last.toFixed(1)}, week 1 → week 4`}
          deltaGood={cmp.csat.delta > 0}
          sub="+12 pts vs pre-launch baseline, supplied by Northstar"
        />
        <KpiTile
          href={chartHref('outcomes', 'chart-requests')}
          label="Requests / day"
          value={fmtCompact(periodAvg('requests'))}
          delta={`${pctChange(cmp.req.deltaPct)} since week 1`}
          deltaGood={null}
          sub={`${fmtInt(m.totalRequests)} in August`}
        />
        <KpiTile
          href={chartHref('service', 'chart-availability')}
          label="Availability"
          value={fmtPct2(m.avgAvailability)}
          delta={`${AVAILABILITY_TARGET}% met on ${m.daysAtTarget} of ${days.length} days`}
          deltaGood={null}
          sub={`Lowest ${fmtPct2(m.worstAvailability.availability_pct)} on ${fmtDay(m.worstAvailability.date)}`}
        />
        <KpiTile
          href={chartHref('service', 'chart-latency')}
          label="P50 / P95 latency"
          value={`${fmtMs(periodAvg('p50_latency_ms'))} / ${fmtMs(periodAvg('p95_latency_ms'))}`}
          delta={`P95 ${fmtSigned(cmp.p95.delta, fmtMs)} since week 1`}
          deltaGood={cmp.p95.delta < 0}
          sub={`P50 ${fmtSigned(cmp.p50.delta, fmtMs)} since week 1`}
        />
        <KpiTile
          href={chartHref('quality', 'chart-quality')}
          label="Eval pass rate"
          value={fmtPct(periodAvg('quality_eval_pass_rate_pct'))}
          delta={`${ppChange(cmp.evalPass.delta)} since week 1`}
          deltaGood={cmp.evalPass.delta > 0}
          sub={`Grounded answers ${fmtPct(periodAvg('grounded_answer_rate_pct'))}`}
        />
        <KpiTile
          href={chartHref('quality', 'chart-quality')}
          label="Escalation rate"
          value={fmtPct(periodAvg('escalation_rate_pct'))}
          delta={`${ppChange(cmp.escalation.delta)} since week 1`}
          deltaGood={cmp.escalation.delta < 0}
          sub={`Final week ${fmtPct(cmp.escalation.last)}`}
        />
      </div>

      <Section id="usage" title="Usage and adoption">
        <ChartCard
          id="chart-requests"
          title="Requests vs Tier-1 tickets"
          headline={`Requests ${pctChange(cmp.req.deltaPct)} vs tickets ${pctChange(cmp.tickets.deltaPct)} over the month.`}
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
          headline={`Rose from ${fmtPct(cmp.automation.first)} in week 1 to ${fmtPct(cmp.automation.last)} in the final week.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[{ key: 'automation_rate_pct', label: 'Automation rate', kind: 'line', color: series.primary, format: fmtPct }]}
            refLines={[{ y: 70, label: '70%' }]}
            leftFormat={(n) => fmtPct(n, 0)}
            leftDomain={[60, 76]}
          />
        </ChartCard>
      </Section>
    </>
  );
}
