import {
  ChartCard,
  ErrorPanel,
  HealthPanel,
  EventLegend,
  KpiTile,
  Section,
  TrendChart,
  deriveDays,
  extractEvents,
  fmtCompact,
  fmtDay,
  fmtInt,
  fmtMs,
  fmtPct,
  fmtSigned,
  fmtUsd,
  maxBy,
  mean,
  minBy,
  series,
  computeHealth,
  sum,
  windowCompare,
  type DailyMetric,
  type LoadResult,
  type NumericKey,
} from '@northstar/shared';
import { useEffect } from 'react';
import { ACCOUNT } from './account';
import { judgements } from './judgements';
import fireworksLogo from '@northstar/shared/brand/fireworks-logo.svg';

/** Assumed enterprise availability target; not stated in the brief. */
const AVAILABILITY_TARGET = 99.9;

const pctChange = (x: number) => fmtSigned(x * 100, (n) => `${n.toFixed(0)}%`);
const ppChange = (x: number) => fmtSigned(x, (n) => `${n.toFixed(1)} pts`);
const fmtPct2 = (x: number) => fmtPct(x, 2);
const fmtUsd2 = (x: number) => fmtUsd(x, 2);

export function App({ result }: { result: LoadResult }) {
  return (
    <>
      <header className="topbar">
        <div className="frame topbar__inner">
          <img className="logo" src={fireworksLogo} alt="Fireworks AI" width={172} height={22} />
          <span className="badge badge--purple">Internal use only</span>
        </div>
      </header>
      <main className="frame shell">
        {result.ok ? (
          <Dashboard result={result} />
        ) : (
          <ErrorPanel title="Couldn't load northstar_flagship_30_day_metrics.csv" errors={result.errors} />
        )}
      </main>
    </>
  );
}

