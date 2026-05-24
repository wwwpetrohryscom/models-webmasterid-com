import type { ModelUseCaseSlug } from "./use-cases";
import { getUseCaseShortlist } from "./model-shortlists";
import { hostedPricing } from "@/data/hosted-pricing";
import { comparisonBuilderUrl } from "./comparison-builder";
import { decisionBriefUrl } from "./decision-briefs";

/**
 * Guided demo definitions.
 *
 * Sprint 27 packages the existing workflow surfaces into predefined
 * navigation recipes. A demo is a route plan + a model set + a
 * commentary string — never a recommendation, never a ranking,
 * never a verdict. Pure local derivation; no fetch.
 *
 * Each demo:
 *   - is anchored to one of the existing model use cases
 *   - lists the model slugs the demo will walk through (drawn from
 *     the typed catalogue — no fabricated entries)
 *   - exposes the primary route plan the visitor should follow
 *   - declares the verified fields the demo intends to inspect
 *   - carries a per-demo policy note that re-states what the demo
 *     does NOT assert
 */

export type GuidedDemoSlug =
  | "long-context-analysis"
  | "hosted-inference"
  | "governance-review";

export interface GuidedDemoRoute {
  label: string;
  href: string;
  purpose: string;
}

export interface GuidedDemo {
  slug: GuidedDemoSlug;
  title: string;
  description: string;
  useCaseSlug: ModelUseCaseSlug;
  modelSlugs: string[];
  primaryRoutes: GuidedDemoRoute[];
  evidenceFields: string[];
  policyNote: string;
}

const DEMO_CAP = 4;

function topShortlistSlugs(slug: ModelUseCaseSlug): string[] {
  return getUseCaseShortlist(slug)
    .slice(0, DEMO_CAP)
    .map((e) => e.model.slug);
}

function buildRoutes(input: {
  useCaseSlug: ModelUseCaseSlug;
  selectExtra?: Record<string, string>;
  modelSlugs: string[];
  includeReverification?: boolean;
}): GuidedDemoRoute[] {
  const select = new URLSearchParams({
    useCase: input.useCaseSlug,
    ...(input.selectExtra ?? {}),
  });
  const routes: GuidedDemoRoute[] = [
    {
      label: "Read the use-case guide",
      href: `/use-cases/${input.useCaseSlug}`,
      purpose:
        "Name which verified fields matter for this workflow before picking candidates.",
    },
    {
      label: "Open the selection workspace",
      href: `/select?${select.toString()}`,
      purpose:
        "Narrow a source-backed shortlist with the use-case filter pre-applied.",
    },
    {
      label: "Compare verified fields",
      href: comparisonBuilderUrl({
        modelSlugs: input.modelSlugs,
        useCase: input.useCaseSlug,
      }),
      purpose:
        "Render the selected models side by side from the verified data layer.",
    },
    {
      label: "Generate an evidence brief",
      href: decisionBriefUrl({
        modelSlugs: input.modelSlugs,
        useCase: input.useCaseSlug,
      }),
      purpose:
        "Export a paste-ready evidence pack (Markdown or JSON).",
    },
    {
      label: "Inspect sources + freshness",
      href: "/sources",
      purpose:
        "Open every primary-source citation referenced by the selected models.",
    },
  ];
  if (input.includeReverification) {
    routes.push({
      label: "Open the reverification queue",
      href: "/reverification",
      purpose:
        "Walk every source due for manual re-check — useful for due-diligence flows.",
    });
  }
  return routes;
}

// ---------------------------------------------------------------------------
// Demo construction. modelSlugs are derived from the typed catalogue
// helpers, never hand-written, so the demo stays honest as the data
// layer grows.
// ---------------------------------------------------------------------------

