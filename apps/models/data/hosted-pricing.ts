import type { PricingRecord } from "@/lib/types";
import { verified } from "@/lib/verified";
import { groqPricing, togetherPricing } from "./citations";

/**
 * Hosted-provider pricing records.
 *
 * Every row in this file documents a third-party hosting platform
 * (Groq, Together AI, ...) charging for inference of a model that was
 * NOT created by that platform. Each record:
 *
 *   - sets `pricingContext: "hosted_provider_api"`
 *   - keeps `modelCreatorProviderSlug` pointing at the *creator* of the
 *     underlying model (e.g. `"meta"` for Llama 4 Scout)
 *   - sets `billingProviderSlug` to the *hosting* platform that bills
 *     the developer (e.g. `"groq"`)
 *   - records the platform-specific model identifier in
 *     `hostedModelId` so a reader can map the row back to a Groq /
 *     Together API request without ambiguity
 *   - cites the official pricing page the values came from
 *
 * These rows MUST NOT be used to imply that a hosting platform created
 * the model: model-creator JSON-LD is built off the ModelEntity's own
 * `providerSlug`, not off this table.
 *
 * Sprint 19 scope: two rows below — Groq's Llama 4 Scout and Together
 * AI's DeepSeek V4 Pro — are the only mappings where (a) the hosted
 * model appears in the platform's serverless inference pricing table
 * (NOT a fine-tuning or dedicated-GPU table), and (b) the underlying
 * model is already a verified entry in `data/models.ts`. Other rows
 * may appear on the platform pricing pages but are intentionally
 * skipped until both conditions hold.
 */
export const hostedPricing: PricingRecord[] = [
  // -------------------------------------------------------------------
  // Groq → Meta Llama 4 Scout (17Bx16E) 128k
  //
  // Verified against https://groq.com/pricing (retrieved 2026-05-23):
  // "Llama 4 Scout (17Bx16E) 128k — $0.11 input / $0.34 output per 1M tokens".
  // Meta is the model creator; Groq is the billing/hosting provider.
  // -------------------------------------------------------------------
  {
    id: "hosted-pricing-groq-llama-4-scout",
    modelSlug: "llama-4-scout",
    modelCreatorProviderSlug: "meta",
    billingProviderSlug: "groq",
    hostedModelId: "meta-llama/llama-4-scout-17b-16e-instruct",
    pricingContext: "hosted_provider_api",
    tiers: [
      {
        unit: "1M input tokens",
        amount: verified(0.11, groqPricing, {
          notes:
            "Listed as $0.11 per 1M input tokens under 'Llama 4 Scout (17Bx16E) 128k' on Groq's pricing page (2026-05-23).",
        }),
        notes:
          "Hosted-provider rate — Groq is the billing provider, Meta is the model creator. Meta does not run a first-party paid API for Llama; this row reflects Groq's pricing decision, not Meta's.",
      },
      {
        unit: "1M output tokens",
        amount: verified(0.34, groqPricing, {
          notes:
            "Listed as $0.34 per 1M output tokens under 'Llama 4 Scout (17Bx16E) 128k' on Groq's pricing page (2026-05-23).",
        }),
        notes:
          "Hosted-provider rate — Groq is the billing provider, Meta is the model creator.",
      },
    ],
    citation: groqPricing,
    lastCheckedAt: "2026-05-23T00:00:00.000Z",
    verified: true,
    verificationStatus: "verified",
    volatility: "high",
    reviewCadenceDays: 14,
    notes:
      "Groq advertises additional features alongside the per-token rate (50% cache-hit discount on uncached input tokens, 50%-off Batch API with a 24h–7d window). Those are documented on the pricing page but the catalogue keeps each platform's promo modifiers in record notes rather than synthesising derived rows.",
  },

  // -------------------------------------------------------------------
  // Together AI → DeepSeek V4 Pro
  //
  // Verified against https://www.together.ai/pricing (retrieved 2026-05-23):
  // "DeepSeek V4 Pro — $2.10 / 1M input, $4.40 / 1M output, $0.20 / 1M
  // cache-hit input". Together advertises this row in the serverless
  // chat-models table — distinct from the fine-tuning + dedicated
  // tables further down the page.
  // -------------------------------------------------------------------
  {
    id: "hosted-pricing-together-deepseek-v4-pro",
    modelSlug: "deepseek-v4-pro",
    modelCreatorProviderSlug: "deepseek",
    billingProviderSlug: "together-ai",
    hostedModelId: "deepseek-ai/DeepSeek-V4-Pro",
    pricingContext: "hosted_provider_api",
    tiers: [
      {
        unit: "1M input tokens",
        amount: verified(2.1, togetherPricing, {
          notes:
            "Listed as $2.10 per 1M input tokens under 'DeepSeek V4 Pro' on Together AI's pricing page (2026-05-23).",
        }),
        notes:
          "Hosted-provider rate — Together AI is the billing provider, DeepSeek is the model creator.",
      },
      {
        unit: "1M output tokens",
        amount: verified(4.4, togetherPricing, {
          notes:
            "Listed as $4.40 per 1M output tokens under 'DeepSeek V4 Pro' on Together AI's pricing page (2026-05-23).",
        }),
        notes:
          "Hosted-provider rate — Together AI is the billing provider, DeepSeek is the model creator.",
      },
      {
        unit: "1M cache read tokens",
        amount: verified(0.2, togetherPricing, {
          notes:
            "Listed as $0.20 per 1M cache-hit input tokens under 'DeepSeek V4 Pro' on Together AI's pricing page (2026-05-23). Recorded under the existing cache-read unit (same semantics as DeepSeek's first-party cache-hit row).",
        }),
        notes:
          "Cache-hit input on Together — uses the same `1M cache read tokens` unit as DeepSeek's first-party rate. The discount is offered by Together AI, not by DeepSeek.",
      },
    ],
    citation: togetherPricing,
    lastCheckedAt: "2026-05-23T00:00:00.000Z",
    verified: true,
    verificationStatus: "verified",
    volatility: "high",
    reviewCadenceDays: 14,
    notes:
      "DeepSeek V4 Pro's Together rate is set by Together AI, not DeepSeek. The two billing providers price independently — this row is a source-backed reference, not a comparison datapoint.",
  },
];

export function hostedPricingForModel(modelSlug: string): PricingRecord[] {
  return hostedPricing.filter((r) => r.modelSlug === modelSlug);
}

export function hostedPricingForBillingProvider(
  providerSlug: string
): PricingRecord[] {
  return hostedPricing.filter((r) => r.billingProviderSlug === providerSlug);
}
