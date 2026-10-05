# Scaling architecture: Atlas to five brands

This is the agreed technical plan for expanding the support model from Atlas to Northstar's four sister brands. It feeds the EBR's technical scaling plan, pilot proposal and biggest-risk sections.

The brief sets the constraint: each brand has **"its own product catalog, tone of voice, return policies, support tooling, and operating team"**.

## Recommendation

Neither reuse the Atlas model as-is, nor build five separate fine-tunes. Use **a shared base plus per-brand LoRA adapters, served multi-LoRA on one deployment.**

The architecture as stated for the EBR:
- one open-weight base model
- one shared "Northstar support" fine-tune for brand-agnostic behaviour
- five brand LoRA adapters, served multi-LoRA on a single deployment
- five isolated RAG indexes
- five system prompts

This is also the Fireworks-native answer: serving many adapters against one base is a core platform capability.

## Why not the alternatives

**Reusing the Atlas model with a brand prompt.** Fine-tuning dominates prompting.
- If the Atlas fine-tune learned tone of voice and return-policy behaviour (exactly what the brief says differs by brand), a system prompt saying "you are Brand B, be playful, 60-day returns" is fighting learned weights.
- Expect Atlas tone and Atlas policy assumptions to leak through. For a retail brand that is the worst failure mode, and you can't prompt your way out of a fine-tune cleanly.
- Confidence: moderate-high.

**Five separate full fine-tunes.** Maintenance scales linearly.
- You'd run five training pipelines, five eval suites and five deployments, and retrain all five whenever the base model or the shared support logic changes.
- The smaller brands won't have enough support transcripts to fine-tune well anyway.

## Structure

| Layer | Scope | Holds |
|---|---|---|
| Base | One open-weight model | General language ability |
| Shared fine-tune | "Northstar support", retrained on pooled data (Atlas plus whatever exists for the other brands) | Brand-agnostic skills: ticket triage, escalation behaviour, tool-call format, knowing when to say "I don't know". This is mostly what the Atlas fine-tune taught, and it transfers |
| LoRA adapter | One per brand (thin) | Stable, brand-specific tone and policy behaviour |
| RAG index | One per brand, isolated | That brand's catalogue. Data isolation lives here, the layer that actually needs it |
| System prompt | One per brand | Routing, guardrails, anything that changes weekly |

**Decision rule for where something lives:**

| If it is… | It goes in… |
|---|---|
| Changes daily or weekly | RAG or prompt |
| Stable but brand-specific style or policy behaviour | Adapter |
| A brand-agnostic skill | Base or shared fine-tune |

## Trade-offs

| Dimension | How the design handles it |
|---|---|
| Cost | Adapters share the GPU, so there are no five dedicated deployments. Fireworks: "hundreds of personalized LoRA models at the same cost as a single base model" |
| Latency | **Real overhead.** Fireworks docs: multi-LoRA "TTFT often +10–30%; lower max throughput under load"; the blog says throughput "approach[es] 90% of base model performance". P50 latency is already a top-three risk (605 ms; for a 4 needs ≤ 500 ms), so the pilot must measure it. Mitigations: live-merge the highest-volume brand onto its own deployment if needed; tune adapter rank |
| Data isolation | Brand A's data never touches brand B's adapter or index |
| Quality | Per-brand test sets in one eval harness, gated on the same RAMP UP M thresholds (grounded ≥ 95%, eval pass ≥ 95% for a 5) |
| Maintenance | One base, one eval harness with per-brand test sets, adapters retrained independently |

## Deployment economics

Fireworks docs: trained LoRA models "can **only** be deployed to **on-demand (dedicated) deployments**. Serverless deployment is not supported."

- A single brand on its own deployment carries the whole GPU cost. At Atlas's current revenue (about $14k a year), that's unlikely to be margin-positive.
- Five brands on one multi-LoRA deployment share that cost. The architecture is what makes the account commercially viable, which ties directly to the Profitability score (1) in RAMP UP.

## Pilot: two arms

Run the pilot brand both ways:

| Arm | Set-up | Cost |
|---|---|---|
| A (cheap) | Atlas model + brand system prompt + brand RAG index | No new training |
| B (adapter) | Shared base + brand LoRA adapter + brand RAG + prompt | One adapter |

- **If arm A clears the grounding and eval thresholds,** we've just saved four fine-tunes and should say so.
- **If it doesn't,** arm B is the plan, and the pilot produced the evidence.
- **Measure in both arms:** grounding, eval pass, escalation, CSAT, P50/P95 time-to-first-token (to quantify adapter overhead) and tone/policy leakage.

This framing shows we aren't married to the architecture, and that's what the interviewer (Demi) is expected to probe.

## Biggest risk: retiring the Atlas fine-tune

The plan retires the current Atlas fine-tune. Atlas has to be re-cut as an adapter on the new shared base. That's a regression risk on the one deployment that's working.

Mitigation:
1. **Migrate Atlas last,** after the pilot brand has proved the adapter arm.
2. **Run Atlas-on-adapter in shadow** against Atlas-on-current-fine-tune before cutover, comparing grounding, eval pass, escalation, CSAT and latency.
3. **Cut over only when the shadow run matches or beats current production** on the RAMP UP M and U metrics.

## Assumptions and open items

| # | Item | Status |
|---|---|---|
| 1 | We don't know what the Atlas fine-tune was trained on. Pure Atlas transcripts mean treat it as brand-specific; a general support fine-tune with Atlas data mixed in strengthens the reuse case (arm A) | Assumption: ask Northstar |
| 2 | Multi-LoRA adapters must share one base. Confirm the shared "Northstar support" fine-tune can be deployed as a base with adapter add-ons. If not, put the brand-agnostic training into each adapter's pooled training data | Verify on Fireworks |
| 3 | Adapter limits per deployment and current pricing: docs give no hard limit ("not constrained by GPU memory"; "thousands" of adapters cited) | Verify before quoting |
| 4 | Sister brands carry higher customer volumes than Atlas | Scenario assumption; brand profiles to back it up |

## Sources

- [Fireworks docs: Deploying trained models (live merge vs multi-LoRA)](https://docs.fireworks.ai/fine-tuning/deploying-loras)
- [Fireworks blog: Multi-LoRA (Sep 2024)](https://fireworks.ai/blog/multi-lora)
