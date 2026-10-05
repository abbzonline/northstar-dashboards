import { fmtPct, fmtSigned, fmtUsd } from '@northstar/shared';

export const pctChange = (x: number) => fmtSigned(x * 100, (n) => `${n.toFixed(0)}%`);
export const ppChange = (x: number) => fmtSigned(x, (n) => `${n.toFixed(1)} pts`);
export const fmtPct2 = (x: number) => fmtPct(x, 2);
export const fmtUsd2 = (x: number) => fmtUsd(x, 2);
