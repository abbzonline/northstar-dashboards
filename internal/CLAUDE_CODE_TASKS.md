# Remaining work: instructions for Claude Code

Read `FIREWORKS_CONTEXT.md` (repo root) and `docs/ARCHITECTURE.md` first. Do the tasks in this order; stop polishing the internal view. Deadline is today.

Every pricing figure used anywhere must come from the fact table at the top of `docs/ARCHITECTURE.md` (checked 5 Oct 2026). Do not introduce any other number for GPU rates, training cost or serving markup. If you need a figure that is not in that table, write "assumed" next to it.

---

## Task 1: `customer-health/` app (Deliverable 2)

Create `customer-health/` as a second npm workspace, cloned from `internal-qbr/` structure (`index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `src/router.ts`, views). Add it to the root `package.json` workspaces and add scripts `dev:customer` (port 5174) and `preview:customer` (port 4174), and extend `build` and `typecheck` to cover both apps.

**Hard rules**
- Never import `internal-qbr/src/judgements.ts`, `internal-qbr/src/plan.ts`, or anything that mentions margin, competitors, confidence, Fireworks' profitability, stakeholder status, or internal decisions. Grep the customer app for `judgements|COMPETITORS|confidence|margin|Profitability|Partnership` before committing; the result must be empty.
- No "Internal use only" badge. Header badge reads `Prepared for Northstar Retail Group`.
- Reuse `@northstar/shared` for data loading, derived metrics, theme, `KpiTile`, `TrendChart`, `ChartCard`, `Section`, `EventLegend`, `HealthPanel`. Do not fork the shared package.

**Views (hash-routed like the internal app)**
1. `#/outcomes` (default): headline tiles for Tier-1 automation (month avg 67.9%, final week 70.1%, with the note "70% reached from 27 Aug"), handle time (7.74 min avg, week 1 → week 4; label the brief's −35% as "vs pre-launch baseline, supplied by Northstar"), CSAT (82.3 avg; +12 pts "vs pre-launch baseline, supplied by Northstar"), requests/day, availability, P50/P95, eval pass, escalation. Same first-week vs last-week comparison basis as the internal view.
2. `#/service`: availability vs 99.9% target (labelled "proposed target; no SLA in place for August"), error rate, P50/P95 with the three operational events shown and explained in plain customer language (catalogue sync, promotion traffic, RAG refresh). Add a "Known caveats" card: (a) 99.9% was met on 4 of 31 days. Reaching it on Atlas alone would mean paying for an always-on replica (roughly 4–7x the current bill) for about 22 minutes a month of availability, so we recommend keeping the current scale-to-zero set-up, retuning scale-up thresholds and pre-warming before promotions; 99.9% becomes affordable on the shared deployment once more brands are live; (b) requests per ticket rose from 4.6 to 6.2 over the month, which we want to review jointly; (c) headline −35% / +12 figures depend on Northstar's pre-launch baselines, which are not in this dataset.
3. `#/quality`: grounding, eval pass, escalation; CSAT and handle time. Use the same charts as the internal trends view.
4. `#/spend`: daily and cumulative spend, cost per 1k requests, and a "Budget context" card: August $1,213; current run-rate ~$1.4k/month at August's traffic; note that an always-on replica for 99.9% availability would move this to approx. $5.8k/month ($8.8k with EU-only placement) and that we do not recommend it for Atlas alone; the shared five-brand deployment carries that floor at approx. $1.2k–1.8k per brand, which is when 99.9% becomes efficient. Use the constants from `ARCHITECTURE.md`.
5. `#/next-steps`: the pilot proposal (Ridgeline, two arms, success criteria from `ARCHITECTURE.md`), the Northstar-owned dependencies (transcripts, catalogue export, legal sign-off on de-branded Atlas transcripts, routing-layer traffic split), and joint next actions with owners on both sides and dates from `plan.ts` `ACTIONS` **filtered to those whose owner includes a Northstar party or "Deployment Strategist"**; drop any action that mentions Fireworks-internal decisions (capacity reservation, commercial structure).

**Health score on the customer view**
- Use `HealthPanel` with the four measured pillars only (R, A, M, U). The judgement pillars are absent, so `rampup.ts` redistributes their weight; verify the result is ~3.83.
- Do **not** show the status band label ("Positive-Watch"). Show the overall number and the four pillar scores with the label "Operational health, 1–5". Hide the Focus areas button (`HealthPanel` already has a prop for this).

**Screenshots**: after it runs, take full-page screenshots of each view at 1440px wide into `docs/screenshots/customer-*.png`, and regenerate the internal ones into `docs/screenshots/internal-*.png` (health, trends, plan, focus-areas dialog).

---

## Task 2: EBR deck (Deliverable 3), 7 slides, `ebr/Northstar_EBR_Oct2026.pptx`

Build with the pptx skill. Fireworks tokens from `shared/src/theme/tokens.ts`. Every number must match the customer dashboard. No internal content (no margin, no competitors, no confidence, no Fireworks profitability).

1. **Month one on Atlas.** Three outcomes with caveats in the same breath: automation 67.9% avg → 70.8% exit (70% from 27 Aug); handle time 8.05 → 7.41 min in-month, −35% vs Northstar's pre-launch baseline; CSAT 80.8 → 83.7, +12 vs baseline. Availability 99.85% with the 9 and 21 Aug events named.
2. **What the numbers mean.** Automation is still rising; quality rose every week (grounding 92 → 96, eval pass 91 → 95, escalations 14 → 11.5); availability missed a 99.9% bar on most days and the fix has a cost (next slide). Requests per ticket 4.6 → 6.2: flag for joint review, not alarm.
3. **Reliability and cost, honestly.** Scale-to-zero explains both the low August bill and the availability misses. An always-on replica would cost ~$5.8k/month ($8.8k EU-only) for ~22 minutes a month of availability; we recommend against it on Atlas alone. Now: retune scale-up thresholds and pre-warm before promotions. The warm floor, and 99.9%, arrive with the shared five-brand deployment at ~$1.2k–1.8k per brand.
4. **Expand, and how.** One base, one adapter per brand (Atlas unchanged), one isolated RAG index and prompt per brand, served from one shared deployment; Halden moves to its own deployment when its volume justifies it. Data isolation sits at the RAG and adapter layer. Why not reuse Atlas with a prompt; why not five separate models (one sentence each).
5. **Pilot: Ridgeline.** Two arms (prompt+RAG only vs adapter). Success = grounding ≥ 95%, eval pass ≥ 93%, escalation ≤ 12%, CSAT ≥ Atlas week-4, P95 ≤ 1.3 s through one promo peak, over 4 weeks. Evidence that justifies wave 2 = arm chosen on quality, and Northstar baselines captured before launch this time.
6. **Sequence and budget.** Oct: EBR, sponsor, dependencies. Nov: shared deployment stood up, Atlas parity, Ridgeline adapter. Nov–Dec: pilot. Jan: readout, wave-2 go/no-go. Q1 2027: Halden and Polar. Q2: Harbour & Hide. Budget: pilot window ~$5.8k–8.8k/month for the shared deployment plus training tokens (immaterial); steady state one floor shared, second floor when Halden moves. Parallel-run overlap budgeted in weeks.
7. **Biggest risk and talking points.** Risk: group-level approval isn't secured, so the shared deployment never reaches the utilisation that justifies it. Mitigation: sponsor at this EBR, pilot criteria agreed jointly, warm floor tied to a committed second brand. Five talking points, one line each.

Export a PDF copy alongside the pptx.

---

## Task 3: design document, `docs/DESIGN.md` (submission item 3)

Short. Sections in this order, each a few sentences plus the screenshot: internal QBR screenshots; customer dashboard screenshots; audience and purpose of each view; why these metrics and charts; how the score is calculated (summarise `RAMPUP.md`, link it); internal vs customer differences (table: item / internal / customer); what was intentionally excluded from each view; assumptions, caveats, trade-offs (pull from `ARCHITECTURE.md` "Current state" and "Open items", plus the pricing-date caveat). Link `DECISIONS.md` as an appendix; do not paste it in.

---

## Task 4: README and zip

- README: add the customer app to the table and quick start (`npm run dev:customer`, port 5174), and the two-app `build`/`preview` commands. State Node ≥ 20, tested on 22 and 24. Keep "no env vars, no network after install".
- Put the CSV where the README says. Confirm `npm ci && npm run build && npm test` is clean from a fresh clone.
- Zip the repo without `node_modules`, `dist`, `.git`: `northstar-dashboards.zip` containing code, `data/`, `docs/` (with screenshots), `ebr/`, README. No credentials anywhere (grep for `KEY`, `TOKEN`, `secret` before zipping).
