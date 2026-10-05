# Scaling architecture: Atlas to five brands

This is the agreed technical plan for expanding the support model from Atlas to Northstar's four sister brands. It feeds the EBR's technical scaling plan, pilot proposal and biggest-risk sections. Fireworks facts are from Fireworks' docs and pricing page (Oct 2026); see Sources.

The brief sets the constraint: each brand has **"its own product catalog, tone of voice, return policies, support tooling, and operating team"**. Fireworks serves the model; Northstar owns the bot, tooling and operations.

## Verified Fireworks pricing and serving facts (checked 5 Oct 2026)

Every number below is from [fireworks.ai/pricing](https://fireworks.ai/pricing) or the [deploying-loras docs](https://docs.fireworks.ai/fine-tuning/deploying-loras) on 5 Oct 2026. On-demand rates rose on 1 Sep 2026 (H100 $7 → $8), so re-check before presenting.

| Item | Value | Implication here |
|---|---|---|
| On-demand H100 80 GB / H200 141 GB | **$8.00 per GPU-hour**, billed per GPU-second, no start-up charge | One replica warm 24/7 ≈ **$5,840/month** |
| On-demand B200 / B300 / GB300 | $13.00 / $15.00 / $20.00 per GPU-hour | Not needed at Northstar's model size; noted for completeness |
| **Region-restricted deployments** | **1.5x premium** on the GPU rate (contact sales) | EU-only placement for data residency puts an H100 at **$12.00/hour ≈ $8,760/month** warm. Northstar is an EMEA account; this is the number to confirm first |
| Managed LoRA SFT, 16.1B–80B base | $3.00 per 1M training tokens (up to 16B: $0.50; 80–300B: $6.00) | A brand adapter on ~5M training tokens ≈ $15; training cost is immaterial next to serving |
| Serving a fine-tuned model | Same price as the base model | No per-token markup for adapters; cost is entirely the GPU floor |
| Multi-LoRA overhead | "TTFT often +10–30%; lower max throughput under load"; adapter count has little effect, concurrency does | Budget the overhead into the P95 target |
| Speculative decoding on trained models | **Enterprise feature; contact Fireworks** | Not a lever we can assume for the shared deployment without an enterprise agreement |
| Multi-LoRA positioning in the docs | "Best for experimentation, A/B testing, or serving many variants"; live merge "recommended" for a single production model | Our use (five variants, shared GPU) is the documented fit, but the docs' default for a high-volume single brand is live merge. See the tiered plan below |
| Serverless | No custom or LoRA models; no SLA | Not an option for any Northstar model |

## Current state (assumptions)

| # | Assumption | Basis |
|---|---|---|
| 1 | Atlas is a **LoRA adapter on an open-weight base**, trained on Atlas data only | Fireworks' managed fine-tuning produces LoRA adapters |
| 2 | Atlas is served by **live merge on its own on-demand (dedicated) deployment** | "Neither custom base models nor LoRA addons are supported for serverless inference. All user-provided models, including trained models, require a dedicated deployment." Live merge is the single-model path, with performance "indistinguishable from a fully trained model" |
| 3 | The deployment **autoscales** | The 21 Aug note ("autoscaling threshold adjusted") is a dedicated-deployment lever; the 9 and 21 Aug P95 spikes look like replica scale-up lag under burst |
| 4 | `spend_usd` is the **per-GPU-second bill** for that deployment | On-demand is billed "per GPU second". At **$8.00 per H100-hour**, one replica kept warm 24/7 is about **$192/day (~$5.8k/month)**, or ~$288/day at the 1.5x EU region-restricted rate. August averaged **$39/day (~5 GPU-hours/day at the base rate)**, so the dataset implies aggressive scale-to-zero or understates a production bill. Confirm the real serving set-up and the region placement with the account team |

**Implication for reliability:** a deployment scaled to zero answers the next request with an immediate **503 (`DEPLOYMENT_SCALING_UP`)** while it spins up. Some of August's error rate and missed availability may be scale-up behaviour rather than model faults. Keeping a minimum warm replica is a direct lever on R, at the cost of the GPU floor.

**Implication for the customer's bill (say this out loud in the EBR):** a warm minimum replica moves Northstar from ~$1.2k/month to ~$5.8k/month (~$8.8k with EU placement), a 4–7x increase, before any expansion. The 99.9% availability target is therefore a commercial commitment to agree, not a configuration change. The expansion plan is what makes that floor sensible: five brands sharing one warm deployment is ~$1.2k–1.8k per brand, which is roughly what Atlas pays today for a deployment that scales to zero.

## Recommendation

Move to **one BF16 base-model deployment with add-ons enabled**, serving **Atlas's existing adapter plus four new brand adapters** via multi-LoRA. Each brand also gets its own isolated RAG index and system prompt.

```
firectl deployment create accounts/fireworks/models/<BASE_MODEL_ID> --deployment-shape <bf16-shape> --enable-addons
firectl load-lora <ATLAS_ADAPTER_ID> --deployment <DEPLOYMENT_ID>
firectl load-lora <BRAND_B_ADAPTER_ID> --deployment <DEPLOYMENT_ID>   # …and so on for each brand
```

The architecture as stated for the EBR:
- one open-weight base model on one dedicated BF16 deployment
- five brand LoRA adapters (Atlas's existing one plus four new), served multi-LoRA
- five isolated RAG indexes
- five system prompts

**Five adapters, one base, Atlas unchanged.** Nothing about the Atlas model is retired or retrained: its adapter is loaded onto the shared deployment exactly as trained. What's retired is Atlas's *current deployment*, and only because consolidation makes it a duplicate. Switching it off stops paying a second GPU floor.

**Why a new deployment rather than adding adapters to Atlas's current one.** Live merge bakes Atlas into the base weights, so that GPU no longer holds a clean base model; it holds "base + Atlas" as one set of weights. Loading a Brand B adapter there would stack Brand B on Atlas's tone and policy, which is exactly the contamination this design avoids. Multi-LoRA needs the untouched base with every adapter kept separate at inference time. Whether a deployment serves one merged model or base plus add-ons is set when it's created (`--enable-addons`). The docs show no way to switch an existing live-merge deployment into add-on mode in place (moderate-high confidence). "New" means a new deployment object with the same base model, shape and region, not necessarily new hardware or a new contract.

## Why not the alternatives

| Alternative | Why not |
|---|---|
| Reuse the Atlas adapter with a brand prompt | It was trained on Atlas only, so it has learned Atlas's tone and return-policy behaviour, exactly what differs by brand. A prompt fights learned weights, and Atlas tone and policy would leak through: the worst failure mode for a retail brand |
| Separate full fine-tunes per brand | Five dedicated deployments (five GPU floors), five pipelines, five retrains whenever the base changes; the smaller brands lack the transcripts to justify it |
| Serverless | Not available for custom or LoRA models on Fireworks, and serverless carries "no SLA guarantees for up-time or latency" |
| Keep Atlas on its own live-merged deployment; put the four new brands on a second multi-LoRA deployment | **Valid stated alternative.** Atlas stays untouched at the infrastructure level too and can run FP8 for a slightly better P50. The cost is two GPU floors instead of one. Choose it if flagship P50 matters more than the cost difference |

## Structure

| Layer | Scope | Holds |
|---|---|---|
| Base | One open-weight model on one BF16 deployment | General language ability |
| LoRA adapter | One per brand (Atlas exists; four new) | The brand's tone and policy behaviour, plus brand-agnostic support skills (triage, escalation, tool-call format, knowing when to say "I don't know"), since there's no shared fine-tune layer |
| RAG index | One per brand, isolated | That brand's catalogue. Data isolation lives here |
| System prompt | One per brand | Routing, guardrails, anything that changes weekly |

**Decision rule for where something lives:**

| If it is… | It goes in… |
|---|---|
| Changes daily or weekly | RAG or prompt |
| Stable but brand-specific style or policy behaviour | Adapter |
| A brand-agnostic support skill | Adapter, seeded from shared training data (below) |

**Training data for new brands.** Seed each brand's training set with **de-branded Atlas transcripts** (triage, escalation, tool-call patterns with Atlas tone and policy removed), then add the brand's own transcripts. This covers brands with thin data. Moving Atlas data across brands needs Northstar's sign-off.

## The key trade-off: shared BF16 vs five FP8 deployments

Fireworks' compatibility table: **BF16 shapes support LoRA add-ons; FP8 and FP4 shapes do not.** Multi-LoRA and FP8 quantisation can't share a deployment.

| Option | Cost | Latency |
|---|---|---|
| **A. One shared BF16 deployment, multi-LoRA** (recommended to start) | One GPU floor shared by five brands. One warm H100 is about $5.8k/month ($8.8k EU), about $1.2k–1.8k per brand | No FP8. Multi-LoRA adds overhead ("TTFT often +10–30%; lower max throughput under load"). Speculative decoding for trained models is an enterprise feature, so don't assume it |
| B. Five live-merged deployments, each FP8 | Five GPU floors (about $29k/month warm at one H100 each; $44k EU) | Lowest P50 per brand (FP8, no adapter overhead). This is the docs' recommended path for a single production model |
| **C. Tiered (the end state)** | Shared BF16 multi-LoRA for the three lower-volume brands; Halden (~3x Atlas volume) on its own live-merged FP8 deployment once it can keep a replica busy | Two floors (~$11.7k/month; $17.5k EU). Best latency where volume justifies it, shared cost where it doesn't |

Start on A: it is the documented fit for serving many variants of one base, it keeps one floor during the pilot, and the pilot itself is an A/B test, which is exactly what the docs say multi-LoRA is for. Move a brand to its own live-merged deployment (C) only when its sustained volume keeps a replica busy; Halden is the obvious first candidate. Option B is the alternative to name and reject on cost.

## Migration sequence (keeps uptime throughout)

| Step | Action | Gate to proceed |
|---|---|---|
| 1 | Stand up the multi-LoRA deployment alongside the live one. Load **Atlas's adapter first**. **Tune autoscaling for the combined five-brand peak now**, using the 21 Aug promo burst as the template | Atlas-on-add-on matches Atlas-on-merge on the existing eval set (grounding, eval pass, P50/P95) before any customer traffic touches it |
| 2 | Load the **pilot brand's adapter** on the same deployment and run the two-arm pilot there, so the pilot doubles as the production test of the shared deployment | Pilot success criteria met (see Pilot) |
| 3 | Shift **Atlas traffic by percentage (10% → 50% → 100%)** at Northstar's routing layer | Parity at each step; rollback to the old deployment available at every step |
| 4 | Load the **remaining three adapters**, each as it clears its own eval gate | Per-brand eval gate |
| 5 | **Decommission the live-merge deployment** | Atlas has run clean on the shared deployment through at least one promo-scale burst |

**Budget the overlap.** Steps 1–5 run two GPU floors in parallel. Size that window in **weeks, not months** (each extra warm H100 week is about $1.3k at $8.00/GPU-hour, $2.0k at the EU rate), so the consolidation saving is real.

**The one documented risk.** The shared BF16 deployment must be autoscaled for five brands' combined peaks, not one brand's. The 21 Aug threshold incident shows what happens when that's tuned reactively, so it's tuned in step 1, before Atlas traffic moves.

## Latency plan

Be precise about which lever moves which percentile:

| Percentile | Today | What moves it |
|---|---|---|
| P50 | 605 ms month average; **537 ms in week 4 and still falling** | Mostly compute for ~1,380 tokens per request. FP8 isn't available with add-ons, and speculative decoding on trained models needs an enterprise agreement, so the dependable lever on the shared deployment is **prompt caching** (the brand system prompt and RAG preamble are stable prefixes). Expect P50 to hold rather than fall after migration; it is already in a good place for chat support |
| P95 | 1.67 s month average; **1.46 s in week 4** | Mostly burst and scale-up behaviour (9 and 21 Aug). Levers: **autoscaling configuration** (warm minimum replicas, scale-up thresholds) and prompt caching. Multi-LoRA's TTFT overhead works against this, which is why the warm replica comes first |

Target wording for the EBR: *"P50 is already where it needs to be for chat support. On the shared deployment, a warm minimum replica plus prompt caching targets P95 under ~1.3 s and holds it through promotional peaks, absorbing the small overhead of serving five brands from one deployment."* (Quote a P95 target you can keep after the +10–30% TTFT overhead; 1.2 s is tight.)

Scoring stays on month averages (decision #16); the week-4 figures are used only as the trajectory in the narrative.

## Deployment economics

- A dedicated deployment has a GPU floor, so it only pays for itself above a utilisation threshold.
- At Atlas's current volume, one brand can't keep a warm GPU well utilised.
- Five brands on one deployment share the floor (about $1.2k per brand per month at one warm H100; $1.8k at the EU rate).
- Group revenue on dedicated capacity scales with **replicas needed**, not with ticket volume. The "indicative group value" on the plan view (Atlas spend × volume multiple, ~$115k/yr) is a per-token low case. A replicas-based view is one warm H100 ($70k/yr, $105k EU) plus burst replicas, rising to two floors under the tiered plan (~$140k/yr, $210k EU). Present both; don't let the per-token figure stand alone.
- That's why the shared deployment belongs in the expansion plan and not in month one. It also ties directly to the Profitability score (1) in RAMP UP.

## Pilot: two arms

Run the pilot brand both ways on the new shared deployment:

| Arm | Set-up | Cost |
|---|---|---|
| A (lowest cost) | Base model + brand system prompt + brand RAG index, **no adapter** | No training |
| B (adapter) | Base + brand LoRA adapter (seeded with de-branded Atlas data) + brand RAG + prompt | One adapter |

- **If arm A clears the grounding and eval thresholds,** the brand doesn't need an adapter. Say so: the plan is "the lowest cost that clears the quality bar", not "the cheapest".
- **If it doesn't,** arm B is the plan, and the pilot produced the evidence.
- **Measure in both arms:** grounding, eval pass, escalation, CSAT, tone/policy fidelity, and P50/P95 time-to-first-token.

This framing shows we aren't married to the architecture, and that's what Demi is expected to probe.

## Biggest risk: commercial

**Group-level approval isn't secured, so the account stays single-brand and the shared deployment never reaches the utilisation that justifies it.**

This links the two weakest RAMP UP pillars: Partnership (2) and Profitability (1).

Mitigation:
1. Use the EBR to secure an executive sponsor above brand level.
2. Agree the pilot brand and success criteria jointly with Northstar.
3. Tie the move to the shared deployment to a committed second brand, not to Atlas alone.

**Managed technical step (not the biggest risk):** moving Atlas's traffic onto the multi-LoRA deployment, following the migration sequence above. The adapter is unchanged, but it gives up live merge's zero overhead. If latency doesn't hold at any step, roll back and take the stated alternative: Atlas stays on its own live-merged (optionally FP8) deployment and the four new brands share a multi-LoRA deployment.

## Open items

| # | Item | Status |
|---|---|---|
| 1 | Atlas's actual serving set-up (shape, minimum replicas, scale-to-zero) and how `spend_usd` maps to the bill | Confirm with the account team |
| 2 | Each sister brand has enough transcripts to train an adapter; otherwise arm A (prompt + RAG) carries that brand | Pilot to confirm |
| 3 | Northstar approves cross-brand use of de-branded Atlas transcripts | Ask Northstar |
| 4 | Base model size fits one H100 at the required concurrency; adapter limits per deployment ("not constrained by GPU memory" per Fireworks) | Verify before quoting |
| 5 | Sister brands carry higher customer volumes than Atlas | Scenario assumption; brand profiles to back it up |

## Sources

- [Fireworks docs: Deploying trained models (live merge vs multi-LoRA, BF16/FP8 add-on support, firectl)](https://docs.fireworks.ai/fine-tuning/deploying-loras)
- [Fireworks docs: Models overview (serverless vs dedicated)](https://docs.fireworks.ai/models/overview)
- [Fireworks docs: Autoscaling (scale-to-zero, 503 on scale-up)](https://docs.fireworks.ai/deployments/autoscaling)
- [Fireworks pricing (on-demand per GPU-second; H100/H200 $8.00/hour; region-restricted 1.5x; LoRA SFT per 1M tokens) — checked 5 Oct 2026](https://fireworks.ai/pricing)
- [Fireworks blog: Multi-LoRA](https://fireworks.ai/blog/multi-lora)
