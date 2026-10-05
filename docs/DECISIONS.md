# Decision log

The decisions behind the Northstar dashboards: what was chosen, why, and what was rejected. Newest at the bottom. Each future decision gets a row here, and the commit that implements it explains the reasoning in its message.

Scoring-specific detail (bands, sources, formulas) lives in [RAMPUP.md](RAMPUP.md).

## Scope and structure

| # | Date | Decision | Why | Rejected alternative |
|---|---|---|---|---|
| 1 | 2026-10-04 | Build the internal QBR (Deliverable 1) first, as a basic MVP, then layer up | Get a working, runnable base early; iterate on content once the shell is right | Building all three deliverables in parallel |
| 2 | 2026-10-04 | **Two separate dashboards**, not one app with two views | No need to manage access control per user: the customer app simply never contains internal data | One app with role-based views |
| 3 | 2026-10-04 | React + Vite + TypeScript, Recharts, PapaParse; npm workspaces with a `shared/` package | Mainstream, runs with `npm install` and nothing else; the customer app reuses data loading, theme and charts | Streamlit/Dash (less control over the Fireworks design) |
| 4 | 2026-10-04 | Convert the supplied `.xlsx` to the CSV the brief names; bundle it at build time | The brief refers to a CSV; bundling means no runtime fetch can fail; a bad CSV shows an error panel | Reading the xlsx directly |

## Design

| # | Date | Decision | Why | Rejected alternative |
|---|---|---|---|---|
| 5 | 2026-10-04 | Match fireworks.ai exactly: colour tokens, fonts and header frame from the site's own CSS/HTML | The audience is Fireworks; fidelity signals seriousness | An approximate "Fireworks-ish" palette |
| 6 | 2026-10-04 | Use the actual Favorit font file (licensed, Dinamo), documented in `shared/src/theme/fonts/FONTS.md` | Exact match to the site's labels | Open-source lookalike; hotlinking from fireworks.ai |
| 7 | 2026-10-04 | Official Fireworks logo SVG in a 1392px framed header with hairline side rules | Mirrors the site's layout at every screen width | Text wordmark |
| 8 | 2026-10-04 | Badge reads "Internal use only", with square corners | Clear audience marker; square corners match the site's buttons | "Internal · Fireworks only" pill |
| 9 | 2026-10-05 | Only one off-brand colour: amber for the "Watch" status | The Fireworks palette has no yellow/amber | Repurposing a brand colour for warning |

## Page content

| # | Date | Decision | Why | Rejected alternative |
|---|---|---|---|---|
| 10 | 2026-10-05 | Eight clickable headline tiles (requests/day, handle time, CSAT, spend, availability, P50/P95, eval pass, escalation), each jumping to its chart | All the headline metrics at a glance, with the evidence one click away | Five summary tiles |
| 11 | 2026-10-05 | Under the title: model ID on the left, date range on the right; no "comparisons" note | The comparison is implied by the results | Listing deployment, period and comparison basis in one row |
| 12 | 2026-10-05 | Scenario: Northstar is an outerwear-fashion holding company; flagship brand **Atlas**; model `northstar-atlas-support-ft-v1` | The brief leaves the brand unnamed; a concrete scenario makes the expansion story tangible | Generic "flagship brand" wording |
| 13 | 2026-10-05 | No outbound links and no obscure source names on the dashboard; methodology prose lives in docs, not on the page | The internal page should be facts and evidence; explanations belong in the guidance docs | Inline citations and explanatory paragraphs on the page |
| 24 | 2026-10-05 | Remove the Benchmark column from the RAMP UP metric table; sources live only in `docs/RAMPUP.md` | Keeps the table to value, score and bands; follows #13 (provenance in guidance, not on the page) | Plain-text source column on the dashboard |

## Account health (RAMP UP)

