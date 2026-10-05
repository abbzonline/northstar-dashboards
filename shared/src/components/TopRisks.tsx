import { useRef } from 'react';
import type { RiskItem } from '../health/rampup';
import { Pips } from './Pips';

/**
 * "Focus areas" button plus a modal listing the items furthest from a perfect 5 (scoring-derived; the risk register is on the plan view).
 * Native <dialog> with showModal(): Esc closes, focus stays inside, the backdrop blurs the page.
 */
export function TopRisks({ risks }: { risks: RiskItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <button type="button" className="fw-button health__risks-button" onClick={() => dialog.current?.showModal()}>
        Focus areas
        <span className="fw-button__count">{risks.length}</span>
      </button>

      <dialog
        ref={dialog}
        className="risks"
        aria-labelledby="risks-title"
        // A click on the backdrop lands on the <dialog> itself; clicks inside land on its children.
        onClick={(e) => e.target === dialog.current && close()}
      >
        <div className="risks__inner">
          <header className="risks__head">
            <div>
              <span className="eyebrow">Lowest-scoring items</span>
              <h2 id="risks-title" className="risks__title">
                Focus areas
              </h2>
            </div>
            <button type="button" className="risks__close" onClick={close} aria-label="Close">
              <span aria-hidden="true" />
            </button>
          </header>

          <ol className="risks__list">
            {risks.map((r, i) => (
              <li key={r.key} className="risk">
                <span className="risk__rank label">{String(i + 1).padStart(2, '0')}</span>
                <span className="pillar__letter">{r.letter}</span>
                <div className="risk__main">
                  <div className="risk__title">
                    {r.label}
                    {r.kind === 'judgement' ? (
                      <span className="pillar__tag label">Judgement</span>
                    ) : (
                      <span className="risk__pillar">{r.pillar}</span>
                    )}
                  </div>
                  {r.kind === 'measured' ? (
                    <dl className="risk__facts">
                      <div>
                        <dt>Current</dt>
                        <dd className="num">{r.value}</dd>
                      </div>
                      {r.targets?.map((t) => (
                        <div key={t.score}>
                          <dt>For a {t.score}</dt>
                          <dd className="num">{t.threshold}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="risk__rationale">{r.rationale}</p>
                  )}
                </div>
                <div className="risk__score">
                  <Pips score={r.score} />
                  <span className="pillar__score">{r.score}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </dialog>
    </>
  );
}