function buildLongContextDemo(): GuidedDemo {
  const modelSlugs = topShortlistSlugs("long-context-analysis");
  return {
    slug: "long-context-analysis",
    title: "Long-context analysis",
    description:
      "Walk a long-context (≥200k-token) workload: pick the use case, narrow a shortlist by verified context window, compare the candidates side by side, and export an evidence brief. Pricing tier references for prompts >200k are flagged on the comparison; the brief surfaces every data gap explicitly.",
    useCaseSlug: "long-context-analysis",
    modelSlugs,
    primaryRoutes: buildRoutes({
      useCaseSlug: "long-context-analysis",
      modelSlugs,
    }),
    evidenceFields: [
      "context window",
      "max output tokens",
      "modality channels",
      "first-party pricing references",
      "pricing freshness",
      "source citations",
    ],
    policyNote:
      "Demo only — the catalogue does not assert which long-context model is best for any particular workload. Inspect verified context + pricing fields, then run task-specific tests in your own environment.",
  };
}

function buildHostedInferenceDemo(): GuidedDemo {
  // Pull every model with a hosted-pricing record. Stable order
  // (catalogue order from hosted-pricing.ts).
  const hostedSlugs = Array.from(
    new Set(hostedPricing.map((r) => r.modelSlug))
  ).slice(0, DEMO_CAP);
  return {
    slug: "hosted-inference",
    title: "Hosted inference",
    description:
      "Walk a hosted-inference workflow where the model creator does not run a paid first-party API. Pick the use case, narrow the shortlist to models with verified hosted availability, then compare hosted pricing references side by side. The brief separates the hosting platform (billing provider) from the model creator at every step.",
    useCaseSlug: "hosted-inference",
    modelSlugs: hostedSlugs,
    primaryRoutes: buildRoutes({
      useCaseSlug: "hosted-inference",
      selectExtra: { hostedAvailability: "true" },
      modelSlugs: hostedSlugs,
    }),
    evidenceFields: [
      "hosted availability record (host × model)",
      "hosted model ID",
      "billing provider",
      "model creator",
      "hosted pricing references + freshness",
    ],
    policyNote:
      "Hosted pricing is set by the hosting platform — not by the model creator. The demo does NOT rank hosting platforms by price. Always re-verify the platform's own pricing page before commitment.",
  };
}

function buildGovernanceReviewDemo(): GuidedDemo {
  // Use the verified-side governance shortlist. Includes
  // reverification queue link because that is the natural next stop
  // for a governance review.
  const modelSlugs = topShortlistSlugs("governance-review");
  return {
    slug: "governance-review",
    title: "Governance review",
    description:
      "Walk an internal AI-inventory + source-backed due-diligence flow. Pick the use case, narrow a shortlist with verified citations, compare verification state side by side, then generate an evidence brief that lists every data gap and stale citation explicitly. The reverification queue is the natural next stop.",
    useCaseSlug: "governance-review",
    modelSlugs,
    primaryRoutes: buildRoutes({
      useCaseSlug: "governance-review",
      modelSlugs,
      includeReverification: true,
    }),
    evidenceFields: [
      "verification status",
      "lifecycle status",
      "source citations with retrievedAt",
      "freshness state",
      "provider coverage",
      "reverification queue entries",
    ],
    policyNote:
      "Verification status describes citations on a date — it does not assert regulatory compliance, certification, or fitness for any specific regulatory regime. The demo is a starting point for due diligence, not a substitute for legal or compliance review.",
  };
}

// Cached at module-load time. Pure local read; safe.
const DEMOS: GuidedDemo[] = [
  buildLongContextDemo(),
  buildHostedInferenceDemo(),
  buildGovernanceReviewDemo(),
];

export function getGuidedDemos(): GuidedDemo[] {
  return DEMOS;
}

export function getGuidedDemo(
  slug: string
): GuidedDemo | undefined {
  return DEMOS.find((d) => d.slug === slug);
}

export function getGuidedDemoRoutes(
  slug: string
): GuidedDemoRoute[] {
  return getGuidedDemo(slug)?.primaryRoutes ?? [];
}
