import { models } from "@/data/models";
import { providers } from "@/data/providers";
import { hostedPricing } from "@/data/hosted-pricing";
import { verificationAttempts } from "@/data/verification-attempts";
import { isVerified } from "./verified";
import { findObserver } from "./observers";
import {
  comparePriorityDesc,
  freshnessPriority,
  getFreshnessState,
  type FreshnessPriority,
  type FreshnessState,
  type ReverificationReason,
  SOURCE_FRESHNESS_DAYS,
} from "./source-freshness";

/**
 * Reverification queue builder.
 *
 * Pure, deterministic, network-free read across the typed local data
 * layer. The queue points a human reviewer at the next source to
 * re-check; nothing in this module fetches remote data, mutates
 * verified fields, or publishes unreviewed values. Every queue item
 * carries a citation back to the on-disk record that triggered it so
 * the reviewer can resolve the item without guessing.
 *
 * Sources walked (Sprint 21):
 *   - hosted-pricing rows whose `lastCheckedAt` puts them past the
 *     pricing freshness window
 *   - first-party pricing rows on each model record, same window
 *   - citations in `data/citations.ts` past the standard window
 *   - blocked verification-attempts past the `blockedRetry` window
 *   - providers with verificationStatus = "partial"
 *   - status providers without an observer wired
 *   - model records that carry many null verified fields but
 *     still produce indexable pages
 */

export type ReverificationEntityType =
  | "model"
  | "provider"
  | "pricing"
  | "hosted_pricing"
  | "citation"
  | "comparison"
  | "status_observer"
  | "verification_attempt";

export interface ReverificationQueueItem {
  id: string;
  entityType: ReverificationEntityType;
  entitySlug?: string;
  providerSlug?: string;
  title: string;
  reason: ReverificationReason;
  freshnessState: FreshnessState;
  priority: FreshnessPriority;
  lastCheckedAt?: string | null;
  sourceUrl?: string;
  sourceName?: string;
  affectedRoutes: string[];
  suggestedAction: string;
  blockedReason?: string;
}

interface BuildQueueArgs {
  state: FreshnessState;
  reason: ReverificationReason;
}

function priorityFor({ state, reason }: BuildQueueArgs): FreshnessPriority {
  return freshnessPriority(state, reason);
}

/**
 * Build the full reverification queue. Ordered by priority desc, then
 * by entityType for stability.
 */
