import { ChartCard, EventLegend, Section, TrendChart, fmtPct, series } from '@northstar/shared';
import type { Model } from '../model';
import { ppChange } from './format';

export function QualityView({ m }: { m: Model }) {
  const { days, events, cmp } = m;
  return (
    <>
      <EventLegend events={events} />

      <Section id="quality" eyebrow="01 · Answer quality" title="Answer quality">
        <ChartCard
          id="chart-quality"
          title="Grounding, eval pass and escalation"
          headline={`Grounded answers ${cmp.grounded.first.toFixed(1)}% → ${cmp.grounded.last.toFixed(1)}%, eval pass ${cmp.evalPass.first.toFixed(1)}% → ${cmp.evalPass.last.toFixed(1)}%, escalations ${ppChange(cmp.escalation.delta)} (week 1 → week 4).`}
          footnote="Grounding and eval pass rates come from Northstar's evaluation harness."
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
          headline={`CSAT ${cmp.csat.first.toFixed(1)} → ${cmp.csat.last.toFixed(1)}; handle time ${cmp.aht.first.toFixed(2)} → ${cmp.aht.last.toFixed(2)} min (week 1 → week 4).`}
          footnote="The −35% and +12-point headline figures are versus Northstar's pre-launch baselines, which are not in this dataset."
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
