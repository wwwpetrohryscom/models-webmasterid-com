import { siteConfig } from "./site-config";

/**
 * Pricing freshness policy.
 *
 * Sprint 20 reframes pricing data as a *source-backed reference* rather
 * than a live quote. Prices change frequently — vendors run promotional
 * discount windows, hosted platforms re-price hourly, marketplace
 * rates drift with capacity. Without a freshness signal the catalogue
 * would degrade silently as rows age. With one, every consumer (UI,
 * docs, integrity guard) can tell exactly how recently a row was
 * confirmed against the vendor&apos;s own page.
 *
 * The state is computed deterministically against `siteConfig.buildDate`
 * so the same build renders the same state everywhere. Build → state
 * transitions only happen on the next deploy, never mid-render.
 */
export type PricingFreshnessState =
  | "fresh"
  | "review_due"
  | "stale"
  | "unknown";

/**
 * Day thresholds. A row checked within `fresh` days renders as fresh;
 * within `reviewDue` days renders as review-due; beyond `stale` days
 * renders as stale. These are intentionally short for hosted pricing
 * (which moves fast) and the same boundaries apply to first-party
 * rates so the UX stays consistent — first-party rates can still move
 * (promotions, model retirements, regional adjustments).
 */
export const PRICING_FRESHNESS_DAYS = {
  fresh: 14,
  reviewDue: 30,
  stale: 45,
} as const;

const DAY_MS = 1000 * 60 * 60 * 24;

export function getPricingFreshness(
  lastCheckedAt: string | null | undefined,
  asOf: Date = new Date(siteConfig.buildDate)
): PricingFreshnessState {
  if (!lastCheckedAt) return "unknown";
  const checked = new Date(lastCheckedAt);
  if (Number.isNaN(checked.getTime())) return "unknown";
  const ageDays = (asOf.getTime() - checked.getTime()) / DAY_MS;
  // Future timestamps (e.g. retrievedAt later than the build) are
  // treated as fresh — a sanity floor; integrity guards block the
  // real case (a row backdated past the build).
  if (ageDays < 0) return "fresh";
  if (ageDays <= PRICING_FRESHNESS_DAYS.fresh) return "fresh";
  if (ageDays <= PRICING_FRESHNESS_DAYS.reviewDue) return "review_due";
  return "stale";
}

export function pricingFreshnessLabel(
  state: PricingFreshnessState
): string {
  switch (state) {
    case "fresh":
      return "Fresh";
    case "review_due":
      return "Review due";
    case "stale":
      return "Stale — re-verify";
    case "unknown":
      return "Unknown";
  }
}

/**
 * Tailwind class fragment for the freshness chip. Kept here so every
 * surface uses the same palette and a re-skin only touches one place.
 */
export function pricingFreshnessClasses(
  state: PricingFreshnessState
): string {
  switch (state) {
    case "fresh":
      return "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700";
    case "review_due":
      return "border border-amber-600/30 bg-amber-600/10 text-amber-700";
    case "stale":
      return "border border-red-600/30 bg-red-600/10 text-red-700";
    case "unknown":
      return "border border-border bg-muted text-muted-foreground";
  }
}

/**
 * Canonical user-facing volatility note. Imported by /pricing, model
 * pages, provider pages, and comparison pages so the same wording
 * appears everywhere — an integrity guard checks the literal.
 */
export const PRICING_VOLATILITY_NOTE =
  "Pricing is volatile and may change after retrieval. Treat prices as source-backed references, not live quotes.";

/**
 * Canonical no-ranking note. Hosted-pricing rows are reference fields,
 * not a comparison/ranking engine; this string appears on every
 * surface that could otherwise read as a price comparison.
 */
export const PRICING_NO_RANKING_NOTE =
  "Prices are shown as source-backed references only. WebmasterID Models does not rank models or billing providers by price.";
