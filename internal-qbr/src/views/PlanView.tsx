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
      <Section id="pipeline" eyebrow="01 · Expansion pipeline" title="Pipeline across the four brands" stack>
        <div className="kpis kpis--plan">
          <KpiTile label="Brands live" value={`1 of ${brands.length}`} sub="Atlas only" />
          <KpiTile
            label="Tier-1 volume in pipeline"
            value={`${(groupMultiple - 1).toFixed(1)}× Atlas`}
            sub={`${fmtInt(sisters.reduce((s, b) => s + b.tickets, 0))} tickets/day across ${sisters.length} brands`}
          />
          <KpiTile
            label="Indicative group value"
            value={`${fmtUsd(Math.round((atlasAnnual * groupMultiple) / 1000) * 1000)}/yr`}
            sub={`vs ${fmtUsd(Math.round(atlasAnnual / 1000) * 1000)}/yr today; per-token revenue at Atlas's contracted rate`}
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
                <th>Confidence</th>
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
          Sister-brand profiles are scenario assumptions. Indicative value scales Atlas's August revenue by Tier-1 volume at the contracted per-token rate (~$1.12 per 1M tokens); the GPU floor that carries it is on the cost side, see Margin.
        </p>
      </Section>

      <Section id="risks" eyebrow="02 · Top risks" title="Top three risks" stack>
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

      <Section id="stakeholders" eyebrow="03 · Relationship" title="Stakeholder coverage" stack>
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

      <Section id="dependencies" eyebrow="04 · Delivery" title="Dependencies, support burden and margin" stack>
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
                One account team and one shared deployment for all five brands. Per-brand effort is one-off (adapter
                training and eval), not ongoing.
              </dd>
            </div>
            <div>
              <dt>Margin</dt>
              <dd>
                {`Northstar pays per token (${fmtUsd(m.totalSpend)} for August, ~$1.12 per 1M tokens); the dedicated ` +
                  `GPU floor is a Fireworks-side cost. One warm H100 is approx. ${round100(WARM_H100_MONTH)}/month at ` +
                  `${fmtUsd(H100_PER_HOUR, 2)}/GPU-hour list (approx. ${round100(WARM_H100_MONTH_EU)} at the ` +
                  `${REGION_PREMIUM}x region-restricted rate), so Atlas alone utilises roughly a fifth of a GPU-day ` +
                  `(inferred, not observed). A warm replica on Atlas alone would buy ~22 minutes of availability a month ` +
                  `(99.85% → 99.9%) with idle capacity that someone has to pay for; it is not recommended. On the shared ` +
                  `deployment five brands' token revenue (~$115k/yr indicative) covers one warm floor ` +
                  `(approx. ${round100(WARM_H100_MONTH * 12)}–${round100(WARM_H100_MONTH_EU * 12)}/yr at list), which ` +
                  `is what fixes the margin.`}
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

      <Section id="competition" eyebrow="05 · Competitive risk" title="Competitive risk" stack>
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

      <Section id="decisions" eyebrow="06 · Leadership" title="Decisions needed" stack>
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

      <Section id="actions" eyebrow="07 · Next actions" title="Next actions" stack>
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
