/**
 * Guards the line between the internal and customer dashboards. Lives in internal-qbr so the
 * forbidden words below never appear inside customer-health/.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeHealth, loadMetrics } from '@northstar/shared';
import { JOINT_ACTIONS } from '../../customer-health/src/content';
import { ACTIONS } from './plan';

const CUSTOMER_DIR = resolve(__dirname, '../../customer-health');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'dist') return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

describe('customer-health stays customer-safe', () => {
  const files = sourceFiles(CUSTOMER_DIR).filter((f) => /\.(ts|tsx|html|json)$/.test(f));

  it('never imports internal-qbr', () => {
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/internal-qbr/);
  });

  it('contains none of the internal-only vocabulary', () => {
    const forbidden = /judgements|COMPETITORS|confidence|margin|Profitability|Partnership/i;
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(forbidden);
  });

  it('scores the four measured pillars only, ~3.58 with weights redistributed', () => {
    const csv = readFileSync(resolve(__dirname, '../../data/northstar_flagship_30_day_metrics.csv'), 'utf8');
    const loaded = loadMetrics(csv);
    if (!loaded.ok) throw new Error('fixture failed to load');
    const health = computeHealth(loaded.rows, {});
    expect(health.pillars.map((p) => p.letter)).toEqual(['R', 'A', 'M', 'U']);
    expect(health.score).toBeCloseTo(3.58, 2);
  });

  it('joint actions match internal actions on owner and due date', () => {
    for (const a of JOINT_ACTIONS) {
      const match = ACTIONS.find((i) => i.due === a.due && i.owner === a.owner);
      expect(match, `${a.due} · ${a.owner}`).toBeDefined();
    }
  });
});
