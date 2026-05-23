import type { SourceCitation } from "./types";
import { models } from "@/data/models";
import { providers } from "@/data/providers";
import { hostedPricing } from "@/data/hosted-pricing";
import { isVerified } from "./verified";
import {
  getFreshnessState,
  type FreshnessState,
} from "./source-freshness";

/**
 * Source-to-entity usage map.
 *
 * Sprint 22 records which entities depend on which citations so a
 * reviewer can see, before they re-fetch a source, exactly which
 * routes will refresh as a result. Pure local read — no fetch, no
 * env, no Date.now.
 *
 * `usage` categorises how a citation supports a model:
 *   - "model"          → model entity citations array
 *   - "first-party-pricing"   → ModelEntity.pricing[].amount.citation
 *   - "hosted-pricing"  → HostedPricing record / tier citation
 *
 * Routes affected are the canonical pages that would re-render once
 * the citation is updated.
 */
export interface SourceUsageRecord {
  citation: SourceCitation;
  /** Provider slugs (creator side) that this citation supports. */
  providerSlugs: string[];
  /** Model slugs that this citation supports. */
  modelSlugs: string[];
  /** How the citation is used. */
  usage: ("model" | "first-party-pricing" | "hosted-pricing")[];
  /** Canonical routes that depend on this citation. */
  affectedRoutes: string[];
  /** Deterministic freshness state. */
  freshness: FreshnessState;
}

export interface CitationImpactSummary {
  totalCitations: number;
  freshCitations: number;
  reviewDueCitations: number;
  staleCitations: number;
  unknownCitations: number;
  citationsByProvider: Record<string, number>;
}

function categoryForCitation(c: SourceCitation): "pricing" | "source" {
  return c.type === "official-vendor-pricing" ? "pricing" : "source";
}

export function getSourceUsageMap(): SourceUsageRecord[] {
  const byUrl = new Map<string, SourceUsageRecord>();

  function ensure(c: SourceCitation): SourceUsageRecord {
    let entry = byUrl.get(c.url);
    if (!entry) {
      entry = {
        citation: c,
        providerSlugs: [],
        modelSlugs: [],
        usage: [],
        affectedRoutes: [],
        freshness: getFreshnessState(c.retrievedAt, {
          category: categoryForCitation(c),
        }),
      };
      byUrl.set(c.url, entry);
    }
    return entry;
  }

  function addUnique<T>(arr: T[], v: T): void {
    if (!arr.includes(v)) arr.push(v);
  }

  for (const m of models) {
    for (const c of m.citations) {
      const entry = ensure(c);
      addUnique(entry.providerSlugs, m.providerSlug);
      addUnique(entry.modelSlugs, m.slug);
      addUnique(entry.usage, "model");
      addUnique(entry.affectedRoutes, `/models/${m.slug}`);
      addUnique(entry.affectedRoutes, `/providers/${m.providerSlug}`);
      addUnique(entry.affectedRoutes, "/sources");
    }
    for (const t of m.pricing) {
      if (!isVerified(t.amount)) continue;
      const entry = ensure(t.amount.citation);
      addUnique(entry.providerSlugs, m.providerSlug);
      addUnique(entry.modelSlugs, m.slug);
      addUnique(entry.usage, "first-party-pricing");
      addUnique(entry.affectedRoutes, `/models/${m.slug}`);
      addUnique(entry.affectedRoutes, `/pricing`);
      addUnique(entry.affectedRoutes, "/sources");
    }
  }
  for (const r of hostedPricing) {
    if (r.citation) {
      const entry = ensure(r.citation);
      addUnique(entry.providerSlugs, r.billingProviderSlug);
      addUnique(entry.modelSlugs, r.modelSlug);
      addUnique(entry.usage, "hosted-pricing");
      addUnique(entry.affectedRoutes, `/models/${r.modelSlug}`);
      addUnique(
        entry.affectedRoutes,
        `/providers/${r.billingProviderSlug}`
      );
      addUnique(entry.affectedRoutes, "/pricing");
      addUnique(entry.affectedRoutes, "/sources");
    }
    for (const t of r.tiers) {
      if (!isVerified(t.amount)) continue;
      const entry = ensure(t.amount.citation);
      addUnique(entry.providerSlugs, r.billingProviderSlug);
      addUnique(entry.modelSlugs, r.modelSlug);
      addUnique(entry.usage, "hosted-pricing");
      addUnique(entry.affectedRoutes, `/models/${r.modelSlug}`);
      addUnique(
        entry.affectedRoutes,
        `/providers/${r.billingProviderSlug}`
      );
      addUnique(entry.affectedRoutes, "/pricing");
      addUnique(entry.affectedRoutes, "/sources");
    }
  }

  return Array.from(byUrl.values());
}

export function getEntitiesUsingCitation(
  citationUrl: string
): SourceUsageRecord | undefined {
  return getSourceUsageMap().find((r) => r.citation.url === citationUrl);
}

export function getSourcesByProvider(
  providerSlug: string
): SourceUsageRecord[] {
  return getSourceUsageMap().filter((r) =>
    r.providerSlugs.includes(providerSlug)
  );
}

export function getCitationImpactSummary(): CitationImpactSummary {
  const map = getSourceUsageMap();
  const summary: CitationImpactSummary = {
    totalCitations: map.length,
    freshCitations: 0,
    reviewDueCitations: 0,
    staleCitations: 0,
    unknownCitations: 0,
    citationsByProvider: {},
  };
  for (const r of map) {
    if (r.freshness === "fresh") summary.freshCitations += 1;
    else if (r.freshness === "review_due") summary.reviewDueCitations += 1;
    else if (r.freshness === "stale") summary.staleCitations += 1;
    else if (r.freshness === "unknown") summary.unknownCitations += 1;
    for (const slug of r.providerSlugs) {
      summary.citationsByProvider[slug] =
        (summary.citationsByProvider[slug] ?? 0) + 1;
    }
  }
  // Surface every catalogue provider, even if 0 citations.
  for (const p of providers) {
    if (!(p.slug in summary.citationsByProvider)) {
      summary.citationsByProvider[p.slug] = 0;
    }
  }
  return summary;
}
