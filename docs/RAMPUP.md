# RAMP UP: account-health scoring

RAMP UP is the account-health score on the internal QBR dashboard. It is adapted from GitLab's PROVE framework ([GitLab handbook: customer health scoring](https://handbook.gitlab.com/handbook/customer-experience/customer-health-scoring/)) for an AI-inference account.

The code lives in [`shared/src/health/rampup.ts`](../shared/src/health/rampup.ts) (pillars, bands and scoring) and [`internal-qbr/src/judgements.ts`](../internal-qbr/src/judgements.ts) (the two judgement scores). If this document and the code disagree, the code is what runs; update both together.

## The pillars

| | Pillar | Question it answers | Weight | Scored by |
|---|---|---|---|---|
| **R** | Reliability | Is the platform up, error-free and fast? | 20% | Measured |
| **A** | Adoption | Is Northstar putting more of its support load on the model? | 20% | Measured |
| **M** | Model quality | Are the answers right? | 20% | Measured |
| **P** | Partnership | How committed is Northstar beyond the first deployment? | 10% | Judgement |
| **U** | User outcomes | What did Northstar's shoppers experience? | 20% | Measured |
| **P** | Profitability | Is the account commercially worth it to Fireworks? | 10% | Judgement |

Design principles:
- **One letter, one pillar.** The pillars are mutually exclusive, and every pillar is scored so that higher means healthier.
- **Measured vs judgement.** Measured pillars carry 80% of the weight, so most of the score rests on evidence. The two P pillars are judgement calls by the account team.
- **Internal vs customer views.** Both P pillars are internal only, because the brief says not to show internal sentiment or commercial judgement to the customer. The customer dashboard shows R, A, M and U only.
- **Coverage.** RAMP UP covers everything PROVE does: Product maps to Adoption; Risk and Engagement map to Partnership; Outcomes and Voice of the Customer map to User outcomes. It adds the pillars an inference business needs: Reliability, Model quality and Profitability.
- **Profitability is Fireworks' view, not the customer's.** The value Northstar gets (agent-hours saved vs spend) is already reflected in User outcomes and belongs in the EBR and customer dashboard as the value story. Profitability scores what the account is worth to Fireworks, which is internal only.

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
| Availability | higher | ≥ 99.9% | ≥ 99.7% | ≥ 99.5% | ≥ 99.3% | Account-team bands (assumed; no SLA was supplied): 99.9% = 5, then 0.2-pt steps |
| Error rate | lower | ≤ 0.5% | ≤ 1% | ≤ 2% | ≤ 5% | Major LLM API providers run server-error rates of roughly 0.3–0.7% (Apr 2026 status-code data across providers) |
| P50 latency (×0.5) | lower | ≤ 300 ms | ≤ 500 ms | ≤ 800 ms | ≤ 1.2 s | Time-to-first-token UX: < 500 ms feels instant, > 2 s feels broken ([Particula](https://particula.tech/blog/llm-latency-targets-ttft-tokens-per-second-2026)) |
| P95 latency (×0.5) | lower | ≤ 1.0 s | ≤ 1.5 s | ≤ 2.0 s | ≤ 3.0 s | As above |

Notes:
- **Availability scale is lenient by design.** Fireworks sells a 99.99% enterprise SLA; anchored to that, 99.85% would score 2. The bands above are the account team's assumption, not a Fireworks standard; the stricter SLA-anchored scale is the alternative if the internal view should be harsher.
- **Latency is assumed to be time-to-first-token.** Requests average about 1,045 input and 331 output tokens. Delivering 331 tokens end to end in about 600 ms would need about 550 tokens/s, which isn't plausible, so the latency columns must be time-to-first-token or server-side time.

### A: Adoption

| Metric | Direction | 5 | 4 | 3 | 2 | Source |
|---|---|---|---|---|---|---|
| Tier-1 automation (automated Tier-1 tickets ÷ all Tier-1 tickets) | higher | ≥ 80% | ≥ 70% | ≥ 60% | ≥ 45% | Agreed bands. Context below |

**Why request volume is not scored.** Request volume measures consumption, not adoption. Requests per Tier-1 ticket rose from 4.6 to 6.2 over August, so volume can grow because the model makes more calls per ticket while the share of work entrusted to it stays flat. Scoring it would reward exactly that. Adoption is scored on automation penetration alone; automated-ticket volume is reported alongside it as context against total ticket volume (week 1 → final week: penetration 65.8% → 70.1%, automated tickets +15%, total tickets +8%).

Context for the automation bands:
- **Freshworks:** AI agents deflect 53% of retail queries, the highest of any industry ([Freshworks Customer Service Benchmark 2025](https://www.freshworks.com/assets/resources/Customer-Service-Benchmark-Report-2025.pdf)).
- **Salesforce:** 30% of service cases are AI-handled today, with 50% expected by 2027 ([Salesforce State of Service 2025](https://www.salesforce.com/in/news/stories/state-of-service-report-announcement-2025/), 6,500 service professionals).
- **Open question:** Northstar's 67.9% is already above both, which could justify a 5 rather than a 3.

### M: Model quality

| Metric | Direction | 5 | 4 | 3 | 2 | Source |
|---|---|---|---|---|---|---|
| Grounded answers | higher | ≥ 95% | ≥ 90% | ≥ 85% | ≥ 80% | Account-team quality gate |
| Eval pass rate | higher | ≥ 95% | ≥ 90% | ≥ 85% | ≥ 80% | Account-team quality gate |

**These bands are account-team quality gates, anchored to common evaluation-framework practice.** No framework publishes a scale saying 95% of requests passing is excellent and 90% is good; the 5-point scale is ours. What the frameworks do supply:
- **RAGAS** shows an example CI configuration that gates on answer relevancy ≥ 0.90 and context precision/recall ≥ 0.95 ([RAGAS: add to CI](https://docs.ragas.io/en/v0.2.8/howtos/applications/add_to_ci/)). It is an example of where teams set release gates, not an industry benchmark. We borrowed 0.95 and 0.90 as the edges of 5 and 4; 85% and 80% for 3 and 2 are our interpolation in 5-point steps.
- **Microsoft Foundry** supplies the *structure*, not the thresholds: separate component evaluators (Groundedness, Intent Resolution, Task Adherence, Task Completion) on a 1–5 scale with a default pass mark of 3, and a composite Output Quality that passes only when every applicable component passes ([Microsoft Foundry: agent evaluators](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/agent-evaluators)). It does not say what share of requests passing earns a given score.
- **Why two metrics:** they measure different things. Grounding asks whether the answer stayed supported by the available knowledge; eval pass asks whether the whole response met the task-quality bar. Both are direct measures of the model, unlike CSAT or escalation, which sit in User outcomes.
- **Assumed definitions:** `grounded_answer_rate_pct` is the share of responses passing a groundedness check. `quality_eval_pass_rate_pct` is a composite that passes only when every component passes, structured like Foundry's Output Quality.
- **Not used:** the RAGAS page also shows `faithfulness 0.4 ± 0.1`. That's a test that the score hasn't drifted, not a quality bar.
- **To firm up:** the gates should be confirmed with Northstar against their own eval harness, ideally with the pass marks they already use for release decisions.

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

## Focus areas (lowest-scoring items)

The internal view has a **Focus areas** button that lists the three items **furthest from a perfect 5**. These are scoring-derived, not a risk register; the top three technical, relationship and execution risks the brief asks for live on the Expansion plan view (see `internal-qbr/src/plan.ts`, `RISKS`):

- **Candidates:** every measured metric plus each judgement pillar. Anything already scoring 5 is excluded.
- **Order:** by exact distance from 5. A metric's exact position is its whole-number score plus how far its value has travelled through that band towards the next edge. Example: P50 at 605 ms sits 65% of the way from 800 ms (a 3) to 500 ms (a 4), giving 3.65, which is 1.35 from 5. Judgement pillars use their score as-is.
- **Shown per item:** current value, the threshold for the next band ("For a 4") and the threshold for a 5 ("For a 5"). An item already scoring 4 shows only "For a 5". Judgement items show their rationale.

Current ranking (Aug 2026):

| # | Item | Score | Exact position | Distance from 5 |
|---|---|---|---|---|
| 1 | Profitability (judgement) | 1 | 1.00 | 4.00 |
| 2 | Partnership (judgement) | 2 | 2.00 | 3.00 |
| 3 | P50 latency (R): 605 ms; for a 4 ≤ 500 ms, for a 5 ≤ 300 ms | 3 | 3.65 | 1.35 |
| — | P95 latency (R): 1.67 s; for a 4 ≤ 1.50 s, for a 5 ≤ 1.00 s | 3 | 3.67 | 1.33 |
| — | Tier-1 automation (A): 67.9% | 3 | 3.79 | 1.21 |
| — | Error rate (R): 1.04% | 3 | 3.96 | 1.04 |

## Judgement pillars

Set by the account team in [`internal-qbr/src/judgements.ts`](../internal-qbr/src/judgements.ts).

| Pillar | Score | Rationale |
|---|---|---|
| Partnership | **2** | Live on one brand out of five. The flagship team is engaged, but the wider business hasn't bought in: the four sister brands have no commitment, sponsor or timeline. Next step is an executive sponsor above brand level at the EBR. |
| Profitability | **1** | Scored from Fireworks' side. Current revenue is immaterial relative to the revenue ceiling across Northstar: $1,213 for August at a contracted ~$1.12 per 1M tokens, approx. $14k annualised. The Atlas deployment serves as a proof of concept to secure approval for rollouts across the other four brands, which carry significantly higher customer volumes (scenario assumption, to be backed by the brand profiles). **Cost to serve:** three operational events in month one (catalogue-sync incident, autoscaling threshold adjustment, RAG index refresh); one account team supports all five brands on a single shared deployment, so support effort does not scale per brand. **Strategic value:** a recognised retail logo and an EMEA retail reference account. **Deployment economics:** Northstar pays per token while the dedicated GPU floor is a Fireworks-side cost: one warm H100 is approx. $5.8k/month at list, approx. $8.8k at the 1.5x region-restricted rate (fireworks.ai/pricing, 5 Oct 2026). Atlas alone utilises roughly a fifth of a GPU-day (inferred, not observed), so it stays scale-to-zero; five brands' token revenue on one multi-LoRA deployment covers a warm floor, which is what fixes the margin (see [ARCHITECTURE.md](ARCHITECTURE.md)). |

## Current result (Aug 1–31, 2026, full-period averages)

| Pillar | Inputs → scores | Pillar score | Weighted |
|---|---|---|---|
| R | Availability 99.85% → 4 · errors 1.04% → 3 · P50 605 ms → 3 · P95 1.67 s → 3 | 3.33 | 0.67 |
| A | Automation 67.9% → 3 | 3.00 | 0.60 |
| M | Grounded 93.9% → 4 · eval pass 93.1% → 4 | 4.00 | 0.80 |
| P | Judgement | 2.00 | 0.20 |
| U | CSAT 82.3 → 4 · handle time 7m 44s → 4 · first-contact resolution 87.2% → 4 | 4.00 | 0.80 |
| P | Judgement | 1.00 | 0.10 |
| **Overall** | | **3.17 / 5 (Positive-Watch)** | |

What the score says:
- **Strengths:** model quality and user outcomes (both 4.0). Adoption is 3.0: automation averaged 67.9%, just under the 70% band, though it ended the month at 70.1%.
- **Weaknesses:** profitability (current revenue immaterial relative to the group-wide ceiling), partnership (needs buy-in beyond Atlas) and reliability (latency and the Aug 9 incident).
- **Status:** 3.17 is Positive-Watch, 0.83 short of Healthy.
- **For the expansion case:** both judgement pillars point the same way. Scaling to the four sister brands on a shared model is what makes the account worth its support cost and turns a single-brand relationship into a group one. The pitch: "prove reliability on Atlas, win group sponsorship, then scale".

## Decision log

| Decision | Choice | Why |
|---|---|---|
| Framework | RAMP UP, one letter per pillar | More mutually exclusive than the first draft (Risks to Adoption / Management / Performance / User XP) |
| Weights | 20/20/20/10/20/10 | Judgement pillars get half weight |
| Scoring basis | Full-period averages | Fair to the numbers; trailing windows flatter and are volatile |
| Availability scale | 99.9 = 5, 0.2-pt steps | Team standard (stricter SLA-anchored alternative documented above) |
| M and U sources | Microsoft Foundry, RAGAS, Freshworks 2025, Salesforce 2025 (M bands are account-team gates anchored to RAGAS/Foundry practice, not a published scale) | Primary, first-party sources instead of blog aggregators |
| Escalation | Scored in U as first-contact resolution | Has a direct Freshworks benchmark; keeps M purely about answer correctness |
| Profitability perspective | Fireworks' commercial view, scored 1 | Current revenue is immaterial relative to the ceiling across Northstar; Atlas is the proof of concept for the group rollout. Customer value already shows in U and the EBR |
| Status bands | Out of 5: Healthy ≥ 4, Positive-Watch ≥ 3, Negative-Watch ≥ 2, At risk < 2 | Same scale as the scores; splitting Watch shows which way an account is leaning |
| CSAT yardstick | Salesforce: 85 = 5, 70 = 4, 60 = 3, 50 = 2, below 50 = 1 | Salesforce's general good (70) / poor (50) guidance fits an AI agent better than Freshworks' human-chat retail tiers |
| Dashboard sources | Plain-text citations, no outbound links | Internal dashboard stays self-contained; full references live in this doc |
