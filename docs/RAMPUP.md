# RAMP UP: account-health scoring

RAMP UP is the account-health score on the internal QBR dashboard. It is adapted from GitLab's PROVE framework ([GitLab handbook: customer health scoring](https://handbook.gitlab.com/handbook/customer-experience/customer-health-scoring/)) for an AI-inference account.

The code lives in [`shared/src/health/rampup.ts`](../shared/src/health/rampup.ts) (pillars, bands and scoring) and [`internal-qbr/src/judgements.ts`](../internal-qbr/src/judgements.ts) (the two judgement scores). If this document and the code disagree, the code is what runs; update both together.

## The pillars

| | Pillar | Question it answers | Weight | Scored by |
|---|---|---|---|---|
| **R** | Reliability | Is the platform up, error-free and fast? | 20% | Measured |
| **A** | Adoption | Is Northstar putting more of its support load on the model? | 20% | Measured |
| **M** | Model quality | Are the answers right? (offline evaluation) | 20% | Measured |
| **P** | Partnership | How committed is Northstar beyond the first deployment? | 10% | Judgement |
| **U** | User outcomes | What did Northstar's shoppers experience? | 20% | Measured |
| **P** | Profitability | Is the value delivered worth well more than the spend? | 10% | Judgement |

Design principles:
- **One letter, one pillar.** The pillars are mutually exclusive, and every pillar is scored so that higher means healthier.
- **Measured vs judgement.** Measured pillars carry 80% of the weight, so most of the score rests on evidence. The two P pillars are judgement calls by the account team.
- **Internal vs customer views.** Both P pillars are internal only, because the brief says not to show internal sentiment or commercial judgement to the customer. The customer dashboard shows R, A, M and U only.
- **Coverage.** RAMP UP covers everything PROVE does: Product maps to Adoption; Risk and Engagement map to Partnership; Outcomes and Voice of the Customer map to User outcomes. It adds the pillars an inference business needs: Reliability, Model quality and Profitability.

## Scoring rules

1. **Each metric scores 1–5** against benchmark bands. An edge value earns the higher score.
2. **Metrics use full-period averages** (all 31 days), not a trailing window. A strong final week can't flatter the score, and a single day can't swing it. The one exception is the volume trend: growth is inherently a comparison, so it compares the first 7 days with the last 7.
3. **Values are rounded to display precision before scoring**, so the number on screen is the number that was scored.
4. **A measured pillar's score** is the weighted mean of its metric scores. Metric weights are 1, except P50 and P95 latency at 0.5 each, so latency counts as one metric.
5. **Overall score** = Σ(pillar weight × pillar score), on a 1–5 scale.
6. **Status** is banded on the same 1–5 scale:

   | Score | Status |
   |---|---|
   | ≥ 4.00 | **Healthy** |
   | 3.00–3.99 | **Positive-Watch** |
   | 2.00–2.99 | **Negative-Watch** |
   | < 2.00 | **At risk** |
7. **Missing pillars:** if a pillar has no input (for example, judgements not supplied), its weight is shared among the remaining pillars, as in GitLab's model.

## Benchmarks

Bands give the threshold for scores 5, 4, 3 and 2; anything beyond the score-2 threshold scores 1.

### R: Reliability

