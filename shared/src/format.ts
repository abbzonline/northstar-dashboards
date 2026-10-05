const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat('en-US', opts);

export const fmtInt = (x: number) => nf({ maximumFractionDigits: 0 }).format(x);
export const fmtCompact = (x: number) => nf({ notation: 'compact', maximumFractionDigits: 1 }).format(x);
export const fmtUsd = (x: number, dp = 0) =>
  nf({ style: 'currency', currency: 'USD', minimumFractionDigits: dp, maximumFractionDigits: dp }).format(x);
export const fmtPct = (x: number, dp = 1) => `${x.toFixed(dp)}%`;
export const fmtMs = (x: number) => (x >= 1000 ? `${(x / 1000).toFixed(2)} s` : `${Math.round(x)} ms`);
export const fmtSigned = (x: number, f: (n: number) => string) => `${x > 0 ? '+' : x < 0 ? '−' : '±'}${f(Math.abs(x))}`;

/** "2026-08-09" -> "Aug 9" without timezone drift. */
export function fmtDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
