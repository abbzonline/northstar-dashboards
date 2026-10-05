import { ErrorPanel, SinglePageSwitch, ViewMenu, fmtDay, type LoadResult } from '@northstar/shared';
import fireworksLogo from '@northstar/shared/brand/fireworks-logo.svg';
import { useEffect, useMemo } from 'react';
import { ACCOUNT } from './account';
import { buildModel } from './model';
import { VIEWS, useRoute, viewHref, type RouteView } from './router';
import { HealthView } from './views/HealthView';
import { PlanView } from './views/PlanView';
import { TrendsView } from './views/TrendsView';

export function App({ result }: { result: LoadResult }) {
  const route = useRoute();
  const single = route.view === 'all';
  // On the single page the menu jumps to each view's block instead of switching view.
  const menu = VIEWS.map((v) => ({ ...v, href: single ? viewHref('all', `view-${v.id}`) : viewHref(v.id) }));

  return (
    <>
      <header className="topbar">
        <div className="frame topbar__inner">
          <div className="topbar__left">
            <img className="logo" src={fireworksLogo} alt="Fireworks AI" width={172} height={22} />
            <span className="topbar__divider" aria-hidden="true" />
            <ViewMenu items={menu} current={route.view} label={single ? 'Jump to' : undefined} />
            <SinglePageSwitch on={single} href={single ? viewHref('health') : viewHref('all')} />
          </div>
          <span className="badge badge--purple">Internal use only</span>
        </div>
      </header>
      <main className="frame shell motion-l1">
        {result.ok ? (
          <Dashboard result={result} view={route.view} anchor={route.anchor} />
        ) : (
          <ErrorPanel title="Couldn't load northstar_flagship_30_day_metrics.csv" errors={result.errors} />
        )}
      </main>
    </>
  );
}

function Dashboard({
  result,
  view,
  anchor,
}: {
  result: Extract<LoadResult, { ok: true }>;
  view: RouteView;
  anchor?: string;
}) {
  const m = useMemo(() => buildModel(result.rows), [result.rows]);

  // On every route change: jump to the anchor (and pulse it), or start the new view at the top.
  useEffect(() => {
    if (!anchor) {
      // Instant: switching views is a page change, not a scroll.
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

      {/* Keyed by view so the entrance replays on navigation (DESIGN.md §7). */}
      <div className="view-in" key={view}>
        {view === 'all' && (
          <>
            <div className="view-group" id="view-health">
              <HealthView m={m} single />
            </div>
            <div className="view-group" id="view-trends">
              <TrendsView m={m} showEvents={false} />
            </div>
            <div className="view-group" id="view-plan">
              <PlanView m={m} />
            </div>
          </>
        )}
        {view === 'health' && <HealthView m={m} />}
        {view === 'trends' && <TrendsView m={m} />}
        {view === 'plan' && <PlanView m={m} />}
      </div>
    </>
  );
}
