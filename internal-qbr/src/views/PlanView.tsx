import {
  H100_PER_HOUR,
  KpiTile,
  REGION_PREMIUM,
  Section,
  WARM_H100_MONTH,
  WARM_H100_MONTH_EU,
  WARM_H100_WEEK,
  fmtInt,
  fmtUsd,
} from '@northstar/shared';
import type { Model } from '../model';
import { ACTIONS, BRANDS, COMPETITORS, DECISIONS, DEPENDENCIES, RISKS, STAKEHOLDERS, type Level } from '../plan';

// Pricing constants come from @northstar/shared (shared/src/pricing.ts), checked 5 Oct 2026.

const round100 = (usd: number) => fmtUsd(Math.round(usd / 100) * 100);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const Pill = ({ children, tone }: { children: string; tone?: string }) => (
  <span className={`pill pill--${tone ?? slug(children)}`}>{children}</span>
);
const rated = (prefix: 'conf' | 'risk', l?: Level) =>
  l ? <Pill tone={`${prefix}-${slug(l)}`}>{l}</Pill> : <span className="muted">—</span>;

export function PlanView({ m }: { m: Model }) {
  const atlasTickets = m.periodAvg('tier1_tickets');
  const atlasAnnual = (m.totalSpend / m.days.length) * 365;
  const brands = BRANDS.map((b) => {
    const tickets = b.ticketsPerDay === 'from-data' ? atlasTickets : b.ticketsPerDay;
    return { ...b, tickets, multiple: tickets / atlasTickets };
  });
  const sisters = brands.filter((b) => b.stage !== 'Live');
  const groupMultiple = brands.reduce((s, b) => s + b.multiple, 0);
  const opsEvents = m.events.length;
  const pilot = brands.find((b) => b.stage === 'Pilot');

  return (
    <>
      <Section id="pipeline" title="Expansion pipeline" stack>
        <div className="kpis kpis--plan">
          <KpiTile label="Brands live" value={`1 of ${brands.length}`} sub="Atlas only" />
          <KpiTile
            label="Tier-1 volume in pipeline"
            value={`${(groupMultiple - 1).toFixed(1)}× Atlas`}
            sub={`${fmtInt(sisters.reduce((s, b) => s + b.tickets, 0))} tickets/day across ${sisters.length} brands`}
          />
          <KpiTile
            label="Shared deployment value"
            value={`${fmtUsd(Math.round((WARM_H100_MONTH * 12) / 1000) * 1000)}+/yr`}
            sub={`One H100 at list (${fmtUsd(Math.round((WARM_H100_MONTH_EU * 12) / 1000) * 1000)} EU), dedicated billing; vs ${fmtUsd(Math.round(atlasAnnual / 1000) * 1000)}/yr per token today`}
          />
          <KpiTile label="Pilot" value={pilot?.name ?? '—'} sub={pilot?.timing} />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Stage</th>
                <th>Tier-1 / day</th>
                <th>Catalogue</th>
                <th>Tone · returns</th>
                <th>Tooling</th>
                <th>Likelihood on timeline</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.name}>
                  <td>
                    <div className="table__strong">{b.name}</div>
                    <div className="table__sub">{b.positioning}</div>
                  </td>
                  <td>
                    <Pill>{b.stage}</Pill>
                    <div className="table__sub">{b.timing}</div>
                  </td>
                  <td className="num">
                    {fmtInt(b.tickets)}
                    <div className="table__sub">{b.stage === 'Live' ? 'from data' : `${b.multiple.toFixed(1)}× Atlas`}</div>
                  </td>
                  <td>{b.catalogue}</td>
                  <td>{b.toneAndReturns}</td>
                  <td>{b.tooling}</td>
                  <td>{rated('conf', b.confidence)}</td>
                  <td className="table__note">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table__caption">
          Sister-brand profiles are scenario assumptions. Shared deployment value is one dedicated H100 at list, billed to Northstar per GPU-second after migration; the replica count for five brands' combined load has to be benchmarked, so it is a floor, not a forecast.
        </p>
      </Section>

      <Section id="risks" title="Top three risks" stack>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Risk</th>
                <th>Evidence</th>
                <th>Mitigation</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {RISKS.map((r) => (
                <tr key={r.risk}>
                  <td>
                    <Pill tone="neutral">{r.kind}</Pill>
                  </td>
                  <td className="table__strong">{r.risk}</td>
                  <td>{r.evidence}</td>
                  <td>{r.mitigation}</td>
                  <td>{r.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table__caption">
          One technical, one relationship, one execution risk, as the brief asks. The "Focus areas" pop-up on the health view is the scoring-derived list and is a different thing.
        </p>
      </Section>

      <Section id="stakeholders" title="Stakeholder coverage" stack>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Stakeholder</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {STAKEHOLDERS.map((s) => (
                <tr key={s.role}>
                  <td className="table__strong">{s.role}</td>
                  <td>
                    <Pill>{s.status}</Pill>
                  </td>
                  <td>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="dependencies" title="Dependencies, support burden and margin" stack>
        <div className="plan-grid">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Dependency</th>
                  <th>Owner</th>
                  <th>Needed by</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {DEPENDENCIES.map((d) => (
                  <tr key={d.item}>
                    <td>{d.item}</td>
                    <td>{d.owner}</td>
                    <td className="num nowrap">{d.neededBy}</td>
                    <td>
                      <Pill>{d.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="facts-card">
            <div>
              <dt>Support burden (August)</dt>
              <dd>
                {opsEvents} operational events: a catalogue-sync incident, an autoscaling threshold adjustment and a RAG
                index refresh.
              </dd>
            </div>
            <div>
              <dt>Support after expansion</dt>
              <dd>
                One shared deployment and one account team give operating leverage across the five brands. Support still
                grows with each brand: its integration, RAG ingestion, eval sets, policy updates, adapter releases,
                monitoring and incidents.
              </dd>
            </div>
            <div>
              <dt>Margin</dt>
              <dd>
                {`Today Atlas is billed per token (${fmtUsd(m.totalSpend)} for August, ~$1.12 per 1M tokens). Its GPU ` +
                  `utilisation can't be derived from billing data, because the price is per token while dedicated ` +
                  `infrastructure is billed per GPU-second; deployment telemetry or load benchmarks are needed. On the shared ` +
                  `multi-LoRA deployment Northstar moves to dedicated capacity: one H100 is approx. ` +
                  `${round100(WARM_H100_MONTH)}/month at ${fmtUsd(H100_PER_HOUR, 2)}/GPU-hour list (approx. ` +
                  `${round100(WARM_H100_MONTH_EU)} at the ${REGION_PREMIUM}x region-restricted rate), so the GPU floor ` +
                  `sits on Northstar's bill rather than Fireworks' cost, which is what fixes the margin. A warm replica on ` +
                  `Atlas alone before migration is not justified on current evidence.`}
              </dd>
            </div>
            <div>
              <dt>Migration overlap</dt>
              <dd>
                {`Two deployments run in parallel during cutover: approx. ${round100(WARM_H100_WEEK)} per extra ` +
                  'week. Budget in weeks, not months.'}
              </dd>
            </div>
          </dl>
        </div>
      </Section>

      <Section id="competition" title="Competitive risk" stack>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Threat</th>
                <th>Where</th>
                <th>Risk</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.threat}>
                  <td className="table__strong">{c.threat}</td>
                  <td>{c.where}</td>
                  <td>{rated('risk', c.level)}</td>
                  <td>{c.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="decisions" title="Decisions needed" stack>
        <ol className="decisions">
          {DECISIONS.map((d, i) => (
            <li key={d.decision} className="decision">
              <span className="decision__rank label">{String(i + 1).padStart(2, '0')}</span>
              <div className="decision__main">
                <div className="decision__title">{d.decision}</div>
                <div className="decision__rec">
                  <span className="label">Recommendation</span> {d.recommendation}
                </div>
              </div>
              <div className="decision__meta">
                <div>{d.owner}</div>
                <div className="num">By {d.by}</div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="actions" title="Next actions" stack>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((a) => (
                <tr key={a.action}>
                  <td>{a.action}</td>
                  <td>{a.owner}</td>
                  <td className="num nowrap">{a.due}</td>
                  <td>
                    <Pill>{a.status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
