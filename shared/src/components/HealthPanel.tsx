import { bandLabels, STATUS_BANDS, type HealthResult, type HealthStatus, type PillarResult } from '../health/rampup';
import { fmtDay } from '../format';

const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  'at-risk': 'At risk',
};

/** Five square pips, partially filled for fractional scores (e.g. 4.2). */
function Pips({ score, small }: { score: number; small?: boolean }) {
  return (
    <span className={`pips${small ? ' pips--small' : ''}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, score - i));
        return <span key={i} className="pip" style={{ ['--fill' as string]: `${fill * 100}%` }} />;
      })}
    </span>
  );
}

export function HealthPanel({ health }: { health: HealthResult }) {
  const weights = health.pillars.map((p) => `${p.letter} ${Math.round(p.weight * 100)}%`).join(' · ');
  return (
    <div className="health">
      <div className="health__summary">
        <span className="label health__brand">RAMP UP score</span>
        <div className="health__score">
          <span className="health__value">{health.score.toFixed(1)}</span>
          <span className="health__outof">/ 5</span>
        </div>
        <div className="health__status-row">
          <span className={`badge health__status health__status--${health.status}`}>{STATUS_LABEL[health.status]}</span>
        </div>
        <dl className="health__facts">
          <div>
            <dt>Basis</dt>
            <dd>
              {health.window.isFullPeriod ? 'Full-period averages' : `Last ${health.window.days} days`} (
              {fmtDay(health.window.from)} – {fmtDay(health.window.to)}, {health.window.days} days)
            </dd>
          </div>
          <div>
            <dt>Weights</dt>
            <dd>{weights}</dd>
          </div>
          <div>
            <dt>Bands</dt>
            <dd className="health__bands">
              <span>Healthy ≥ {STATUS_BANDS.healthy.toFixed(2)}</span>
              <span>
                Watch {STATUS_BANDS.watch.toFixed(2)}–{(STATUS_BANDS.healthy - 0.01).toFixed(2)}
              </span>
              <span>At risk &lt; {STATUS_BANDS.watch.toFixed(2)}</span>
            </dd>
          </div>
        </dl>
      </div>

      <ol className="health__pillars">
        {health.pillars.map((p) => (
          <li key={p.key}>
            <PillarRow pillar={p} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function PillarRow({ pillar: p }: { pillar: PillarResult }) {
  return (
    <details className="pillar">
      <summary className="pillar__summary">
        <span className="pillar__letter">{p.letter}</span>
        <span className="pillar__name">
          <span className="pillar__title">
            {p.name}
            {p.kind === 'judgement' && <span className="pillar__tag label">Judgement</span>}
          </span>
          <span className="pillar__desc">{p.summary}</span>
        </span>
        <span className="pillar__weight label">{Math.round(p.weight * 100)}%</span>
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
                  <th>Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {p.metrics.map((m) => [
                  <tr key={m.def.id} className={m.def.note ? 'has-note' : undefined}>
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
                    <td className="pillar__source">{m.def.source.label}</td>
                  </tr>,
                  m.def.note && (
                    <tr key={`${m.def.id}-note`} className="pillar__note-row">
                      <td colSpan={5}>{m.def.note}</td>
                    </tr>
                  ),
                ])}
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
