import { useEffect, useState } from 'react';

const NUMBER = /\d[\d,]*(?:\.\d+)?/g;

/**
 * Rewrites every number inside a formatted string at progress `t` (0–1), keeping each number's
 * decimal places and thousands separators: ("605 ms / 1.66 s", 0.5) -> "303 ms / 0.83 s".
 * At t = 1 the original string is returned unchanged, so the final frame is always exact.
 */
export function interpolateNumbers(text: string, t: number): string {
  if (t >= 1) return text;
  return text.replace(NUMBER, (match) => {
    const grouped = match.includes(',');
    const decimals = match.includes('.') ? match.split('.')[1].length : 0;
    const value = Number(match.replace(/,/g, '')) * Math.max(0, t);
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouped,
    });
  });
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Counts the numbers in `value` up from zero once, on mount (DESIGN.md §7, L1).
 * Renders the exact value immediately when the user prefers reduced motion.
 */
export function CountUp({ value, duration = 700 }: { value: string; duration?: number }) {
  const [t, setT] = useState(() => (prefersReducedMotion() ? 1 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setT(1);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setT(p >= 1 ? 1 : easeOutCubic(p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Once per mount: views remount on navigation, which is when the count should replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span aria-label={value}>
      <span aria-hidden="true">{interpolateNumbers(value, t)}</span>
    </span>
  );
}