| # | Date | Decision | Why | Rejected alternative |
|---|---|---|---|---|
| 14 | 2026-10-05 | Health framework **RAMP UP**: Reliability, Adoption, Model quality, Partnership, User outcomes, Profitability; adapted from GitLab's PROVE | One letter per pillar and mutually exclusive; covers everything PROVE does plus inference-specific pillars | First draft "Risks to Adoption / Management Risks / Performance / User XP" (mixed polarity, no outcomes pillar) |
| 15 | 2026-10-05 | Weights R/A/M/U 20% each, the two Ps 10% each; every pillar and band scored out of 5 | Judgement pillars get half weight so evidence dominates | Equal weights |
| 16 | 2026-10-05 | Score on **full-period averages**, not the last 7 days; tiles use the same basis; trends shown as a separate change line | "Fair to the numbers rather than flattering and volatile" | Trailing 7-day window (scored ≈ 4.0 Healthy vs 3.6 Watch) |
| 17 | 2026-10-05 | M and U benchmarks from primary sources: Microsoft Foundry evaluators, RAGAS CI gates, Freshworks Benchmark 2025 (retail conversations), Salesforce State of Service 2025 | Every number must survive "why should I believe this?" | Vendor-marketing and SEO statistics blogs |
| 18 | 2026-10-05 | Availability bands: 99.9% = 5, then 0.2-point steps | Team standard | Anchoring to Fireworks' 99.99% SLA (would score 99.85% as a 2) |
| 19 | 2026-10-05 | Escalation is scored in U as first-contact resolution (100% − escalation) | Direct Freshworks benchmark; keeps M purely about answer correctness | Scoring escalation in M |
| 20 | 2026-10-05 | **Partnership = 2** | Live on one brand of five; buy-in from the rest of the business is still needed | 3 ("lukewarm") |
| 21 | 2026-10-05 | ~~**Profitability = 5** (value to the customer)~~ (superseded by #30) | About $1.2k of inference replaced roughly 12,550 agent-hours of Tier-1 work in August | — |
| 22 | 2026-10-05 | ~~Status bands out of 5: Healthy ≥ 3.75, Watch ≥ 2.50, At risk below~~ (superseded by #26) | Same scale as the scores (GitLab's 75% / 50% cut-offs) | Percentages |
| 25 | 2026-10-05 | CSAT yardstick switched to Salesforce: 85 = 5, 70 = 4, 60 = 3, 50 = 2, below 50 = 1. CSAT 82.3 now scores 4 (was 2), U rises to 4.0 and the overall to 3.77, Healthy by 0.02 | Salesforce: "above 70% is considered a good customer satisfaction score", "below 50%" is less desirable, 78% average. Freshworks' retail tiers come from human-agent chat surveys and are too harsh a yardstick here | Freshworks retail conversation tiers (Aspirant 90.4%) |
| 26 | 2026-10-05 | Status bands: Healthy ≥ 4, Positive-Watch 3–3.99, Negative-Watch 2–2.99, At risk < 2. Supersedes #22. Atlas (3.77) is Positive-Watch. The overall score is shown to 2 decimals so it never reads "4.0" beside a Positive-Watch badge | Whole-number edges on the 1–5 scale are easy to read; splitting Watch shows whether an account is leaning healthy or leaning at-risk. "At risk" is the standard customer-success term for likely churn | #22's three bands (Healthy ≥ 3.75 / Watch ≥ 2.50) |
| 27 | 2026-10-05 | "Top risks" button at the bottom-left of the score column opens a pop-up (page blurred behind) listing the 3 lowest-rated items: every metric plus the two judgement pillars, lowest score first, ties broken by how much one band of improvement adds to the overall score. Internal view only | Focuses the QBR on what to fix; the tie-break puts the highest-leverage item first; facts only (current value, next-band target, uplift) | Ranking pillars rather than items; showing risks inline on the page |
| 28 | 2026-10-05 | Top risks = the three items **furthest from a perfect 5**, ranked by exact position within each band; the "+x overall per band" line is removed. Result: Partnership, P50 latency, P95 latency. Refines #27 | Whole-number scores tie (five items at 3); exact position is the literal distance from 5 and needs no extra figure on the page | Tie-break by uplift to the overall score (#27); ranking whole pillars |
| 29 | 2026-10-05 | Each Top-risks item shows Current, **For a [next band]** and **For a 5** thresholds (only "For a 5" if already a 4) | Shows both the next step and what perfect looks like; labelling by the score earned reads more naturally than "next band" / "top band" | A single "Next band" target |
| 30 | 2026-10-05 | **Profitability inverted to Fireworks' view and scored 1.** Overall 3.77 → 3.37 (still Positive-Watch); Profitability becomes the #1 top risk. Supersedes #21 | About $14k a year is ~0.001% of a $1B+ run rate and doesn't move the needle; month one needed three hands-on interventions. Customer value is already reflected in U and belongs in the EBR. Makes the commercial gap a visible focus area | Customer-ROI framing (score 5); scoring Fireworks' view as a 2 |
| 31 | 2026-10-05 | Professional account-planning language for judgement rationales. Profitability framed as "current revenue is immaterial relative to the revenue ceiling across Northstar; Atlas is a proof of concept for rollouts across the other four brands, which carry significantly higher customer volumes". No share-of-run-rate figure | An internal dashboard is read by leadership; blunt phrasing reads as unprofessional. The proof-of-concept framing points straight at the expansion decision | "Doesn't move the needle for a $1B+ run-rate company"; 0.0014% of run rate |
| 32 | 2026-10-05 | **Scaling architecture:** one open-weight base, one shared "Northstar support" fine-tune, five brand LoRA adapters served multi-LoRA on one deployment, five isolated RAG indexes, five system prompts. Pilot runs two arms (prompt + RAG only vs adapter). Atlas migrates last, shadow-tested before cutover. Full plan in [ARCHITECTURE.md](ARCHITECTURE.md) | Each brand has its own catalogue, tone, return policies, tooling and team (brief). A prompt can't cleanly override a fine-tune's learned tone and policy; five full fine-tunes scale maintenance linearly and the smaller brands lack data. Multi-LoRA is Fireworks-native and shares one deployment's cost | Reusing the Atlas fine-tune with brand prompts; five separate full fine-tunes |
| 33 | 2026-10-05 | Profitability evidence reworded: cost to serve framed as month-one hypercare plus per-brand support load; "shared model" replaced by the per-brand adapter/RAG/prompt design; deployment economics added (LoRA needs dedicated deployments, so multi-brand sharing is what makes it viable) | The brief says each brand differs; "on a shared model" contradicted it. Fireworks docs confirm LoRA serving is dedicated-only, which ties profitability to the architecture | Per-token serverless pricing assumption (not supported for LoRA per docs) |
| 34 | 2026-10-05 | **Atlas is a LoRA adapter on an open-weight base, trained on Atlas only.** Each sister brand gets its own LoRA on the same base; no shared "Northstar support" fine-tune layer. Pilot cheap arm becomes base + prompt + RAG (no adapter). Biggest risk becomes moving Atlas's adapter onto the shared multi-LoRA deployment (latency), not retiring it. Refines #32 | Matches how the current model was built; removes the open question of stacking adapters on a fine-tune; an Atlas-only adapter would leak Atlas tone and policy, so it isn't a credible cheap arm | A shared brand-agnostic fine-tune layer; reusing the Atlas adapter in the pilot |

## Repository

| # | Date | Decision | Why | Rejected alternative |
|---|---|---|---|---|
| 23 | 2026-10-05 | Private GitHub repo containing only `northstar-dashboards/` | Tracks decisions over time; private because of the licensed Favorit font and live application work | Public repo; including the whole working folder |
