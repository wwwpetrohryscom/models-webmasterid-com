import { models } from "@/data/models";
import { providers } from "@/data/providers";
import { hostedPricing } from "@/data/hosted-pricing";
import { comparisons } from "@/data/comparisons";
import { isVerified } from "./verified";
import { findObserver } from "./observers";
import { getHostedAvailability } from "./hosted-availability";
import {
  getReverificationQueue,
  getReverificationSummary,
} from "./reverification";
import { siteConfig } from "./site-config";

/**
 * Intelligence workspace summary.
 *
 * Sprint 22 unifies the entity-graph, freshness, and reverification
 * layers into one operator-facing summary used by `/intelligence` and
 * `/api/intelligence`. Every count is derived from the typed local
 * data layer — no remote fetch, no Date.now(), no env reads, no
 * runtime mutation.
 *
 * The summary deliberately reports *counts of verified state* —
 * never derived metrics like uptime percentages, scoreboard
 * rankings, or "cheapest provider" lists.
 */
export interface IntelligenceSummary {
  verifiedModels: number;
  partiallyVerifiedModels: number;
  activeModels: number;
  historicalModels: number;
  verifiedProviders: number;
  partialProviders: number;
  firstPartyPricingReferences: number;
  hostedPricingReferences: number;
  hostedAvailabilityRecords: number;
  twoSidedVerifiedComparisons: number;
  oneSidedVerifiedComparisons: number;
  pendingComparisons: number;
  statusObservers: number;
  sourceCitations: number;
  reverificationItems: number;
  reverificationCritical: number;
  reverificationHigh: number;
  blockedVendorDocs: number;
  buildDate: string;
}

export function getIntelligenceSummary(): IntelligenceSummary {
  const verifiedModels = models.filter(
    (m) => m.verificationStatus === "verified"
  ).length;
  const partiallyVerifiedModels = models.filter(
    (m) => m.verificationStatus === "partial"
  ).length;
  const historicalModels = models.filter((m) => {
    if (!isVerified(m.lifecycle)) return false;
    return (
      m.lifecycle.value.status === "retired" ||
      m.lifecycle.value.status === "deprecated"
    );
  }).length;
  const activeModels = models.filter((m) => {
    if (!isVerified(m.lifecycle)) return true;
    return m.lifecycle.value.status === "active";
  }).length;

  const verifiedProviders = providers.filter(
    (p) => p.verificationStatus === "verified"
  ).length;
  const partialProviders = providers.filter(
    (p) => p.verificationStatus === "partial"
  ).length;

  const firstPartyPricingReferences = models.flatMap((m) =>
    m.pricing.filter((t) => isVerified(t.amount))
  ).length;
  const hostedPricingReferences = hostedPricing.flatMap((r) =>
    r.tiers.filter((t) => isVerified(t.amount))
  ).length;

  const sideVerified = (slug: string) =>
    models.find((m) => m.slug === slug)?.verificationStatus === "verified";
  const twoSidedVerifiedComparisons = comparisons.filter(
    (c) => sideVerified(c.modelA) && sideVerified(c.modelB)
  ).length;
  const oneSidedVerifiedComparisons = comparisons.filter(
    (c) =>
      (sideVerified(c.modelA) || sideVerified(c.modelB)) &&
      !(sideVerified(c.modelA) && sideVerified(c.modelB))
  ).length;
  const pendingComparisons = comparisons.filter(
    (c) => !sideVerified(c.modelA) && !sideVerified(c.modelB)
  ).length;

  const statusObservers = providers.filter((p) =>
    Boolean(findObserver(p.slug))
  ).length;

  const citationUrls = new Set<string>();
  for (const m of models) {
    for (const c of m.citations) {
      citationUrls.add(c.url);
    }
  }

  const reverificationSummary = getReverificationSummary();

  return {
    verifiedModels,
    partiallyVerifiedModels,
    activeModels,
    historicalModels,
    verifiedProviders,
    partialProviders,
    firstPartyPricingReferences,
    hostedPricingReferences,
    hostedAvailabilityRecords: getHostedAvailability().length,
    twoSidedVerifiedComparisons,
    oneSidedVerifiedComparisons,
    pendingComparisons,
    statusObservers,
    sourceCitations: citationUrls.size,
    reverificationItems: reverificationSummary.total,
    reverificationCritical: reverificationSummary.critical,
    reverificationHigh: reverificationSummary.high,
    blockedVendorDocs: reverificationSummary.blocked,
    buildDate: siteConfig.buildDate,
  };
}

