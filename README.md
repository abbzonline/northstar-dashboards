# Northstar Retail Group: account health, QBR and EBR

Fireworks' account review of **Northstar Retail Group**'s fine-tuned support model on its flagship brand, **Atlas**, after one month in production, and the case for expanding to Northstar's four other brands.

## What's here

| Deliverable | Where | Audience |
|---|---|---|
| 1. Internal QBR dashboard | `internal-qbr/` (port 5173) | Fireworks account, engineering and leadership teams |
| 2. Customer health dashboard | `customer-health/` (port 5174) | Northstar VP Customer Experience and VP Engineering |
| 3. EBR deck: cover, 8 slides with speaker notes, closing page | `ebr/Northstar_EBR_Oct2026.pptx` (+ `.pdf`) | Northstar VP Customer Experience and VP Engineering |
| Design document, with screenshots | [`docs/DESIGN.md`](docs/DESIGN.md) | Reviewers |
| Health-score method and benchmarks | [`docs/RAMPUP.md`](docs/RAMPUP.md) | Reviewers |
| Scaling architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Reviewers |
| Every decision and why | [`docs/DECISIONS.md`](docs/DECISIONS.md) | Reviewers |

The two dashboards are **separate apps** sharing one data and design package (`shared/`), so internal commercial judgement can't reach the customer build. A test enforces it.

**The short version:**
- **Month one worked.** Tier-1 automation reached 70% by month end (67.9% August average), and quality improved every week.
- **Reliability is the gap: 99.85% availability, below 99.9% on 27 of 31 days.** The cause can't be read from daily metrics, so the plan is telemetry first, autoscaling retune second, and always-on capacity only if the evidence calls for it (cheap per brand once five brands share it).
- **Recommendation:** expand on one base model with an adapter, knowledge index and prompt per brand, piloting on Ridgeline first.
- **Account health:** 3.27 / 5 internally (Positive-Watch); 3.58 / 5 on the customer view, which scores operational pillars only.

## Quick start

Requirements: **Node.js ≥ 20**. Tested on Node 22.23 and 24.12 (npm 11) from a fresh clone. No environment variables, API keys or network access are needed after install.

```
cd northstar-dashboards
npm ci
npm run dev:internal
```

Open the internal QBR at **http://localhost:5173**. In a second terminal:

```
npm run dev:customer
```

Open the customer dashboard at **http://localhost:5174**.

Production build (type-checks both apps, then builds `internal-qbr/dist` and `customer-health/dist`):

```
npm run build
npm run preview:internal
npm run preview:customer
```

Previews serve at **http://localhost:4173** (internal) and **http://localhost:4174** (customer).

Tests: CSV validation, derived-metric reconciliation, scoring, routing, and the customer boundary.

```
npm test
```

These commands work as written in PowerShell, cmd and bash.

## Views

Each view is a shareable URL, chosen from the dropdown next to the Fireworks logo.

| App | View | URL | Contents |
|---|---|---|---|
| Internal | Account health | `#/health` | Customer score (RAMP UP, six pillars), Focus areas pop-up, eight headline metrics, operational events |
| Internal | Performance trends | `#/trends` | Nine daily charts; each headline tile opens its chart here |
| Internal | Single page | `#/all` | All three views stacked; the view menu becomes "Jump to" |
| Internal | Expansion plan | `#/plan` | Pipeline across four brands, top three risks, stakeholder coverage, dependencies / support burden / margin, competitive risk, decisions needed, next actions |
| Customer | Outcomes | `#/outcomes` | Operational health (four pillars), headline metrics, usage and adoption trends |
| Customer | Service reliability | `#/service` | Availability vs proposed 99.9% target, errors, latency, known caveats |
| Customer | Answer quality | `#/quality` | Grounding, eval pass, escalation; CSAT and handle time |
| Customer | Spend | `#/spend` | Daily and cumulative spend, unit cost, budget context |
| Customer | Next steps | `#/next-steps` | Ridgeline pilot proposal, Northstar's dependencies, joint actions |
| Customer | Single page | `#/all` | All five views stacked; the view menu becomes "Jump to" |

## Data

Both apps read **`data/northstar_flagship_30_day_metrics.csv`**: 31 daily rows, 1–31 Aug 2026, 20 columns.

- **Bundled at build time.** To use different data, replace that file (same columns) and restart the dev server or rebuild.
- **Bad data is reported, not hidden.** If a column is missing or a value won't parse, the page lists the exact problems instead of charts.
- **Source format.** The exercise supplied an `.xlsx` with the same columns. `scripts/xlsx_to_csv.py` is the one-off conversion (Python and pandas; only needed to regenerate the CSV).

## Assumptions

Full list in [`docs/DESIGN.md`](docs/DESIGN.md) §8 and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

- **Scenario:** Northstar is an outerwear-fashion holding company and Atlas its flagship brand. The dashboards show the model as `northstar-atlas-support-ft-v1`; the CSV's `deployment` column reads `northstar-flagship-support-ft-v1`. Set in `shared/src/account.ts`.
- **Sister brands:** Ridgeline, Halden, Polar and Harbour & Hide, with their volumes, catalogues and tooling, are invented. The brief's brand descriptions were not supplied.
- **Pre-launch baselines:** not in the data. The brief's −35% handle time and +12 CSAT are labelled as baseline comparisons supplied by Northstar.
- **99.9% availability:** a proposed target. No SLA was in place for August.
- **Billing:** `spend_usd` tracks tokens at a constant ~$1.12 per 1M: Atlas is billed per token today, and Northstar moves to paying for dedicated capacity on the multi-LoRA deployment. GPU utilisation can't be derived from token billing, so none is quoted.
- **Pricing:** fireworks.ai/pricing as of 5 Oct 2026. All code constants live in `shared/src/pricing.ts`.

## Project layout

```
data/             the CSV
shared/src/       data loading and validation, derived metrics, RAMP UP scoring, pricing constants, Fireworks theme, components
internal-qbr/     internal QBR app (Vite + React + TypeScript)
customer-health/  customer health app (same stack; never imports internal-qbr)
ebr/              EBR deck (.pptx, .pdf), its generator (source/) and the Inter fonts it uses (fonts/)
docs/             design document, screenshots, scoring method, architecture, decision log
scripts/          xlsx → csv conversion
```

Stack: React 18, Recharts 2, PapaParse, Vite 6, Vitest 3, TypeScript 5.7, npm workspaces.

**Typography:** Inter, the default font on fireworks.ai (open licence); see [`shared/src/theme/fonts/FONTS.md`](shared/src/theme/fonts/FONTS.md). The EBR deck uses the same Inter type scale, with the fonts embedded in the .pptx; `ebr/fonts/` holds the two weights (SIL OFL) for editing it.

## Known limitations

- **Daily data for one deployment:** there's no per-conversation drill-down.
- **Missing inputs:** pre-launch baselines, an SLA and the sister-brand descriptions were not supplied. Every figure that depends on them is labelled as an assumption.
- **Pricing can change:** on-demand rates changed on 1 Sep 2026 and may change again. Re-check before presenting.
- **The EBR deck is generated, not hand-made.** `ebr/source/build_ebr.js` computes every figure with the customer dashboard's own model (`figures.js` bundles it with esbuild), so the deck and dashboard can't disagree. Rebuild with `cd ebr/source && npm install && npm run build`, then `npm run finish` (Windows with PowerPoint) to embed Inter and export the PDF. The built `.pptx` and `.pdf` are committed.