function Dashboard({ result }: { result: Extract<LoadResult, { ok: true }> }) {
  // Charts render after the browser's own load-time hash jump, so redo it for deep links (e.g. /#chart-latency).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, []);

  const days = deriveDays(result.rows);
  const events = extractEvents(result.rows);
  const first = days[0];
  const last = days[days.length - 1];

  // Week-1 vs final-week comparisons (7-day means).
  const req = windowCompare(days, 'requests');
  const tickets = windowCompare(days, 'tier1_tickets');
  const reqPerTicket = windowCompare(days, 'requests_per_ticket');
  const automation = windowCompare(days, 'automation_rate_pct');
  const spend = windowCompare(days, 'spend_usd');
  const costPer1k = windowCompare(days, 'cost_per_1k_requests_usd');
  const p50 = windowCompare(days, 'p50_latency_ms');
  const p95 = windowCompare(days, 'p95_latency_ms');
  const evalPass = windowCompare(days, 'quality_eval_pass_rate_pct');
  const grounded = windowCompare(days, 'grounded_answer_rate_pct');
  const escalation = windowCompare(days, 'escalation_rate_pct');
  const csat = windowCompare(days, 'csat_score');
  const aht = windowCompare(days, 'avg_handle_time_min');

  // Tiles show full-period averages, matching the RAMP UP basis.
  const periodAvg = (key: NumericKey<DailyMetric>) => mean(days.map((d) => d[key]));
  const totalSpend = sum(days.map((d) => d.spend_usd));
  const avgAvailability = mean(days.map((d) => d.availability_pct));
  const worstAvailability = minBy(days, (d) => d.availability_pct);
  const daysBelowTarget = days.filter((d) => d.availability_pct < AVAILABILITY_TARGET).length;
  const avgError = mean(days.map((d) => d.error_rate_pct));
  const worstError = maxBy(days, (d) => d.error_rate_pct);
  const worstP95 = maxBy(days, (d) => d.p95_latency_ms);
  const health = computeHealth(result.rows, judgements(result.rows));

  return (
    <>
      <div className="hero">
        <span className="eyebrow">Internal QBR · Account review</span>
        <h1>
          {ACCOUNT.company} — {ACCOUNT.brand}
        </h1>
        <div className="hero__meta">
          <span>
            Model ID: <span className="mono">{ACCOUNT.modelId}</span>
          </span>
          <span>
            {fmtDay(first.date)} – {fmtDay(last.date)}, {last.date.slice(0, 4)}
          </span>
        </div>
      </div>

      <Section id="health" eyebrow="00 · Account health" title="RAMP UP score">
        <HealthPanel health={health} showRisks />
      </Section>

      <div className="section__head kpis-head">
        <span className="eyebrow">Headline metrics</span>
        <p className="kpis-head__note">
          Full-period averages, the same basis as the health score. The change line compares the first week with the
          final week.
        </p>
      </div>
      <div className="kpis" aria-label="Headline metrics. Select one to jump to its trend chart">
        <KpiTile
          href="#chart-requests"
          label="Requests / day"
          value={fmtCompact(periodAvg('requests'))}
          delta={`${pctChange(req.deltaPct)} since week 1`}
          deltaGood={null}
          sub={`${fmtInt(sum(days.map((d) => d.requests)))} this month`}
        />
        <KpiTile
          href="#chart-csat-aht"
          label="Avg handle time"
          value={`${periodAvg('avg_handle_time_min').toFixed(2)} min`}
          delta={`${fmtSigned(aht.delta, (n) => n.toFixed(2))} min since week 1`}
          deltaGood={aht.delta < 0}
          sub="Brief: −35% vs pre-launch"
        />
        <KpiTile
          href="#chart-csat-aht"
          label="CSAT"
          value={periodAvg('csat_score').toFixed(1)}
          delta={`${ppChange(csat.delta)} since week 1`}
          deltaGood={csat.delta > 0}
          sub="Brief: +12 pts vs pre-launch"
        />
        <KpiTile
          href="#chart-spend"
          label="Spend"
          value={fmtUsd(totalSpend)}
          delta={`${pctChange(spend.deltaPct)} daily since week 1`}
          deltaGood={null}
          sub={`${fmtUsd2(periodAvg('spend_usd'))} / day average`}
        />
        <KpiTile
          href="#chart-availability"
          label="Availability"
          value={fmtPct2(avgAvailability)}
          delta={`${daysBelowTarget} of ${days.length} days < ${AVAILABILITY_TARGET}%`}
          deltaGood={daysBelowTarget === 0}
          sub={`Worst ${fmtPct2(worstAvailability.availability_pct)} on ${fmtDay(worstAvailability.date)}`}
        />
        <KpiTile
          href="#chart-latency"
          label="P50 / P95 latency"
          value={`${fmtMs(periodAvg('p50_latency_ms'))} / ${fmtMs(periodAvg('p95_latency_ms'))}`}
          delta={`P95 ${fmtSigned(p95.delta, fmtMs)} since week 1`}
          deltaGood={p95.delta < 0}
          sub={`P50 ${fmtSigned(p50.delta, fmtMs)} since week 1`}
        />
        <KpiTile
          href="#chart-quality"
          label="Eval pass rate"
          value={fmtPct(periodAvg('quality_eval_pass_rate_pct'))}
          delta={`${ppChange(evalPass.delta)} since week 1`}
          deltaGood={evalPass.delta > 0}
          sub={`Grounded ${fmtPct(periodAvg('grounded_answer_rate_pct'))}`}
        />
        <KpiTile
          href="#chart-quality"
          label="Escalation rate"
          value={fmtPct(periodAvg('escalation_rate_pct'))}
          delta={`${ppChange(escalation.delta)} since week 1`}
          deltaGood={escalation.delta < 0}
          sub={`Final week ${fmtPct(escalation.last)}`}
        />
      </div>

      <EventLegend events={events} />

      <Section id="adoption" eyebrow="01 · Adoption" title="Adoption">
        <ChartCard
          id="chart-requests"
          title="Requests vs Tier-1 tickets"
          headline={`Requests ${pctChange(req.deltaPct)} vs tickets ${pctChange(tickets.deltaPct)}: requests per ticket went from ${reqPerTicket.first.toFixed(1)} to ${reqPerTicket.last.toFixed(1)}.`}
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
          headline={`7-day average up from ${fmtPct(automation.first)} to ${fmtPct(automation.last)}; ended the month at ${fmtPct(last.automation_rate_pct)}.`}
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

      <Section id="spend" eyebrow="02 · Spend" title="Spend">
        <ChartCard
          id="chart-spend"
          title="Daily and cumulative spend"
          headline={`${fmtUsd2(totalSpend)} for the month. Daily spend ${pctChange(spend.deltaPct)}, tracking traffic.`}
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
          headline={`${fmtUsd(costPer1k.first, 3)} → ${fmtUsd(costPer1k.last, 3)} per 1k requests (7-day average).`}
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

      <Section id="reliability" eyebrow="03 · Reliability" title="Reliability">
        <ChartCard
          id="chart-availability"
          title="Availability"
          headline={`Averaged ${fmtPct2(avgAvailability)}; ${daysBelowTarget} of ${days.length} days below ${AVAILABILITY_TARGET}%. Lowest ${fmtPct2(worstAvailability.availability_pct)} on ${fmtDay(worstAvailability.date)}.`}
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
          headline={`Averaged ${fmtPct2(avgError)}; peaked at ${fmtPct2(worstError.error_rate_pct)} on ${fmtDay(worstError.date)}.`}
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

      <Section id="latency" eyebrow="04 · Latency" title="Latency">
        <ChartCard
          id="chart-latency"
          title="P50 and P95 latency"
          headline={`P95 ${fmtMs(p95.first)} → ${fmtMs(p95.last)} and P50 ${fmtMs(p50.first)} → ${fmtMs(p50.last)} while traffic grew ${pctChange(req.deltaPct)}. P95 peaked at ${fmtMs(worstP95.p95_latency_ms)} on ${fmtDay(worstP95.date)}.`}
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

      <Section id="quality" eyebrow="05 · Quality" title="Quality">
        <ChartCard
          id="chart-quality"
          title="Grounding, eval pass and escalation"
          headline={`Eval pass ${ppChange(evalPass.delta)}, grounded answers ${ppChange(grounded.delta)}, escalations ${ppChange(escalation.delta)} (7-day averages).`}
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
          headline={`CSAT ${csat.first.toFixed(1)} → ${csat.last.toFixed(1)}; handle time ${aht.first.toFixed(2)} → ${aht.last.toFixed(2)} min.`}
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

      <footer className="footer">
        <span>
          Source: <span className="mono">data/northstar_flagship_30_day_metrics.csv</span> (synthetic, {days.length} daily rows)
        </span>
        <span>Account-health score, risks, pipeline and actions: next iteration</span>
      </footer>
    </>
  );
}
