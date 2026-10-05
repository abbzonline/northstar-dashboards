import { EventLegend, HealthPanel, KpiTile, Section, fmtCompact, fmtDay, fmtInt, fmtMinSec, fmtMs, fmtPct, fmtSigned, fmtUsd } from '@northstar/shared';
import { AVAILABILITY_TARGET, type Model } from '../model';
import { viewHref } from '../router';
import { fmtPct2, fmtUsd2, pctChange, ppChange } from './format';

export function HealthView({ m, single = false }: { m: Model; single?: boolean }) {
  // On the single page, tiles scroll to the chart on the same page instead of switching view.
  const chart = (id: string) => viewHref(single ? 'all' : 'trends', id);
  const { cmp, periodAvg } = m;
  return (
    <>
      <Section id="health" title="Customer score">
        <HealthPanel health={m.health} showRisks />
      </Section>

      <div className="section__head kpis-head">
        <h2 className="section__title">Headline metrics</h2>
        <p className="kpis-head__note">
          Full-period averages, the same basis as the customer score. The change line compares the first week with the
          final week. Select a metric to open its trend.
        </p>
      </div>
      <div className="kpis" aria-label="Headline metrics. Select one to open its trend chart">
        <KpiTile
          href={chart('chart-requests')}
          label="Requests / day"
          value={fmtCompact(periodAvg('requests'))}
          delta={`${pctChange(cmp.req.deltaPct)} since week 1`}
          deltaGood={null}
          sub={`${fmtInt(m.totalRequests)} this month`}
        />
        <KpiTile
          href={chart('chart-csat-aht')}
          label="Avg handle time"
          value={fmtMinSec(periodAvg('avg_handle_time_min'))}
          delta={`${fmtSigned(cmp.aht.delta, fmtMinSec)} since week 1`}
          deltaGood={cmp.aht.delta < 0}
          sub="Brief: −35% vs pre-launch"
        />
        <KpiTile
          href={chart('chart-csat-aht')}
          label="CSAT"
          value={periodAvg('csat_score').toFixed(1)}
          delta={`${ppChange(cmp.csat.delta)} since week 1`}
          deltaGood={cmp.csat.delta > 0}
          sub="Brief: +12 pts vs pre-launch"
        />
        <KpiTile
          href={chart('chart-spend')}
          label="Spend"
          value={fmtUsd(m.totalSpend)}
          delta={`${pctChange(cmp.spend.deltaPct)} daily since week 1`}
          deltaGood={null}
          sub={`${fmtUsd2(periodAvg('spend_usd'))} / day average`}
        />
        <KpiTile
          href={chart('chart-availability')}
          label="Availability"
          value={fmtPct2(m.avgAvailability)}
          delta={`${m.daysBelowTarget} of ${m.days.length} days < ${AVAILABILITY_TARGET}%`}
          deltaGood={m.daysBelowTarget === 0}
          sub={`Worst ${fmtPct2(m.worstAvailability.availability_pct)} on ${fmtDay(m.worstAvailability.date)}`}
        />
        <KpiTile
          href={chart('chart-latency')}
          label="P50 / P95 latency"
          value={`${fmtMs(periodAvg('p50_latency_ms'))} / ${fmtMs(periodAvg('p95_latency_ms'))}`}
          delta={`P95 ${fmtSigned(cmp.p95.delta, fmtMs)} since week 1`}
          deltaGood={cmp.p95.delta < 0}
          sub={`P50 ${fmtSigned(cmp.p50.delta, fmtMs)} since week 1`}
        />
        <KpiTile
          href={chart('chart-quality')}
          label="Eval pass rate"
          value={fmtPct(periodAvg('quality_eval_pass_rate_pct'))}
          delta={`${ppChange(cmp.evalPass.delta)} since week 1`}
          deltaGood={cmp.evalPass.delta > 0}
          sub={`Grounded ${fmtPct(periodAvg('grounded_answer_rate_pct'))}`}
        />
        <KpiTile
          href={chart('chart-quality')}
          label="Escalation rate"
          value={fmtPct(periodAvg('escalation_rate_pct'))}
          delta={`${ppChange(cmp.escalation.delta)} since week 1`}
          deltaGood={cmp.escalation.delta < 0}
          sub={`Final week ${fmtPct(cmp.escalation.last)}`}
        />
      </div>

      <EventLegend events={m.events} />
    </>
  );
}
