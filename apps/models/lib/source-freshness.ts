import { siteConfig } from "./site-config";

/**
 * Source freshness model.
 *
 * Sprint 21 generalises the Sprint 20 pricing-freshness helper into a
 * source-wide model that covers citations, model records, provider
 * records, status observers, verification attempts, and hosted
 * availability. Every freshness state is computed deterministically
 * against `siteConfig.buildDate` (not wall-clock `Date.now()`) so the
 * same build always renders the same state. State transitions happen
 * at deploy time, never mid-render.
 *
 * Stale ≠ false. Verified data does not stop being a citable record
 * just because the source has not been re-checked recently — it
 * becomes a candidate for the manual reverification queue. The
 * platform deliberately does NOT auto-mutate verified values; the
 * queue is informational and points a human reviewer at the next
 * source to re-check.
 */
export type FreshnessState =
  | "fresh"
  | "review_due"
  | "stale"
  | "blocked"
  | "unknown";

export type FreshnessPriority = "low" | "medium" | "high" | "critical";

export type ReverificationReason =
  | "pricing_review_due"
  | "source_review_due"
  | "hosted_pricing_review_due"
  | "blocked_vendor_docs"
  | "partial_provider_coverage"
  | "unverified_model_metric"
  | "status_observer_missing"
  | "manual_browser_required"
  | "stale_citation"
  | "unknown_last_checked";

/**
 * Day thresholds. Two cadences are encoded:
 *
 *   - "standard"   — general source freshness (citations, model
 *                    records, providers, status sources)
 *   - "pricing"    — pricing rows, which move faster than docs;
 *                    inherits Sprint 20's PRICING_FRESHNESS_DAYS
 *
 * Plus a `blockedRetry` window — how long to wait before re-attempting
 * a vendor URL that previously returned 403 / 401 / 429 / JS-required.
 */
export const SOURCE_FRESHNESS_DAYS = {
  standardFresh: 30,
  standardReviewDue: 60,
  standardStale: 90,
  pricingFresh: 14,
  pricingReviewDue: 30,
  pricingStale: 45,
  blockedRetry: 30,
} as const;

const DAY_MS = 1000 * 60 * 60 * 24;

export type FreshnessCategory =
  | "pricing"
  | "hosted_pricing"
  | "source"
  | "model"
  | "provider"
  | "status";

export type FreshnessVolatility = "high" | "medium" | "low" | "unknown";

export function daysSince(
  date: string | null | undefined,
  asOf: Date = new Date(siteConfig.buildDate)
): number | null {
  if (!date) return null;
  const checked = new Date(date);
  if (Number.isNaN(checked.getTime())) return null;
  return (asOf.getTime() - checked.getTime()) / DAY_MS;
}

export function getFreshnessState(
  date: string | null | undefined,
  options: {
    volatility?: FreshnessVolatility;
    category?: FreshnessCategory;
  } = {}
): FreshnessState {
  const age = daysSince(date);
  if (age === null) return "unknown";
  // Future timestamps are sanity-clamped to fresh.
  if (age < 0) return "fresh";

  const usePricingCadence =
    options.category === "pricing" ||
    options.category === "hosted_pricing" ||
    options.volatility === "high";

  if (usePricingCadence) {
    if (age <= SOURCE_FRESHNESS_DAYS.pricingFresh) return "fresh";
    if (age <= SOURCE_FRESHNESS_DAYS.pricingReviewDue) return "review_due";
    return "stale";
  }

  if (age <= SOURCE_FRESHNESS_DAYS.standardFresh) return "fresh";
  if (age <= SOURCE_FRESHNESS_DAYS.standardReviewDue) return "review_due";
  return "stale";
}

export function freshnessLabel(state: FreshnessState): string {
  switch (state) {
    case "fresh":
      return "Fresh";
    case "review_due":
      return "Review due";
    case "stale":
      return "Stale";
    case "blocked":
      return "Blocked";
    case "unknown":
      return "Unknown";
  }
}

export function freshnessClasses(state: FreshnessState): string {
  switch (state) {
    case "fresh":
      return "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700";
    case "review_due":
      return "border border-amber-600/30 bg-amber-600/10 text-amber-700";
    case "stale":
      return "border border-red-600/30 bg-red-600/10 text-red-700";
    case "blocked":
      return "border border-purple-600/30 bg-purple-600/10 text-purple-700";
    case "unknown":
      return "border border-border bg-muted text-muted-foreground";
  }
}

/**
 * Map a freshness state + (optional) reason to a review priority.
 * Used to order the reverification queue. Conservative by default:
 *
 *   - stale + pricing/hosted_pricing  → critical
 *   - stale + manual_browser_required → high
 *   - stale + anything else           → high
 *   - review_due + pricing            → high
 *   - review_due + anything else      → medium
 *   - blocked                         → high (until the source unblocks)
 *   - unknown_last_checked            → medium
 *   - fresh / fresh-like              → low
 */
export function freshnessPriority(
  state: FreshnessState,
  reason?: ReverificationReason
): FreshnessPriority {
  if (state === "stale") {
    if (
      reason === "pricing_review_due" ||
      reason === "hosted_pricing_review_due"
    ) {
      return "critical";
    }
    return "high";
  }
  if (state === "review_due") {
    if (
      reason === "pricing_review_due" ||
      reason === "hosted_pricing_review_due"
    ) {
      return "high";
    }
    return "medium";
  }
  if (state === "blocked") return "high";
  if (state === "unknown") {
    if (reason === "unknown_last_checked") return "medium";
    return "low";
  }
  return "low";
}

export function priorityLabel(priority: FreshnessPriority): string {
  switch (priority) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
  }
}

export function priorityClasses(priority: FreshnessPriority): string {
  switch (priority) {
    case "critical":
      return "border border-red-600/40 bg-red-600/15 text-red-700";
    case "high":
      return "border border-amber-600/40 bg-amber-600/15 text-amber-700";
    case "medium":
      return "border border-blue-600/30 bg-blue-600/10 text-blue-700";
    case "low":
      return "border border-border bg-muted text-muted-foreground";
  }
}

/**
 * Compare priorities for sorting (highest first).
 */
export function comparePriorityDesc(
  a: FreshnessPriority,
  b: FreshnessPriority
): number {
  const order: Record<FreshnessPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return order[a] - order[b];
}

/**
 * Reason → human-readable explanation used by the queue UI and the
 * machine-readable API.
 */
export function reasonLabel(reason: ReverificationReason): string {
  switch (reason) {
    case "pricing_review_due":
      return "Pricing review due";
    case "source_review_due":
      return "Source review due";
    case "hosted_pricing_review_due":
      return "Hosted pricing review due";
    case "blocked_vendor_docs":
      return "Vendor docs blocked";
    case "partial_provider_coverage":
      return "Provider coverage partial";
    case "unverified_model_metric":
      return "Unverified model metric";
    case "status_observer_missing":
      return "Status observer missing";
    case "manual_browser_required":
      return "Manual browser pass required";
    case "stale_citation":
      return "Stale citation";
    case "unknown_last_checked":
      return "Unknown last-checked";
  }
}

/**
 * Canonical user-facing note that appears on every surface that
 * renders queue items. Imported by /reverification, /coverage, and
 * /sources so the wording stays consistent.
 */
export const REVERIFICATION_POLICY_NOTE =
  "The reverification queue is informational. WebmasterID Models does not automatically scrape vendor sources, does not mutate verified values, and does not publish unreviewed fetched data. Queue items point a human reviewer at the next source to re-check.";