export function getReverificationQueue(): ReverificationQueueItem[] {
  const items: ReverificationQueueItem[] = [];

  // ---- 1. First-party pricing rows on model records --------------------
  for (const m of models) {
    const hasVerifiedPricing = m.pricing.some((t) => isVerified(t.amount));
    if (!hasVerifiedPricing) continue;
    const state = getFreshnessState(m.lastCheckedAt, {
      category: "pricing",
    });
    if (state !== "review_due" && state !== "stale") continue;
    const sourceTier = m.pricing.find((t) => isVerified(t.amount));
    const sourceCitation =
      sourceTier && isVerified(sourceTier.amount)
        ? sourceTier.amount.citation
        : undefined;
    items.push({
      id: `pricing-${m.slug}`,
      entityType: "pricing",
      entitySlug: m.slug,
      providerSlug: m.providerSlug,
      title: `${m.name} — first-party pricing`,
      reason: "pricing_review_due",
      freshnessState: state,
      priority: priorityFor({ state, reason: "pricing_review_due" }),
      lastCheckedAt: m.lastCheckedAt,
      sourceUrl: sourceCitation?.url,
      sourceName: sourceCitation?.name,
      affectedRoutes: [
        `/models/${m.slug}`,
        `/pricing?provider=${m.providerSlug}`,
        "/pricing",
      ],
      suggestedAction: `Re-fetch ${sourceCitation?.name ?? m.providerSlug + " pricing"} and confirm input/output/cache rates. Update lastCheckedAt and per-tier citation retrievedAt only after a manual review.`,
    });
  }

  // ---- 2. Hosted-pricing rows ----------------------------------------
  for (const r of hostedPricing) {
    const state = getFreshnessState(r.lastCheckedAt, {
      category: "hosted_pricing",
      volatility: r.volatility,
    });
    if (state !== "review_due" && state !== "stale") continue;
    items.push({
      id: r.id,
      entityType: "hosted_pricing",
      entitySlug: r.modelSlug,
      providerSlug: r.billingProviderSlug,
      title: `${r.modelSlug} on ${r.billingProviderSlug} — hosted pricing reference`,
      reason: "hosted_pricing_review_due",
      freshnessState: state,
      priority: priorityFor({
        state,
        reason: "hosted_pricing_review_due",
      }),
      lastCheckedAt: r.lastCheckedAt,
      sourceUrl: r.citation?.url,
      sourceName: r.citation?.name,
      affectedRoutes: [
        `/models/${r.modelSlug}`,
        `/providers/${r.billingProviderSlug}`,
        "/pricing",
      ],
      suggestedAction: `Re-fetch ${r.citation?.name ?? r.billingProviderSlug + " pricing"} and confirm the per-1M input/output/cache rates for hosted model ID ${r.hostedModelId ?? "(unknown)"}. Hosted pricing is high-volatility; reverify cadence is ${SOURCE_FRESHNESS_DAYS.pricingReviewDue}d.`,
    });
  }

  // ---- 3. Citations past the standard freshness window ---------------
  const seenCitationUrls = new Set<string>();
  for (const m of models) {
    for (const c of m.citations) {
      if (seenCitationUrls.has(c.url)) continue;
      seenCitationUrls.add(c.url);
      const state = getFreshnessState(c.retrievedAt, {
        category: "source",
      });
      if (state !== "review_due" && state !== "stale") continue;
      items.push({
        id: `citation-${m.providerSlug}-${encodeURIComponent(c.url)}`,
        entityType: "citation",
        providerSlug: m.providerSlug,
        title: `${c.name}`,
        reason: state === "stale" ? "stale_citation" : "source_review_due",
        freshnessState: state,
        priority: priorityFor({
          state,
          reason:
            state === "stale" ? "stale_citation" : "source_review_due",
        }),
        lastCheckedAt: c.retrievedAt,
        sourceUrl: c.url,
        sourceName: c.name,
        affectedRoutes: [
          `/providers/${m.providerSlug}`,
          `/sources?provider=${m.providerSlug}`,
          "/sources",
        ],
        suggestedAction: `Re-fetch the source page (${c.url}); update retrievedAt on the citation in data/citations.ts only after a manual review confirms the underlying values still match.`,
      });
    }
  }

  // ---- 4. Blocked verification attempts past blockedRetry ------------
  for (const a of verificationAttempts) {
    const isBlocked = a.result.startsWith("blocked-");
    if (!isBlocked) continue;
    // Surface every blocked attempt regardless of age — blocked
    // sources stay in the queue until they unblock OR a non-blocked
    // attempt with a more recent timestamp is logged.
    const newerSuccess = verificationAttempts.find(
      (x) =>
        x.providerSlug === a.providerSlug &&
        x.url === a.url &&
        x.result === "verified" &&
        new Date(x.attemptedAt).getTime() >
          new Date(a.attemptedAt).getTime()
    );
    if (newerSuccess) continue;
    items.push({
      id: `blocked-${a.providerSlug}-${encodeURIComponent(a.url)}-${a.attemptedAt}`,
      entityType: "verification_attempt",
      providerSlug: a.providerSlug,
      title: `${a.providerSlug}: ${a.target}`,
      reason: "blocked_vendor_docs",
      freshnessState: "blocked",
      priority: priorityFor({
        state: "blocked",
        reason: "blocked_vendor_docs",
      }),
      lastCheckedAt: a.attemptedAt,
      sourceUrl: a.url,
      affectedRoutes: [
        `/providers/${a.providerSlug}`,
        `/coverage`,
        "/sources",
      ],
      suggestedAction:
        a.result === "blocked-403" || a.result === "blocked-401"
          ? `Vendor docs returned ${a.result.toUpperCase()} to automated retrieval. A manual browser pass is required to verify and a re-attempt is suggested every ${SOURCE_FRESHNESS_DAYS.blockedRetry} days.`
          : `Retrieval blocked (${a.result}). Retry the source manually; record a fresh verification attempt with the outcome.`,
      blockedReason: a.result,
    });
  }

  // ---- 5. Providers with partial verification -----------------------
  for (const p of providers) {
    if (p.verificationStatus !== "partial") continue;
    items.push({
      id: `provider-partial-${p.slug}`,
      entityType: "provider",
      providerSlug: p.slug,
      title: `${p.name} — partial provider coverage`,
      reason: "partial_provider_coverage",
      freshnessState: "review_due",
      priority: priorityFor({
        state: "review_due",
        reason: "partial_provider_coverage",
      }),
      lastCheckedAt: p.lastCheckedAt,
      sourceUrl: p.docsUrl ?? p.website ?? undefined,
      sourceName: p.docsUrl ? `${p.name} docs` : undefined,
      affectedRoutes: [`/providers/${p.slug}`, "/providers", "/coverage"],
      suggestedAction: `Walk ${p.name}'s primary docs (${p.docsUrl ?? "no docs URL recorded"}) and update model records whose metric fields are still null. Re-record verification attempts with up-to-date outcomes.`,
    });
  }

  // ---- 6. Status providers without an observer ----------------------
  for (const p of providers) {
    if (p.verificationStatus !== "verified") continue;
    if (!p.statusPageUrl) continue;
    const observer = findObserver(p.slug);
    if (observer) continue;
    items.push({
      id: `status-observer-missing-${p.slug}`,
      entityType: "status_observer",
      providerSlug: p.slug,
      title: `${p.name} — status observer missing`,
      reason: "status_observer_missing",
      freshnessState: "review_due",
      priority: priorityFor({
        state: "review_due",
        reason: "status_observer_missing",
      }),
      sourceUrl: p.statusPageUrl,
      sourceName: `${p.name} status page`,
      affectedRoutes: [`/providers/${p.slug}`, "/status"],
      suggestedAction: `Add a vendor-status observer for ${p.name} in lib/observers/. The status page URL is recorded; no live monitoring is wired.`,
    });
  }

  // ---- 7. Verified-but-thin model records ---------------------------
  for (const m of models) {
    if (m.verificationStatus !== "verified") continue;
    const nullCount =
      (isVerified(m.maxOutputTokens) ? 0 : 1) +
      (isVerified(m.modality) ? 0 : 1) +
      (isVerified(m.knowledgeCutoff) ? 0 : 1) +
      (isVerified(m.contextWindow) ? 0 : 1) +
      (isVerified(m.releaseDate) ? 0 : 1);
    if (nullCount < 3) continue;
    items.push({
      id: `model-thin-${m.slug}`,
      entityType: "model",
      entitySlug: m.slug,
      providerSlug: m.providerSlug,
      title: `${m.name} — multiple unverified metrics`,
      reason: "unverified_model_metric",
      freshnessState: "review_due",
      priority: priorityFor({
        state: "review_due",
        reason: "unverified_model_metric",
      }),
      lastCheckedAt: m.lastCheckedAt,
      sourceUrl: m.sourceUrl ?? undefined,
      sourceName: m.sourceName ?? undefined,
      affectedRoutes: [`/models/${m.slug}`, `/providers/${m.providerSlug}`],
      suggestedAction: `${nullCount} of the canonical model metrics (max output, modality, knowledge cutoff, context window, release date) remain null. Walk the model card source (${m.sourceUrl ?? "no source recorded"}) and add verified values where the vendor page publishes them.`,
    });
  }

  // Sort: priority desc, then entityType asc for stability.
  items.sort((a, b) => {
    const p = comparePriorityDesc(a.priority, b.priority);
    if (p !== 0) return p;
    return a.entityType.localeCompare(b.entityType);
  });
  return items;
}

