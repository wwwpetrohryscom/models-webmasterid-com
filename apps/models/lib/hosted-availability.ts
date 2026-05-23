import type { SourceCitation } from "./types";
import { hostedPricing } from "@/data/hosted-pricing";
import { getModelBySlug } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import {
  getPricingFreshness,
  type PricingFreshnessState,
} from "./pricing-freshness";

/**
 * Hosted model availability catalogue.
 *
 * Sprint 20 separates "this model is hosted by this platform" from
 * "this is the platform's per-token rate". Availability is a stable
 * fact (the platform either exposes the model or it does not);
 * pricing is volatile and may change after retrieval. The two
 * surface independently — availability rows can render where pricing
 * rows would be misleading.
 *
 * Today every availability record is derived from a verified
 * hosted-pricing record (we never claim a model is hosted somewhere
 * without a citation). The record is intentionally narrow — it
 * records identity (model + creator + host + hosted model ID) plus
 * the freshness of the underlying pricing citation. Latency,
 * throughput, region, and tier are not modelled here.
 */
export interface HostedAvailabilityRecord {
  /** Stable identifier for the availability row. */
  id: string;
  /** Catalogue slug for the underlying model. */
  modelSlug: string;
  /** Human-readable model name, resolved from the catalogue. */
  modelName: string | null;
  /** The organisation that created the model. */
  modelCreatorProviderSlug: string;
  /** The hosting/inference platform that exposes the model. */
  billingProviderSlug: string;
  /** Platform-specific model identifier the developer passes. */
  hostedModelId: string | null;
  /** True when the platform's per-token rate has been verified. */
  pricingAvailable: boolean;
  /** Computed freshness of the most recent pricing citation. */
  pricingFreshness: PricingFreshnessState;
  /** The primary-source citation backing the availability claim. */
  sourceCitation: SourceCitation | null;
  /** When the underlying pricing row was last verified. */
  lastCheckedAt: string | null;
}

export function getHostedAvailability(): HostedAvailabilityRecord[] {
  return hostedPricing.map((r) => {
    const model = getModelBySlug(r.modelSlug);
    return {
      id: `availability-${r.billingProviderSlug}-${r.modelSlug}`,
      modelSlug: r.modelSlug,
      modelName: model?.name ?? null,
      modelCreatorProviderSlug: r.modelCreatorProviderSlug,
      billingProviderSlug: r.billingProviderSlug,
      hostedModelId: r.hostedModelId ?? null,
      pricingAvailable: r.tiers.some((t) => t.amount && t.amount.citation),
      pricingFreshness: getPricingFreshness(r.lastCheckedAt),
      sourceCitation: r.citation ?? null,
      lastCheckedAt: r.lastCheckedAt,
    };
  });
}

export function getHostedAvailabilityForBillingProvider(
  providerSlug: string
): HostedAvailabilityRecord[] {
  return getHostedAvailability().filter(
    (r) => r.billingProviderSlug === providerSlug
  );
}

export function getHostedAvailabilityForCreator(
  providerSlug: string
): HostedAvailabilityRecord[] {
  return getHostedAvailability().filter(
    (r) => r.modelCreatorProviderSlug === providerSlug
  );
}

export function getHostedAvailabilityForModel(
  modelSlug: string
): HostedAvailabilityRecord[] {
  return getHostedAvailability().filter((r) => r.modelSlug === modelSlug);
}

/**
 * Convenience helper — true if the given provider slug shows up as
 * the billing platform on any availability row. Used by provider
 * pages to switch the "hosted platform" badge on.
 */
export function isHostedPlatformProvider(providerSlug: string): boolean {
  return getHostedAvailabilityForBillingProvider(providerSlug).length > 0;
}

/**
 * Used by /coverage and integrity guards: counts by freshness state.
 */
export function hostedAvailabilityCountsByFreshness(): Record<
  PricingFreshnessState,
  number
> {
  const counts: Record<PricingFreshnessState, number> = {
    fresh: 0,
    review_due: 0,
    stale: 0,
    unknown: 0,
  };
  for (const r of getHostedAvailability()) {
    counts[r.pricingFreshness] += 1;
  }
  return counts;
}
