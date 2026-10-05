import { ChartCard, EventLegend, Section, TrendChart, fmtDay, fmtMs, fmtPct, series } from '@northstar/shared';
import { AVAILABILITY_TARGET, type Model } from '../model';
import { fmtPct2 } from './format';

export function ServiceView({ m }: { m: Model }) {
  const { days, events, cmp } = m;
  return (
    <>
      <EventLegend events={events} />

      <Section id="availability" eyebrow="01 · Availability and errors" title="Availability and errors">
        <ChartCard
          id="chart-availability"
          title="Availability"
          headline={`Averaged ${fmtPct2(m.avgAvailability)}; ${AVAILABILITY_TARGET}% met on ${m.daysAtTarget} of ${days.length} days, all in the final week.`}
          footnote={`${AVAILABILITY_TARGET}% is a proposed target; no SLA was in place for August.`}
        >
          <TrendChart
            data={days}
            events={events}
            series={[{ key: 'availability_pct', label: 'Availability', kind: 'line', color: series.primary, format: (n) => fmtPct(n, 3) }]}
            refLines={[{ y: AVAILABILITY_TARGET, label: `${AVAILABILITY_TARGET}% proposed target` }]}
            leftFormat={fmtPct2}
            leftDomain={[99.6, 100]}
          />
        </ChartCard>
        <ChartCard
          id="chart-errors"
          title="Error rate"
          headline={`Averaged ${fmtPct2(m.avgError)}; highest on ${fmtDay(m.worstError.date)} (${fmtPct2(m.worstError.error_rate_pct)}), falling to ${fmtPct2(days[days.length - 1].error_rate_pct)} by month end.`}
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

      <Section id="latency" eyebrow="02 · Latency" title="Response latency">
        <ChartCard
          id="chart-latency"
          title="P50 and P95 latency"
          headline={`P95 ${fmtMs(cmp.p95.first)} → ${fmtMs(cmp.p95.last)} and P50 ${fmtMs(cmp.p50.first)} → ${fmtMs(cmp.p50.last)} (week 1 → week 4) while traffic grew. The two spikes match the 9 and 21 Aug events.`}
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

      <Section id="caveats" eyebrow="03 · Known caveats" title="Known caveats" stack>
        <dl className="facts-card">
          <div>
            <dt>Availability target</dt>
            <dd>
              {`${AVAILABILITY_TARGET}% was met on ${m.daysAtTarget} of ${days.length} days. Reaching it on Atlas alone would need ` +
                'always-on capacity at roughly 4–7x the current bill for about 22 minutes a month of extra availability. We ' +
                'recommend keeping the current set-up, retuning scale-up thresholds and pre-warming before planned ' +
                'promotions. 99.9% becomes affordable on the shared deployment once more brands are live.'}
            </dd>
          </div>
          <div>
            <dt>Requests per ticket</dt>
            <dd>
              {`Requests per Tier-1 ticket rose from ${cmp.reqPerTicket.first.toFixed(1)} to ${cmp.reqPerTicket.last.toFixed(1)} ` +
                'over the month (7-day averages). We would like to review this together: it may be longer conversations, ' +
                'repeat contacts or non-ticket traffic.'}
            </dd>
          </div>
          <div>
            <dt>Headline improvements</dt>
            <dd>
              The −35% handle time and +12-point CSAT figures compare against Northstar&apos;s pre-launch baselines, which are
              not in this dataset. The in-month trends shown here are measured directly.
            </dd>
          </div>
        </dl>
      </Section>
    </>
  );
}
