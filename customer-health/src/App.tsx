import { ACCOUNT, ErrorPanel, ViewMenu, fmtDay, type LoadResult } from '@northstar/shared';
import fireworksLogo from '@northstar/shared/brand/fireworks-logo.svg';
import { useEffect, useMemo } from 'react';
import { buildModel } from './model';
import { VIEWS, useRoute, viewHref, type ViewId } from './router';
import { NextStepsView } from './views/NextStepsView';
import { OutcomesView } from './views/OutcomesView';
import { QualityView } from './views/QualityView';
import { ServiceView } from './views/ServiceView';
import { SpendView } from './views/SpendView';

export function App({ result }: { result: LoadResult }) {
  const route = useRoute();
  const menu = VIEWS.map((v) => ({ ...v, href: viewHref(v.id) }));

  return (
    <>
      <header className="topbar">
        <div className="frame topbar__inner">
          <div className="topbar__left">
            <img className="logo" src={fireworksLogo} alt="Fireworks AI" width={172} height={22} />
            <span className="topbar__divider" aria-hidden="true" />
            <ViewMenu items={menu} current={route.view} />
          </div>
          <span className="badge badge--purple">Prepared for {ACCOUNT.company}</span>
        </div>
      </header>
      <main className="frame shell">
        {result.ok ? (
          <Dashboard result={result} view={route.view} anchor={route.anchor} />
        ) : (
          <ErrorPanel title="Couldn't load northstar_flagship_30_day_metrics.csv" errors={result.errors} />
        )}
      </main>
    </>
  );
}

function Dashboard({ result, view, anchor }: { result: Extract<LoadResult, { ok: true }>; view: ViewId; anchor?: string }) {
  const m = useMemo(() => buildModel(result.rows), [result.rows]);
  const label = VIEWS.find((v) => v.id === view)!.label;

  // On every route change: jump to the anchor (and pulse it), or start the new view at the top.
  useEffect(() => {
    if (!anchor) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const el = document.getElementById(anchor);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    el.classList.add('is-target');
    const t = window.setTimeout(() => el.classList.remove('is-target'), 1800);
    return () => window.clearTimeout(t);
  }, [view, anchor]);

  return (
    <>
      <div className="hero">
        <span className="eyebrow">Account health · {label}</span>
        <h1>
          {ACCOUNT.company} — {ACCOUNT.brand}
        </h1>
        <div className="hero__meta">
          <span>
            Model ID: <span className="mono">{ACCOUNT.modelId}</span>
          </span>
          <span>
            {fmtDay(m.first.date)} – {fmtDay(m.last.date)}, {m.last.date.slice(0, 4)}
          </span>
        </div>
      </div>

      {view === 'outcomes' && <OutcomesView m={m} />}
      {view === 'service' && <ServiceView m={m} />}
      {view === 'quality' && <QualityView m={m} />}
      {view === 'spend' && <SpendView m={m} />}
      {view === 'next-steps' && <NextStepsView />}
    </>
  );
}
