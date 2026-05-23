/**
 * Entity graph helpers.
 *
 * Every helper here is a pure, deterministic, network-free read against
 * the typed local data layer. Helpers MUST NOT:
 *   - call out to providers or external services
 *   - synthesise unverified claims (e.g. "model X is multimodal" when
 *     `model.modality` is null)
 *   - invent citations, pricing values, or lifecycle states
 *
 * Helpers MAY:
 *   - filter / group / count what's already in `data/`
 *   - traverse links between entities (model → provider, model →
 *     comparisons, model → citations, provider → status observer)
 *
 * If a helper here looks like it's about to derive a claim, stop —
 * surface raw verified fields and let the renderer mark them
 * unverified with `<VerifiedField>` / `<DataNotVerified>`.
 */

import type {
  ComparisonEntity,
  ModelEntity,
  ProviderEntity,
  SourceCitation,
  VerifiedPricingTier,
} from "./types";
import { isVerified } from "./verified";
import { models } from "@/data/models";
import { providers, getProviderBySlug } from "@/data/providers";
import { comparisons } from "@/data/comparisons";
import { verificationAttempts } from "@/data/verification-attempts";
import { hostedPricing } from "@/data/hosted-pricing";
import { findObserver } from "@/lib/observers";
import type { StatusObserver } from "./status-observations";

/** Every model belonging to a provider, in catalogue order. */
export function getModelsByProvider(providerSlug: string): ModelEntity[] {
  return models.filter((m) => m.providerSlug === providerSlug);
}

/** Provider entity that owns this model, if any. */
export function getProviderForModel(
  model: ModelEntity | undefined | null
): ProviderEntity | undefined {
  if (!model) return undefined;
  return getProviderBySlug(model.providerSlug);
}

/**
 * Every comparison entity that references a given model on either side.
 * Stable order matches `data/comparisons.ts`.
 */
export function getComparisonsForModel(
  modelSlug: string
): ComparisonEntity[] {
  return comparisons.filter(
    (c) => c.modelA === modelSlug || c.modelB === modelSlug
  );
}

/**
 * Every comparison entity that references at least one model owned by
 * the given provider.
 */
export function getComparisonsForProvider(
  providerSlug: string
): ComparisonEntity[] {
  const ownedSlugs = new Set(
    getModelsByProvider(providerSlug).map((m) => m.slug)
  );
  return comparisons.filter(
    (c) => ownedSlugs.has(c.modelA) || ownedSlugs.has(c.modelB)
  );
}

/** Pricing tiers for a single model, in declaration order. */
export function getPricingForModel(
  modelSlug: string
): VerifiedPricingTier[] {
  return models.find((m) => m.slug === modelSlug)?.pricing ?? [];
}

/**
 * Every pricing tier belonging to any model owned by the provider,
 * grouped by model slug.
 */
export function getPricingForProvider(
  providerSlug: string
): { modelSlug: string; tiers: VerifiedPricingTier[] }[] {
  return getModelsByProvider(providerSlug).map((m) => ({
    modelSlug: m.slug,
    tiers: m.pricing,
  }));
}

/** Deduplicated citations attached to a model record. */
export function getCitationsForModel(modelSlug: string): SourceCitation[] {
  return models.find((m) => m.slug === modelSlug)?.citations ?? [];
}

/**
 * Deduplicated citations referenced by any model owned by the provider.
 * Note: this is the union across the provider's models; provider
 * documentation URLs are listed on the provider entity itself.
 */
export function getCitationsForProvider(
  providerSlug: string
): SourceCitation[] {
  const seen = new Map<string, SourceCitation>();
  for (const m of getModelsByProvider(providerSlug)) {
    for (const c of m.citations) {
      if (!seen.has(c.url)) seen.set(c.url, c);
    }
  }
  return Array.from(seen.values());
}

/**
 * The enabled status observer for a provider, or undefined if none is
 * wired yet. Surfaced this way so UI code does not have to import the
 * observers registry directly.
 */
export function getStatusObserverForProvider(
  providerSlug: string
): StatusObserver | undefined {
  return findObserver(providerSlug);
}

export interface VerifiedFieldsSummary {
  modelSlug: string;
  verifiedFieldCount: number;
  verifiedPricingCount: number;
  citationCount: number;
}

/**
 * Count of verified field slots on a model (used by /coverage and the
 * homepage stat cards). Pure count — does NOT assert any value.
 */
export function getVerifiedFieldsForModel(
  modelSlug: string
): VerifiedFieldsSummary {
  const m = models.find((x) => x.slug === modelSlug);
  if (!m) {
    return {
      modelSlug,
      verifiedFieldCount: 0,
      verifiedPricingCount: 0,
      citationCount: 0,
    };
  }
  const verifiedFieldCount =
    (isVerified(m.apiIdentifiers) ? 1 : 0) +
    (isVerified(m.contextWindow) ? 1 : 0) +
    (isVerified(m.maxOutputTokens) ? 1 : 0) +
    (isVerified(m.modality) ? 1 : 0) +
    (isVerified(m.knowledgeCutoff) ? 1 : 0) +
    (isVerified(m.features) ? 1 : 0) +
    (isVerified(m.lifecycle) ? 1 : 0) +
    (isVerified(m.releaseDate) ? 1 : 0) +
    (isVerified(m.snapshotDate) ? 1 : 0);
  const verifiedPricingCount = m.pricing.filter((t) =>
    isVerified(t.amount)
  ).length;
  return {
    modelSlug,
    verifiedFieldCount,
    verifiedPricingCount,
    citationCount: m.citations.length,
  };
}

