import {
  BRANDS_ON_SHARED_DEPLOYMENT,
  ChartCard,
  EventLegend,
  Section,
  TrendChart,
  WARM_H100_MONTH,
  WARM_H100_MONTH_EU,
  fmtUsd,
  series,
} from '@northstar/shared';
import type { Model } from '../model';
import { fmtUsd2, pctChange, round100 } from './format';

export function SpendView({ m, showEvents = true }: { m: Model; showEvents?: boolean }) {
  const { days, events, cmp } = m;
  const perMillion = (m.totalSpend / m.totalTokens) * 1e6;
  const runRate = (cmp.spend.last * 365) / 12;

  return (
    <>
      {showEvents && <EventLegend events={events} />}

      <Section id="spend" title="Spend">
        <ChartCard
          id="chart-spend"
          title="Daily and cumulative spend"
          headline={`${fmtUsd2(m.totalSpend)} for August. Daily spend ${pctChange(cmp.spend.deltaPct)} from week 1 to week 4, tracking usage.`}
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
          headline={`${fmtUsd(cmp.costPer1k.first, 3)} → ${fmtUsd(cmp.costPer1k.last, 3)} per 1,000 requests (week 1 → week 4): unit cost held steady as usage grew.`}
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

      <Section id="budget" title="Budget context" stack>
        <dl className="facts-card">
          <div>
            <dt>August</dt>
            <dd>{`${fmtUsd(m.totalSpend)}, billed per token (approx. ${fmtUsd2(perMillion)} per 1M tokens).`}</dd>
          </div>
          <div>
            <dt>Current run-rate</dt>
            <dd>{`Approx. ${round100(runRate)}/month at final-week traffic.`}</dd>
          </div>
          <div>
            <dt>Always-on capacity</dt>
            <dd>
              {`Holding a replica warm around the clock would move Atlas to approx. ${round100(WARM_H100_MONTH)}/month ` +
                `(${round100(WARM_H100_MONTH_EU)} with EU-only placement). We would recommend it only if the deployment telemetry ` +
                'shows that capacity scale-up is driving the availability misses.'}
            </dd>
          </div>
          <div>
            <dt>On the shared deployment</dt>
            <dd>
              {`The shared ${BRANDS_ON_SHARED_DEPLOYMENT}-brand deployment is billed as dedicated capacity; one always-on replica works out at approx. ` +
                `${round100(WARM_H100_MONTH / BRANDS_ON_SHARED_DEPLOYMENT)}–${round100(WARM_H100_MONTH_EU / BRANDS_ON_SHARED_DEPLOYMENT)} ` +
                'per brand per month.'}
            </dd>
          </div>
        </dl>
        <p className="table__caption">Capacity figures use Fireworks list rates as of 5 Oct 2026; contracted terms may differ.</p>
      </Section>
    </>
  );
}
