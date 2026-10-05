# Scaling architecture: Atlas to five brands

This is the agreed technical plan for expanding the support model from Atlas to Northstar's four sister brands. It feeds the EBR's technical scaling plan, pilot proposal and biggest-risk sections.

The brief sets the constraint: each brand has **"its own product catalog, tone of voice, return policies, support tooling, and operating team"**.

**Starting point (assumption):** the current Atlas model is a **LoRA adapter on an open-weight base model, trained on Atlas data only**.

## Recommendation

Train one LoRA adapter per brand on the **same open-weight base as Atlas**, and serve all five **multi-LoRA on a single deployment**.

The architecture as stated for the EBR:
- one open-weight base model
- five brand LoRA adapters (Atlas's existing adapter plus four new ones), served multi-LoRA on one deployment
- five isolated RAG indexes
- five system prompts

This is the Fireworks-native answer: serving many adapters against one base is a core platform capability.

## Why not the alternatives

**Reusing the Atlas adapter with a brand prompt.** The Atlas adapter was trained on Atlas data only, so it has learned Atlas's tone of voice and return-policy behaviour, exactly what the brief says differs by brand.
- A system prompt saying "you are Brand B, be playful, 60-day returns" fights those learned weights.
- Atlas tone and policy assumptions would leak through, the worst failure mode for a retail brand. You can't prompt your way out of a fine-tune cleanly.

**Separate full fine-tunes per brand.** Five full models mean five dedicated deployments, five training pipelines, and five retrains whenever the base changes. The smaller brands won't have enough support transcripts to justify a full fine-tune.

## Structure

| Layer | Scope | Holds |
|---|---|---|
| Base | One open-weight model, shared by all five brands | General language ability |
| LoRA adapter | One per brand (Atlas exists; four new) | The brand's tone and policy behaviour, **plus** the brand-agnostic support skills (triage, escalation behaviour, tool-call format, knowing when to say "I don't know"), since there's no shared fine-tune layer |
| RAG index | One per brand, isolated | That brand's catalogue. Data isolation lives here, the layer that actually needs it |
| System prompt | One per brand | Routing, guardrails, anything that changes weekly |

**Decision rule for where something lives:**

| If it is… | It goes in… |
|---|---|
| Changes daily or weekly | RAG or prompt |
| Stable but brand-specific style or policy behaviour | Adapter |
| A brand-agnostic support skill | Adapter, via a shared training recipe (below) |

**Shared training recipe.** With no shared fine-tune layer, each adapter learns the brand-agnostic skills itself. Keep them consistent with:
- one training template
- one set of brand-agnostic training examples (triage, escalation, tool-call format)
- one eval harness

Each brand then adds its own transcripts. Using Atlas transcripts to teach these skills to other brands' adapters is efficient, but it moves Atlas data across brands, so it needs Northstar's sign-off.

## Trade-offs

| Dimension | How the design handles it |
|---|---|
| Cost | Adapters share the GPU, so there are no five dedicated deployments. Fireworks: "hundreds of personalized LoRA models at the same cost as a single base model" |
| Latency | **Real overhead.** Fireworks docs: multi-LoRA "TTFT often +10–30%; lower max throughput under load"; the blog says throughput "approach[es] 90% of base model performance". P50 latency is already a top-three risk (605 ms; for a 4 needs ≤ 500 ms), so the pilot must measure it. Mitigations: tune adapter rank; live-merge the highest-volume brand onto its own deployment if needed |
| Data isolation | Each brand's catalogue sits in its own index; adapters are trained per brand. Any cross-brand training data is opt-in |
| Quality | Per-brand test sets in one eval harness, gated on the same RAMP UP M thresholds (grounded ≥ 95%, eval pass ≥ 95% for a 5) |
| Maintenance | One base and one training recipe; adapters retrained independently. A base-model upgrade means retraining all five adapters, so pin the base version |

## Deployment economics

Fireworks docs: trained LoRA models "can **only** be deployed to **on-demand (dedicated) deployments**. Serverless deployment is not supported."

- A single brand on its own deployment carries the whole GPU cost. At Atlas's current revenue (about $14k a year), that's unlikely to be margin-positive.
- Five brands on one multi-LoRA deployment share that cost. The architecture is what makes the account commercially viable, which ties directly to the Profitability score (1) in RAMP UP.

## Pilot: two arms

Run the pilot brand both ways on the shared base:

| Arm | Set-up | Cost |
|---|---|---|
| A (cheap) | Base model + brand system prompt + brand RAG index, **no adapter** | No training |
| B (adapter) | Base + brand LoRA adapter + brand RAG + prompt | One adapter |

- **If arm A clears the grounding and eval thresholds,** the brand doesn't need an adapter at all. Say so: that's four fine-tunes saved.
- **If it doesn't,** arm B is the plan, and the pilot produced the evidence.
- **Measure in both arms:** grounding, eval pass, escalation, CSAT, tone/policy fidelity, and P50/P95 time-to-first-token (to quantify adapter overhead).
- **Why not test the Atlas adapter here:** it was trained on Atlas only, so it would be expected to leak Atlas tone and policy. It isn't a credible cheap option.

This framing shows we aren't married to the architecture, and that's what the interviewer (Demi) is expected to probe.

## Biggest risk: moving Atlas onto the shared deployment

The Atlas adapter is kept, but it has to move from its current deployment onto the shared multi-LoRA deployment. That move can regress the one deployment that's working, most likely on latency: multi-LoRA adds 10–30% to TTFT, and latency is already one of Atlas's top risks.

Mitigation:
1. **Migrate Atlas last,** after the pilot brand has proved the multi-LoRA deployment in production.
2. **Run Atlas on multi-LoRA in shadow** against its current deployment before cutover, comparing P50/P95 latency, grounding, eval pass, escalation and CSAT.
3. **Cut over only when the shadow run matches or beats current production** on the RAMP UP R, M and U metrics. If latency doesn't hold, keep Atlas live-merged on its own deployment and put only the four new brands on multi-LoRA.

## Assumptions and open items

| # | Item | Status |
|---|---|---|
| 1 | The Atlas model is a LoRA adapter on an open-weight base, trained on Atlas data only | Assumption (agreed) |
| 2 | Each sister brand has enough transcripts to train an adapter; otherwise arm A (prompt + RAG) carries that brand | Pilot to confirm |
| 3 | Northstar approves cross-brand use of Atlas transcripts for brand-agnostic training examples | Ask Northstar |
| 4 | Adapter limits per deployment and current pricing: docs give no hard limit ("not constrained by GPU memory") | Verify before quoting |
| 5 | Sister brands carry higher customer volumes than Atlas | Scenario assumption; brand profiles to back it up |

## Sources

- [Fireworks docs: Deploying trained models (live merge vs multi-LoRA)](https://docs.fireworks.ai/fine-tuning/deploying-loras)
- [Fireworks blog: Multi-LoRA (Sep 2024)](https://fireworks.ai/blog/multi-lora)