/**
 * Coverage health matrix — surfaced on `/intelligence` and
 * `/coverage` as a row-per-domain readiness view. Rows describe
 * verification breadth + freshness + primary action. No derived
 * health score.
 */
export interface CoverageHealthRow {
  domain:
    | "Models"
    | "Providers"
    | "Pricing"
    | "Hosted availability"
    | "Comparisons"
    | "Status"
    | "Sources"
    | "Reverification";
  verifiedOrAvailable: number;
  partialOrReviewDue: number;
  blockedOrMissing: number;
  primaryAction: string;
  primaryRoute: string;
}

export function getCoverageHealthMatrix(): CoverageHealthRow[] {
  const summary = getIntelligenceSummary();
  const queue = getReverificationQueue();

  const partialModels = models.filter(
    (m) => m.verificationStatus === "partial"
  ).length;
  const blockedModels = models.filter((m) => {
    if (m.verificationStatus !== "unverified") return false;
    return true;
  }).length;

  const partialPricingByReview = queue.filter(
    (q) => q.entityType === "pricing" && q.freshnessState === "review_due"
  ).length;
  const blockedPricing = queue.filter(
    (q) => q.entityType === "pricing" && q.freshnessState === "stale"
  ).length;

  const partialHostedByReview = queue.filter(
    (q) =>
      q.entityType === "hosted_pricing" && q.freshnessState === "review_due"
  ).length;
  const blockedHosted = queue.filter(
    (q) => q.entityType === "hosted_pricing" && q.freshnessState === "stale"
  ).length;

  const statusObserverGaps = queue.filter(
    (q) => q.entityType === "status_observer"
  ).length;

  const sourceReviewDue = queue.filter(
    (q) => q.entityType === "citation" && q.freshnessState === "review_due"
  ).length;
  const sourceStale = queue.filter(
    (q) => q.entityType === "citation" && q.freshnessState === "stale"
  ).length;

  return [
    {
      domain: "Models",
      verifiedOrAvailable: summary.verifiedModels,
      partialOrReviewDue: partialModels,
      blockedOrMissing: blockedModels,
      primaryAction: "Walk model cards in /models; review null metrics",
      primaryRoute: "/models",
    },
    {
      domain: "Providers",
      verifiedOrAvailable: summary.verifiedProviders,
      partialOrReviewDue: summary.partialProviders,
      blockedOrMissing: 0,
      primaryAction: "Confirm primary docs URLs in /providers",
      primaryRoute: "/providers",
    },
    {
      domain: "Pricing",
      verifiedOrAvailable: summary.firstPartyPricingReferences,
      partialOrReviewDue: partialPricingByReview,
      blockedOrMissing: blockedPricing,
      primaryAction:
        "Re-verify first-party pricing; references are not live quotes",
      primaryRoute: "/pricing",
    },
    {
      domain: "Hosted availability",
      verifiedOrAvailable: summary.hostedAvailabilityRecords,
      partialOrReviewDue: partialHostedByReview,
      blockedOrMissing: blockedHosted,
      primaryAction: "Confirm hosted model IDs and rates",
      primaryRoute: "/pricing",
    },
    {
      domain: "Comparisons",
      verifiedOrAvailable: summary.twoSidedVerifiedComparisons,
      partialOrReviewDue: summary.oneSidedVerifiedComparisons,
      blockedOrMissing: summary.pendingComparisons,
      primaryAction: "Two-sided verified comparisons are indexable",
      primaryRoute: "/compare",
    },
    {
      domain: "Status",
      verifiedOrAvailable: summary.statusObservers,
      partialOrReviewDue: statusObserverGaps,
      blockedOrMissing: 0,
      primaryAction:
        "Status pipeline reports vendor-reported observations only",
      primaryRoute: "/status",
    },
    {
      domain: "Sources",
      verifiedOrAvailable: summary.sourceCitations,
      partialOrReviewDue: sourceReviewDue,
      blockedOrMissing: sourceStale,
      primaryAction: "Re-fetch citations on the reverification queue",
      primaryRoute: "/sources",
    },
    {
      domain: "Reverification",
      verifiedOrAvailable: 0,
      partialOrReviewDue: summary.reverificationItems,
      blockedOrMissing: summary.blockedVendorDocs,
      primaryAction: "Work the queue manually; never auto-update",
      primaryRoute: "/reverification",
    },
  ];
}

