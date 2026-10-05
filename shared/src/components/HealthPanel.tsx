import { useState } from 'react';
import {
  bandLabels,
  rankRisks,
  STATUS_BANDS,
  type HealthResult,
  type HealthStatus,
  type PillarResult,
} from '../health/rampup';
import { fmtDay } from '../format';
import { PillarIcon, hasPillarIcon } from './PillarIcon';
import { Pips } from './Pips';
import { TopRisks } from './TopRisks';

const STATUS_LABEL = Object.fromEntries(STATUS_BANDS.map((b) => [b.status, b.label])) as Record<HealthStatus, string>;

/** "Healthy ≥ 4.00", "Positive-Watch 3.00–3.99", …, "At risk < 2.00" */
function bandText(i: number) {
  const b = STATUS_BANDS[i];
  if (i === 0) return `${b.label} ≥ ${b.min.toFixed(2)}`;
  const upper = (STATUS_BANDS[i - 1].min - 0.01).toFixed(2);
  if (b.min === -Infinity) return `${b.label} < ${STATUS_BANDS[i - 1].min.toFixed(2)}`;
  return `${b.label} ${b.min.toFixed(2)}–${upper}`;
}

export interface HealthPanelProps {
  health: HealthResult;
  /** Show the "Focus areas" button and pop-up (internal view only). */
  showRisks?: boolean;
  /** Show the status badge and band list (internal view only). */
  showStatus?: boolean;
  /** Label above the overall score. */
  label?: string;
  /** Row marker: the RAMP UP letter (internal) or a small icon (customer). */
  marker?: 'letter' | 'icon';
  /** Show pillar weights in the summary and on each row (internal view only). */
  showWeights?: boolean;
  /** Show the explanatory note under each metric (internal view only). */
  showNotes?: boolean;
}

export function HealthPanel({
  health,
  showRisks = false,
  showStatus = true,
  label = 'Overall',
  marker = 'letter',
  showWeights = true,
  showNotes = true,
}: HealthPanelProps) {
  // Accordion: at most one pillar open at a time.
  const [openKey, setOpenKey] = useState<string | null>(null);
  // Normalise so the shown weights always sum to 100% (pillars without input are redistributed).
  const totalWeight = health.pillars.reduce((s, p) => s + p.weight, 0);
  const weights = health.pillars
    .map((p) => `${p.letter}\u00a0${Math.round((p.weight / totalWeight) * 100)}%`)
    .join(' · ');
  return (
    <div className="health">
      <div className="health__summary">
        <span className="label health__brand">{label}</span>
        <div className="health__score">
          <span className="health__value">{health.score.toFixed(2)}</span>
          <span className="health__outof">/ 5</span>
        </div>
        {showStatus && (
          <div className="health__status-row">
            <span className={`badge health__status health__status--${health.status}`}>{STATUS_LABEL[health.status]}</span>
          </div>
        )}
        <dl className="health__facts">
          <div>
            <dt>Basis</dt>
            <dd>
              {health.window.isFullPeriod ? 'Full-period averages' : `Last ${health.window.days} days`} (
              {fmtDay(health.window.from)} – {fmtDay(health.window.to)}, {health.window.days} days)
            </dd>
          </div>
          {showWeights && (
            <div>
              <dt>Weights</dt>
              <dd>{weights}</dd>
            </div>
          )}
          {showStatus && (
            <div>
              <dt>Bands</dt>
              <dd className="health__bands">
                {STATUS_BANDS.map((b, i) => (
                  <span key={b.status}>{bandText(i)}</span>
                ))}
              </dd>
            </div>
          )}
        </dl>
        {showRisks && <TopRisks risks={rankRisks(health)} />}
      </div>

      <ol className="health__pillars">
        {health.pillars.map((p) => (
          <li key={p.key}>
            <PillarRow
              pillar={p}
              share={showWeights ? p.weight / totalWeight : undefined}
              marker={marker}
              showNotes={showNotes}
              open={openKey === p.key}
              onToggle={() => setOpenKey((k) => (k === p.key ? null : p.key))}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function PillarRow({
  pillar: p,
  share,
  marker,
  showNotes,
  open,
  onToggle,
}: {
  pillar: PillarResult;
  /** Weight as a share of the pillars shown (sums to 1); omitted to hide the weight. */
  share?: number;
  marker: 'letter' | 'icon';
  showNotes: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <details className="pillar" open={open}>
      <summary
        className={`pillar__summary${share === undefined ? ' pillar__summary--no-weight' : ''}`}
        onClick={(e) => {
          // Controlled: React owns the open state so only one pillar is open at a time.
          e.preventDefault();
          onToggle();
        }}
      >
        {marker === 'icon' && hasPillarIcon(p.key) ? (
          <span className="pillar__letter pillar__letter--icon">
            <PillarIcon pillarKey={p.key} />
          </span>
        ) : (
          <span className="pillar__letter">{p.letter}</span>
        )}
        <span className="pillar__name">
          <span className="pillar__title">
            {p.name}
            {p.kind === 'judgement' && <span className="pillar__tag label">Judgement</span>}
          </span>
          <span className="pillar__desc">{p.summary}</span>
        </span>
        {share !== undefined && <span className="pillar__weight label">{Math.round(share * 100)}%</span>}
        <Pips score={p.score} />
        <span className="pillar__score">{p.score.toFixed(1)}</span>
        <span className="pillar__chevron" aria-hidden="true" />
      </summary>

      <div className="pillar__body">
        {p.kind === 'measured' ? (
          <div className="pillar__table-wrap">
            <table className="pillar__table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Period avg</th>
                  <th>Score</th>
                  <th>Bands for 5 · 4 · 3 · 2</th>
                </tr>
              </thead>
              <tbody>
                {p.metrics.map((m) => {
                  const note = showNotes ? m.def.note : undefined;
                  return [
                    <tr key={m.def.id} className={note ? 'has-note' : undefined}>
                      <td className="pillar__metric">
                        {m.def.label}
                        {m.def.weight != null && m.def.weight !== 1 && <span className="muted"> (×{m.def.weight})</span>}
                      </td>
                      <td className="num">{m.def.format(m.value)}</td>
                      <td>
                        <span className="pillar__metric-score">
                          <Pips score={m.score} small />
                          <span className="num">{m.score}</span>
                        </span>
                      </td>
                      <td className="pillar__bands num">{bandLabels(m.def).join(' · ')}</td>
                    </tr>,
                    note && (
                      <tr key={`${m.def.id}-note`} className="pillar__note-row">
                        <td colSpan={4}>{note}</td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pillar__judgement">
            <p>{p.judgement.rationale}</p>
            {p.judgement.evidence && (
              <ul>
                {p.judgement.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
