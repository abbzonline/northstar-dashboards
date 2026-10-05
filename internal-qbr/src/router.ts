import { useEffect, useState } from 'react';

/** The three views of the internal dashboard, addressed by hash so back/forward and shared links work. */
export type ViewId = 'health' | 'trends' | 'plan';

export const VIEWS: { id: ViewId; label: string; description: string }[] = [
  { id: 'health', label: 'Account health', description: 'Customer score, top risks and headline metrics' },
  { id: 'trends', label: 'Performance trends', description: 'Daily adoption, spend, reliability, latency and quality' },
  { id: 'plan', label: 'Expansion plan', description: 'Brand pipeline, dependencies, risks, decisions and actions' },
];

export interface Route {
  view: ViewId;
  /** Element id to scroll to inside the view, e.g. "chart-latency". */
  anchor?: string;
}

/** "#/trends/chart-latency" -> { view: 'trends', anchor: 'chart-latency' }. Unknown hashes fall back to health. */
export function parseHash(hash: string): Route {
  const [view, anchor] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (VIEWS.some((v) => v.id === view)) return { view: view as ViewId, anchor };
  // Links from before views existed pointed straight at a chart: "#chart-latency".
  if (view?.startsWith('chart-')) return { view: 'trends', anchor: view };
  return { view: 'health' };
}

export const viewHref = (view: ViewId, anchor?: string) => `#/${view}${anchor ? `/${anchor}` : ''}`;

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
