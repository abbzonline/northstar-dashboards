import type { DailyMetric } from './schema';

export interface OpsEvent {
  date: string;
  note: string;
  /** Rough classification so markers can be coloured: incident vs improvement. */
  kind: 'incident' | 'change';
}

const INCIDENT_WORDS = /spike|outage|error|burst|degrad|incident|fail/i;

export function extractEvents(rows: DailyMetric[]): OpsEvent[] {
  return rows
    .filter((r) => r.operational_note)
    .map((r) => ({
      date: r.date,
      note: r.operational_note!,
      kind: INCIDENT_WORDS.test(r.operational_note!) ? 'incident' : 'change',
    }));
}