/**
 * Review operations summary — the high-priority subset of the
 * reverification queue, grouped by reason for the intelligence
 * workspace panel.
 */
export interface ReviewOperationsSummary {
  highPriorityCount: number;
  blockedVendorDocs: number;
  pricingReviewDue: number;
  hostedPricingReviewDue: number;
  staleCitations: number;
  partialProviders: number;
  unverifiedModelMetrics: number;
}

export function getReviewOperationsSummary(): ReviewOperationsSummary {
  const q = getReverificationQueue();
  return {
    highPriorityCount: q.filter(
      (i) => i.priority === "critical" || i.priority === "high"
    ).length,
    blockedVendorDocs: q.filter((i) => i.reason === "blocked_vendor_docs")
      .length,
    pricingReviewDue: q.filter((i) => i.reason === "pricing_review_due")
      .length,
    hostedPricingReviewDue: q.filter(
      (i) => i.reason === "hosted_pricing_review_due"
    ).length,
    staleCitations: q.filter(
      (i) =>
        i.reason === "stale_citation" || i.reason === "source_review_due"
    ).length,
    partialProviders: q.filter(
      (i) => i.reason === "partial_provider_coverage"
    ).length,
    unverifiedModelMetrics: q.filter(
      (i) => i.reason === "unverified_model_metric"
    ).length,
  };
}

/**
 * Canonical list of workspace destinations rendered on
 * `/intelligence` and surfaced in `/api/intelligence`.
 */
export interface WorkspaceLink {
  label: string;
  href: string;
  description: string;
}

export function getWorkspaceLinks(): WorkspaceLink[] {
  return [
    {
      label: "Decision briefs",
      href: "/briefs/build",
      description:
        "Export source-backed evidence packs from selected models. Markdown or JSON.",
    },
    {
      label: "Guided demos",
      href: "/demos",
      description:
        "Three predefined route plans that walk the full workflow on real verified data.",
    },
    {
      label: "Model catalogue",
      href: "/models",
      description:
        "Every tracked model with verification status, pricing references, and lifecycle.",
    },
    {
      label: "Provider coverage",
      href: "/providers",
      description:
        "Model creators and hosting platforms with primary docs URLs and verification.",
    },
    {
      label: "Pricing references",
      href: "/pricing",
      description:
        "First-party and hosted pricing references with freshness chips. Not live quotes.",
    },
    {
      label: "Comparison clusters",
      href: "/compare",
      description:
        "Side-by-side reference pages — never a price-ranking or winner engine.",
    },
    {
      label: "Source registry",
      href: "/sources",
      description:
        "Every primary-source citation with retrievedAt and freshness state.",
    },
    {
      label: "Coverage map",
      href: "/coverage",
      description:
        "Verification breadth across every entity domain, plus the reverification summary.",
    },
    {
      label: "Status observations",
      href: "/status",
      description:
        "Vendor-reported status feed plus independent host probes. No uptime claim.",
    },
    {
      label: "Reverification queue",
      href: "/reverification",
      description:
        "Manual review queue for sources that have aged out. No auto-mutation.",
    },
    {
      label: "Research guides",
      href: "/research",
      description: "Methodology articles behind each verified field.",
    },
    {
      label: "Technical docs",
      href: "/docs",
      description: "Reference schemas, integrity rules, and field definitions.",
    },
  ];
}
