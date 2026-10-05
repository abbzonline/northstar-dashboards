# Northstar Retail Group: Fireworks dashboards

There are two dashboards for **Northstar Retail Group**'s support model on its flagship brand, **Atlas**. Each is a **separate app**, so internal commercial judgement can never leak into the customer view.

| App | Audience | Status |
|---|---|---|
| `internal-qbr/` | Fireworks account, engineering and leadership teams | **MVP:** 30-day adoption, spend, reliability, latency and quality trends |
| `customer-health/` | Northstar VP of Customer Experience and VP of Engineering | Not started |

The visual design follows fireworks.ai's own design tokens, taken from the site's CSS: brand purple `rgb(103,32,255)`, a `#FAF7FF` surface tint and `#E6EAF4` borders.

Typography matches the site exactly. **Inter** (variable) is used for titles, body copy and numbers. **Favorit** (weight 550, uppercase, 0.04em tracking) is used for labels. Favorit is a commercial Dinamo font, copied from fireworks.ai for this private submission only; see [`shared/src/theme/fonts/FONTS.md`](shared/src/theme/fonts/FONTS.md).

Every design and scoring decision, with its reasoning, is logged in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Quick start

Requirements: **Node.js ≥ 20** (built and tested on Node 24.12 / npm 11.6). No environment variables, API keys or network access are needed after install.

```
cd northstar-dashboards
npm install
npm run dev:internal
```

Then open the internal QBR at **http://localhost:5173**.

Production build. `build` type-checks and writes `internal-qbr/dist`; `preview:internal` serves it at **http://localhost:4173**:

```
npm run build
npm run preview:internal
```

These commands work as written in PowerShell, cmd and bash. Don't paste trailing `# comments` into Windows `cmd`, which passes them through as arguments.

Tests (CSV validation and derived-metric reconciliation):

```bash
npm test
```

## Data

The app reads **`data/northstar_flagship_30_day_metrics.csv`**: 31 daily rows, Aug 1–31 2026, with 20 columns.

- The CSV is bundled at build time. To use different data, replace that file (same columns) and restart `npm run dev:internal` or rebuild.
- If a column is missing or a value won't parse, the page shows the exact problems instead of charts.
- The exercise supplied an `.xlsx` with the same columns. `scripts/xlsx_to_csv.py` is the one-off conversion (Python and pandas; only needed to regenerate the CSV).

## What the internal QBR shows

- **RAMP UP score.** An account-health score adapted from GitLab's PROVE. The full method, every benchmark band with its source, and the decision log are in [`docs/RAMPUP.md`](docs/RAMPUP.md). It has six pillars, each scored 1–5:

  | Pillar | Weight | Scored by |
  |---|---|---|
  | **R**eliability | 20% | measured |
  | **A**doption | 20% | measured |
  | **M**odel quality | 20% | measured |
  | **P**artnership | 10% | account-team judgement |
  | **U**ser outcomes | 20% | measured |
  | **P**rofitability | 10% | account-team judgement |

  - **Measured metrics** are scored on their **full-period average** against published benchmarks: Freshworks Benchmark 2025 (retail conversations), RAGAS CI gates and Microsoft Foundry evaluators, plus the agreed reliability bands.
  - **Status** is out of 5, like the scores: Healthy ≥ 4, Positive-Watch 3–3.99, Negative-Watch 2–2.99, At risk < 2.
  - **Transparency:** expand any pillar to see its metrics, scores, bands and sources.
  - **Code:** the logic and bands are in `shared/src/health/rampup.ts`. The judgement scores are in `internal-qbr/src/judgements.ts`, which the customer view never imports.
- **KPI strip:** requests/day, spend, availability, P95 latency, eval pass rate. Each compares the last 7 days with the first 7 days.
- **Operational events:** the three `operational_note` entries (Aug 9, 21, 24). They appear as dashed markers on every chart, red for incidents and purple for changes, and their notes show in the tooltips.
- **Five sections:**

  | Section | Charts |
  |---|---|
  | Adoption | requests vs Tier-1 tickets; automation rate |
  | Spend | daily and cumulative spend; cost per 1k requests |
  | Reliability | availability vs target; error rate |
  | Latency | P50 and P95 |
  | Quality | grounding, eval pass and escalation; CSAT and handle time |

  Each chart has a one-line takeaway computed from the data.

## Assumptions

- **Scenario:** the brief doesn't name the brand. We assume Northstar is an outerwear-fashion holding company and Atlas is its flagship brand. The dashboard shows the model as `northstar-atlas-support-ft-v1`; the CSV's `deployment` column still reads `northstar-flagship-support-ft-v1`. Both are set in `internal-qbr/src/account.ts`.
- **99.9% availability target:** assumed. The brief gives no SLA, and the chart labels it as an assumption.
- **No pre-launch baseline:** the dataset has none. The brief's "−35% handle time / +12 CSAT" figures are versus pre-deployment and can't be recomputed from this data.

## Project layout

```
data/            the CSV
shared/src/      data loading/validation, derived metrics, Fireworks theme, chart components (reused by both apps)
internal-qbr/    the internal QBR app (Vite + React + TypeScript)
scripts/         xlsx → csv conversion
```

Stack: React 18, Recharts 2, PapaParse, Vite 6, Vitest 3, TypeScript 5.7. npm workspaces link `shared/` into each app.

## Known limitations

- Account-health score, risks, expansion pipeline, stakeholder map and actions are not built yet.
- The customer-facing dashboard is not built yet.
- The data is daily and covers one deployment. There's no per-conversation drill-down.
