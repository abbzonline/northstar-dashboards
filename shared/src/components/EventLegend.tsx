import type { OpsEvent } from '../data/events';
import { fmtDay } from '../format';

/** Explains the dashed vertical markers that appear on every chart. */
export function EventLegend({ events }: { events: OpsEvent[] }) {
  if (!events.length) return null;
  return (
    <div className="events">
      <span className="eyebrow">Operational events</span>
      <ul>
        {events.map((e) => (
          <li key={e.date}>
            <span className={`events__mark events__mark--${e.kind}`} />
            <span className="label events__date">{fmtDay(e.date)}</span>
            <span>{e.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