| Metric | Direction | 5 | 4 | 3 | 2 | Source |
|---|---|---|---|---|---|---|
| Availability | higher | ≥ 99.9% | ≥ 99.7% | ≥ 99.5% | ≥ 99.3% | Fireworks team standard: 99.9% = 5, then 0.2-pt steps |
| Error rate | lower | ≤ 0.5% | ≤ 1% | ≤ 2% | ≤ 5% | Major LLM API providers run server-error rates of roughly 0.3–0.7% (Apr 2026 status-code data across providers) |
| P50 latency (×0.5) | lower | ≤ 300 ms | ≤ 500 ms | ≤ 800 ms | ≤ 1.2 s | Time-to-first-token UX: < 500 ms feels instant, > 2 s feels broken ([Particula](https://particula.tech/blog/llm-latency-targets-ttft-tokens-per-second-2026)) |
| P95 latency (×0.5) | lower | ≤ 1.0 s | ≤ 1.5 s | ≤ 2.0 s | ≤ 3.0 s | As above |

Notes:
- **Availability scale is lenient by design.** Fireworks sells a 99.99% enterprise SLA; anchored to that, 99.85% would score 2. The team standard above was chosen deliberately, and the stricter scale is the alternative if the internal view should be harsher.
- **Latency is assumed to be time-to-first-token.** Requests average about 1,045 input and 331 output tokens. Delivering 331 tokens end to end in about 600 ms would need about 550 tokens/s, which isn't plausible, so the latency columns must be time-to-first-token or server-side time.

### A: Adoption

| Metric | Direction | 5 | 4 | 3 | 2 | Source |
|---|---|---|---|---|---|---|
| Tier-1 automation | higher | ≥ 80% | ≥ 70% | ≥ 60% | ≥ 45% | Agreed bands. Context below |
| Request volume trend (first vs last 7 days) | higher | ≥ +10% | ≥ +2% | ≥ −2% | ≥ −10% | Internal rule |

Context for the automation bands:
- **Freshworks:** AI agents deflect 53% of retail queries, the highest of any industry ([Freshworks Customer Service Benchmark 2025](https://www.freshworks.com/assets/resources/Customer-Service-Benchmark-Report-2025.pdf)).
- **Salesforce:** 30% of service cases are AI-handled today, with 50% expected by 2027 ([Salesforce State of Service 2025](https://www.salesforce.com/in/news/stories/state-of-service-report-announcement-2025/), 6,500 service professionals).
- **Open question:** Northstar's 67.9% is already above both, which could justify a 5 rather than a 3.

### M: Model quality

| Metric | Direction | 5 | 4 | 3 | 2 | Source |
|---|---|---|---|---|---|---|
| Grounded answers | higher | ≥ 95% | ≥ 90% | ≥ 85% | ≥ 80% | RAGAS CI gates |
| Eval pass rate | higher | ≥ 95% | ≥ 90% | ≥ 85% | ≥ 80% | Microsoft Foundry agent evaluators |

Where the bands come from:
- **RAGAS:** its CI gates are answer relevancy ≥ 0.90 and context precision/recall ≥ 0.95 ([RAGAS: add to CI](https://docs.ragas.io/en/v0.2.8/howtos/applications/add_to_ci/)). Score 5 = clears the 0.95 gate; score 4 = clears the 0.90 gate. Scores 3 and 2 are our interpolation in 5-point steps.
- **Microsoft Foundry:** defines the evaluators: Groundedness, Intent Resolution, Task Adherence and Task Completion. Graded evaluators use a 1–5 scale with a default pass mark of 3, and the composite "Output Quality" passes only if every component passes ([Microsoft Foundry: agent evaluators](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators)).
- **Assumed definitions:** `grounded_answer_rate_pct` is the share of responses passing a Groundedness check. `quality_eval_pass_rate_pct` is a composite that passes only when every component passes, like Foundry's Output Quality.
- **Not used:** the RAGAS page also shows `faithfulness 0.4 ± 0.1`. That's a test that the score hasn't drifted, not a quality bar.

### U: User outcomes

Benchmarks:
- **CSAT:** [Salesforce: What is a customer satisfaction score?](https://www.salesforce.com/uk/service/customer-service-incident-management/customer-satisfaction-score/). "Typically, anything above 70% is considered a good customer satisfaction score"; "a less-desirable score is anything below 50%"; the cross-industry average is 78%. CSAT = satisfied or very satisfied respondents ÷ all respondents.
- **Handle time and first-contact resolution:** [Freshworks Customer Service Benchmark 2025](https://www.freshworks.com/assets/resources/Customer-Service-Benchmark-Report-2025.pdf), **Retail & eCommerce, conversational support**. The data covers 32,000+ companies and 138M conversations in 2024.

| Metric | Direction | 5 | 4 | 3 | 2 | Our proxy |
|---|---|---|---|---|---|---|
| CSAT | higher | ≥ 85 | ≥ 70 (Salesforce "good") | ≥ 60 | ≥ 50 (below = Salesforce "poor") | `csat_score` |

Freshworks tiers for the next two metrics: 5 = Trendsetter (top 20%), 4 = Performer (median), 3 = Aspirant.

| Metric | Direction | 5 | 4 | 3 | 2 | Our proxy |
|---|---|---|---|---|---|---|
| Avg handle time | lower | ≤ 2m 03s | ≤ 12m 07s | ≤ 1h 08m | ≤ 2h 00m* | `avg_handle_time_min` vs Freshworks *resolution time* |
| First-contact resolution | higher | ≥ 93.95% | ≥ 82.43% | ≥ 68.12% | ≥ 58.00%* | 100% − `escalation_rate_pct` |

\* Freshworks publishes three tiers. The score-2 band is our extension: about 10 points (or one step) below Aspirant.

Caveats:
- **CSAT bands:** 70 (good) and 50 (poor) come from Salesforce; 85 = 5 and 60 = 3 are the account team's placement on that scale. We assume `csat_score` is the % of satisfied responses.
- **Why not Freshworks for CSAT:** its retail tiers (Aspirant 90.4%) come from post-chat surveys on mostly human-agent conversations, a much harsher yardstick for an AI agent's first month.
- **Handle time vs resolution time:** Freshworks measures resolution time (elapsed time to resolve), not active handle time. It's the closest published equivalent.
- **Escalation moved pillars:** escalation is measured in U, as first-contact resolution, rather than in M. M asks "is the answer right"; U asks "what did the customer experience".

## Top risks

The internal view has a **Top risks** button that lists the three items **furthest from a perfect 5**:

- **Candidates:** every measured metric plus each judgement pillar. Anything already scoring 5 is excluded.
- **Order:** by exact distance from 5. A metric's exact position is its whole-number score plus how far its value has travelled through that band towards the next edge. Example: P50 at 605 ms sits 65% of the way from 800 ms (a 3) to 500 ms (a 4), giving 3.65, which is 1.35 from 5. Judgement pillars use their score as-is.
- **Shown per item:** current value and what the next band needs. Judgement items show their rationale.

Current ranking (Aug 2026):

| # | Item | Score | Exact position | Distance from 5 |
|---|---|---|---|---|
| 1 | Partnership (judgement) | 2 | 2.00 | 3.00 |
| 2 | P50 latency (R): 605 ms, needs ≤ 500 ms for a 4 | 3 | 3.65 | 1.35 |
| 3 | P95 latency (R): 1.67 s, needs ≤ 1.50 s for a 4 | 3 | 3.67 | 1.33 |
| — | Tier-1 automation (A): 67.9% | 3 | 3.79 | 1.21 |
| — | Error rate (R): 1.04% | 3 | 3.96 | 1.04 |

## Judgement pillars

Set by the account team in [`internal-qbr/src/judgements.ts`](../internal-qbr/src/judgements.ts).

| Pillar | Score | Rationale |
|---|---|---|
| Partnership | **2** | Live on one brand out of five. The flagship team is engaged, but the wider business hasn't bought in: the four sister brands have no commitment, sponsor or timeline. Next step is an executive sponsor above brand level at the EBR. |
| Profitability | **5** | The value delivered far exceeds the spend. In August, $1,213 of inference automated 97,488 Tier-1 tickets, roughly 12,550 agent-hours at the current handle time. A human team would cost many times more. **Caveat:** from Fireworks' side the account is small (about $15k annualised), so expansion is the commercial lever. |

## Current result (Aug 1–31, 2026, full-period averages)

| Pillar | Inputs → scores | Pillar score | Weighted |
|---|---|---|---|
| R | Availability 99.85% → 4 · errors 1.04% → 3 · P50 605 ms → 3 · P95 1.67 s → 3 | 3.33 | 0.67 |
| A | Automation 67.9% → 3 · volume +45% → 5 | 4.00 | 0.80 |
| M | Grounded 93.9% → 4 · eval pass 93.1% → 4 | 4.00 | 0.80 |
| P | Judgement | 2.00 | 0.20 |
| U | CSAT 82.3 → 4 · handle time 7.74 min → 4 · first-contact resolution 87.2% → 4 | 4.00 | 0.80 |
| P | Judgement | 5.00 | 0.50 |
| **Overall** | | **3.77 / 5 (Positive-Watch)** | |

What the score says:
- **Strengths:** adoption, model quality and user outcomes (all 4.0).
- **Weaknesses:** reliability, held back by the Aug 9 incident and averaging below 99.9%; and partnership, which needs buy-in beyond Atlas.
- **Status:** 3.77 is Positive-Watch, in the upper part of the band and 0.23 short of Healthy. Lifting reliability by one band (3.33 → 4.33) would get there.
- **For the expansion case:** "prove reliability on Atlas and win sponsorship across the group, then scale to the four other brands".

## Decision log

| Decision | Choice | Why |
|---|---|---|
| Framework | RAMP UP, one letter per pillar | More mutually exclusive than the first draft (Risks to Adoption / Management / Performance / User XP) |
| Weights | 20/20/20/10/20/10 | Judgement pillars get half weight |
| Scoring basis | Full-period averages | Fair to the numbers; trailing windows flatter and are volatile |
| Availability scale | 99.9 = 5, 0.2-pt steps | Team standard (stricter SLA-anchored alternative documented above) |
| M and U sources | Microsoft Foundry, RAGAS, Freshworks 2025, Salesforce 2025 | Primary, first-party sources instead of blog aggregators |
| Escalation | Scored in U as first-contact resolution | Has a direct Freshworks benchmark; keeps M purely about answer correctness |
| Status bands | Out of 5: Healthy ≥ 4, Positive-Watch ≥ 3, Negative-Watch ≥ 2, At risk < 2 | Same scale as the scores; splitting Watch shows which way an account is leaning |
| CSAT yardstick | Salesforce: 85 = 5, 70 = 4, 60 = 3, 50 = 2, below 50 = 1 | Salesforce's general good (70) / poor (50) guidance fits an AI agent better than Freshworks' human-chat retail tiers |
| Dashboard sources | Plain-text citations, no outbound links | Internal dashboard stays self-contained; full references live in this doc |
