import { useEffect, useState } from 'react';

/** Views of the customer dashboard, addressed by hash so back/forward and shared links work. */
export type ViewId = 'outcomes' | 'service' | 'quality' | 'spend' | 'next-steps';

export const VIEWS: { id: ViewId; label: string; description: string }[] = [
  { id: 'outcomes', label: 'Outcomes', description: 'Operational health, headline metrics and usage trends' },
  { id: 'service', label: 'Service reliability', description: 'Availability, errors, latency and known caveats' },
  { id: 'quality', label: 'Answer quality', description: 'Grounding, evaluation, escalations, CSAT and handle time' },
  { id: 'spend', label: 'Spend', description: 'Daily and cumulative spend, unit cost and budget context' },
  { id: 'next-steps', label: 'Next steps', description: 'Pilot proposal, dependencies and joint actions' },
];

/** "all" stacks every view on one page (the "Single page" switch). */
export type RouteView = ViewId | 'all';

export interface Route {
  view: RouteView;
  anchor?: string;
}

/** "#/service/chart-latency" -> { view: 'service', anchor: 'chart-latency' }. Unknown hashes fall back to outcomes. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const view = parts[0];
  if (view === 'all') return { view: 'all', anchor: parts[1] };
  if (VIEWS.some((v) => v.id === view)) return { view: view as ViewId, anchor: parts[1] };
  return { view: 'outcomes' };
}

export const viewHref = (view: RouteView, anchor?: string) => `#/${view}${anchor ? `/${anchor}` : ''}`;

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
