import Papa from 'papaparse';
import { NUMERIC_COLUMNS, REQUIRED_COLUMNS, type DailyMetric } from './schema';

export type LoadResult = { ok: true; rows: DailyMetric[] } | { ok: false; errors: string[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse and validate the raw CSV text. Never throws; problems come back as `errors`. */
export function loadMetrics(csvText: string): LoadResult {
  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const columns = parsed.meta.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length) return { ok: false, errors: [`Missing column(s): ${missing.join(', ')}`] };

  const errors: string[] = parsed.errors.map((e) => `Row ${(e.row ?? 0) + 2}: ${e.message}`);
  const rows: DailyMetric[] = [];

  parsed.data.forEach((raw, i) => {
    const line = i + 2; // header is line 1
    const date = raw.date?.trim();
    if (!ISO_DATE.test(date ?? '')) {
      errors.push(`Line ${line}: date "${raw.date}" is not yyyy-mm-dd`);
      return;
    }
    const row: Partial<DailyMetric> = {
      date,
      deployment: raw.deployment?.trim() ?? '',
      operational_note: raw.operational_note?.trim() || null,
    };
    for (const col of NUMERIC_COLUMNS) {
      const value = Number(raw[col]);
      if (raw[col] === undefined || raw[col].trim() === '' || !Number.isFinite(value)) {
        errors.push(`Line ${line}: ${col} "${raw[col] ?? ''}" is not a number`);
        return;
      }
      row[col] = value;
    }
    rows.push(row as DailyMetric);
  });

  if (errors.length) return { ok: false, errors };
  if (!rows.length) return { ok: false, errors: ['The CSV has a header but no data rows'] };

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { ok: true, rows };
}