export function getReverificationQueueByProvider(
  providerSlug: string
): ReverificationQueueItem[] {
  return getReverificationQueue().filter(
    (item) => item.providerSlug === providerSlug
  );
}

export function getHighPriorityReverificationItems(): ReverificationQueueItem[] {
  return getReverificationQueue().filter(
    (item) => item.priority === "critical" || item.priority === "high"
  );
}

export interface ReverificationSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  stale: number;
  reviewDue: number;
  blocked: number;
  pricing: number;
  hostedPricing: number;
  blockedVendors: number;
}

export function getReverificationSummary(): ReverificationSummary {
  const q = getReverificationQueue();
  const blockedVendors = new Set(
    q
      .filter((i) => i.freshnessState === "blocked")
      .map((i) => i.providerSlug ?? "")
  );
  blockedVendors.delete("");
  return {
    total: q.length,
    critical: q.filter((i) => i.priority === "critical").length,
    high: q.filter((i) => i.priority === "high").length,
    medium: q.filter((i) => i.priority === "medium").length,
    low: q.filter((i) => i.priority === "low").length,
    stale: q.filter((i) => i.freshnessState === "stale").length,
    reviewDue: q.filter((i) => i.freshnessState === "review_due").length,
    blocked: q.filter((i) => i.freshnessState === "blocked").length,
    pricing: q.filter((i) => i.entityType === "pricing").length,
    hostedPricing: q.filter((i) => i.entityType === "hosted_pricing").length,
    blockedVendors: blockedVendors.size,
  };
}