/**
 * Related models: same provider first (excluding self), then up to
 * `limit` other models in catalogue order. Used by /models/[slug] for
 * the "Related models" section.
 */
export function getRelatedModels(
  modelSlug: string,
  limit = 4
): ModelEntity[] {
  const self = models.find((m) => m.slug === modelSlug);
  if (!self) return [];
  const sameProvider = models.filter(
    (m) => m.providerSlug === self.providerSlug && m.slug !== modelSlug
  );
  const others = models.filter(
    (m) => m.providerSlug !== self.providerSlug && m.slug !== modelSlug
  );
  return [...sameProvider, ...others].slice(0, limit);
}

/**
 * Related providers: any provider that owns at least one model that
 * appears alongside this provider's models in a comparison, plus
 * providers with a verified status. Stable order.
 */
export function getRelatedProviders(
  providerSlug: string,
  limit = 6
): ProviderEntity[] {
  const myComparisons = getComparisonsForProvider(providerSlug);
  const seen = new Set<string>();
  for (const c of myComparisons) {
    const a = models.find((m) => m.slug === c.modelA);
    const b = models.find((m) => m.slug === c.modelB);
    if (a && a.providerSlug !== providerSlug) seen.add(a.providerSlug);
    if (b && b.providerSlug !== providerSlug) seen.add(b.providerSlug);
  }
  const related = Array.from(seen)
    .map((slug) => getProviderBySlug(slug))
    .filter((p): p is ProviderEntity => Boolean(p));
  if (related.length >= limit) return related.slice(0, limit);
  // Fill with other providers in catalogue order.
  for (const p of providers) {
    if (p.slug === providerSlug) continue;
    if (related.find((x) => x.slug === p.slug)) continue;
    related.push(p);
    if (related.length >= limit) break;
  }
  return related;
}

export interface EntityCoverageSummary {
  totalModels: number;
  verifiedModels: number;
  partiallyVerifiedModels: number;
  retiredOrHistoricalModels: number;
  totalProviders: number;
  verifiedProviders: number;
  providersWithStatusObserver: number;
  verifiedPricingRows: number;
  /** First-party pricing tier count (model_creator_first_party_api). */
  firstPartyPricingRows: number;
  /** Hosted-provider pricing tier count (hosted_provider_api). */
  hostedPricingRows: number;
  /** Distinct hosting platforms with at least one verified row. */
  hostingPlatformsWithPricing: number;
  totalComparisons: number;
  twoSidedVerifiedComparisons: number;
  oneSidedVerifiedComparisons: number;
  pendingComparisons: number;
  totalVerificationAttempts: number;
  blockedVerificationAttempts: number;
}

/**
 * Aggregate counts across the entity graph. Surfaces only counts — no
 * verdicts. Used by /coverage to render summary cards.
 */
export function getEntityCoverageSummary(): EntityCoverageSummary {
  const verifiedModels = models.filter(
    (m) => m.verificationStatus === "verified"
  );
  const partiallyVerifiedModels = models.filter(
    (m) => m.verificationStatus === "partial"
  );
  const retiredOrHistoricalModels = models.filter((m) => {
    if (!isVerified(m.lifecycle)) return false;
    return (
      m.lifecycle.value.status === "retired" ||
      m.lifecycle.value.status === "deprecated"
    );
  });
  const verifiedProviders = providers.filter(
    (p) => p.verificationStatus === "verified"
  );
  const providersWithStatusObserver = providers.filter((p) =>
    Boolean(getStatusObserverForProvider(p.slug))
  );
  const firstPartyPricingTiers = models.flatMap((m) =>
    m.pricing.filter((t) => isVerified(t.amount))
  );
  const hostedPricingTiers = hostedPricing.flatMap((r) =>
    r.tiers.filter((t) => isVerified(t.amount))
  );
  const verifiedPricingRows = [
    ...firstPartyPricingTiers,
    ...hostedPricingTiers,
  ];
  const hostingPlatforms = new Set(
    hostedPricing.map((r) => r.billingProviderSlug)
  );

  const sideVerified = (slug: string) =>
    models.find((m) => m.slug === slug)?.verificationStatus === "verified";
  const twoSidedVerified = comparisons.filter(
    (c) => sideVerified(c.modelA) && sideVerified(c.modelB)
  );
  const oneSidedVerified = comparisons.filter(
    (c) =>
      (sideVerified(c.modelA) || sideVerified(c.modelB)) &&
      !(sideVerified(c.modelA) && sideVerified(c.modelB))
  );
  const pending = comparisons.filter(
    (c) => !sideVerified(c.modelA) && !sideVerified(c.modelB)
  );

  const blocked = verificationAttempts.filter((a) =>
    a.result.startsWith("blocked-")
  );

  return {
    totalModels: models.length,
    verifiedModels: verifiedModels.length,
    partiallyVerifiedModels: partiallyVerifiedModels.length,
    retiredOrHistoricalModels: retiredOrHistoricalModels.length,
    totalProviders: providers.length,
    verifiedProviders: verifiedProviders.length,
    providersWithStatusObserver: providersWithStatusObserver.length,
    verifiedPricingRows: verifiedPricingRows.length,
    firstPartyPricingRows: firstPartyPricingTiers.length,
    hostedPricingRows: hostedPricingTiers.length,
    hostingPlatformsWithPricing: hostingPlatforms.size,
    totalComparisons: comparisons.length,
    twoSidedVerifiedComparisons: twoSidedVerified.length,
    oneSidedVerifiedComparisons: oneSidedVerified.length,
    pendingComparisons: pending.length,
    totalVerificationAttempts: verificationAttempts.length,
    blockedVerificationAttempts: blocked.length,
  };
}
