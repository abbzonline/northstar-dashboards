/**
 * The only place pricing constants live in code. Figures are from fireworks.ai/pricing and the
 * deploying-loras docs, checked 5 Oct 2026 (on-demand rates rose on 1 Sep 2026: H100 $7 → $8).
 * docs/ARCHITECTURE.md carries the same fact table. Re-check before presenting.
 */

/** On-demand H100 / H200 list rate, billed per GPU-second. */
export const H100_PER_HOUR = 8;

/** Region-restricted deployments (e.g. EU-only placement for data residency) carry a 1.5x premium. */
export const REGION_PREMIUM = 1.5;

/** One replica kept warm 24/7 at list rates. */
export const WARM_H100_MONTH = (H100_PER_HOUR * 24 * 365) / 12;
export const WARM_H100_MONTH_EU = WARM_H100_MONTH * REGION_PREMIUM;
export const WARM_H100_WEEK = H100_PER_HOUR * 24 * 7;

/** Managed LoRA SFT, 16.1B–80B base, per 1M training tokens. Fine-tuned models serve at the base model's price. */
export const LORA_SFT_PER_M_TOKENS = 3;

/** Brands sharing one warm floor in the expansion plan. */
export const BRANDS_ON_SHARED_DEPLOYMENT = 5;
