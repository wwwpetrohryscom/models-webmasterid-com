import type { PricingEntity, PricingRecord } from "@/lib/types";
import { models } from "./models";
import { hostedPricing } from "./hosted-pricing";

/**
 * Legacy per-model pricing summary kept for backwards compatibility
 * with callers that iterate the model catalogue. Carries first-party
 * tiers only.
 */
export const pricing: PricingEntity[] = models.map((m) => ({
  id: `pricing-${m.slug}`,
  slug: m.slug,
  name: `${m.name} pricing`,
  description: `API pricing entry for ${m.name}. Unverified rates are intentionally omitted.`,
  modelSlug: m.slug,
  tiers: m.pricing,
  currency: "USD" as const,
  sourceUrl: m.sourceUrl ?? null,
  verified: m.verified,
  verificationStatus: m.verificationStatus,
  lastCheckedAt: m.lastCheckedAt,
  updatedDate: m.updatedDate,
}));

/**
 * First-party (model-creator) pricing records, derived from the model
 * catalogue. Each ModelEntity's `pricing` array is treated as the
 * model creator's own first-party API pricing — that is the invariant
 * the catalogue has always assumed implicitly, now made explicit.
 */
export const firstPartyPricing: PricingRecord[] = models
  .filter((m) => m.pricing.length > 0)
  .map((m) => ({
    id: `pricing-first-party-${m.slug}`,
    modelSlug: m.slug,
    modelCreatorProviderSlug: m.providerSlug,
    billingProviderSlug: m.providerSlug,
    pricingContext: "model_creator_first_party_api" as const,
    tiers: m.pricing,
    lastCheckedAt: m.lastCheckedAt,
    verified: m.verified,
    verificationStatus: m.verificationStatus,
    notes: null,
  }));

/**
 * All pricing records — first-party and hosted-provider — surfaced
 * together for /pricing rendering. Consumers can split by
 * `pricingContext` to render the two sections separately.
 */
export const allPricingRecords: PricingRecord[] = [
  ...firstPartyPricing,
  ...hostedPricing,
];

export function pricingRecordsForModel(modelSlug: string): PricingRecord[] {
  return allPricingRecords.filter((r) => r.modelSlug === modelSlug);
}
