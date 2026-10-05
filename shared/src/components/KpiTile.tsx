import { CountUp } from './CountUp';

export interface KpiTileProps {
  label: string;
  value: string;
  /** e.g. "+64% vs week 1" */
  delta?: string;
  /** true = movement is good, false = bad, null/undefined = neutral */
  deltaGood?: boolean | null;
  sub?: string;
  /** In-page anchor of the chart this metric drills into, e.g. "#chart-latency". */
  href?: string;
  /** Count the value's numbers up once on mount (customer view, DESIGN.md §7). */
  animate?: boolean;
}

export function KpiTile({ label, value, delta, deltaGood, sub, href, animate = false }: KpiTileProps) {
  const tone = deltaGood == null ? 'neutral' : deltaGood ? 'good' : 'bad';
  const body = (
    <>
      <div className="kpi__label">
        {label}
        {href && (
          <span className="kpi__arrow" aria-hidden="true">
            →
          </span>
        )}
      </div>
      <div className="kpi__value">{animate ? <CountUp value={value} /> : value}</div>
      {delta && <div className={`kpi__delta kpi__delta--${tone}`}>{delta}</div>}
      {sub && <div className="kpi__sub">{sub}</div>}
    </>
  );
  return href ? (
    <a className="kpi kpi--link" href={href} aria-label={`${label}: ${value}. View trend chart`}>
      {body}
    </a>
  ) : (
    <div className="kpi">{body}</div>
  );
}
