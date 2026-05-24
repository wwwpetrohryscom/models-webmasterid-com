/**
 * Content graph registry.
 *
 * Single source of truth for the research + docs content layer. The
 * `/research` and `/docs` hub pages, the sitemap, the llms.txt route,
 * `/api/site`, and the integrity guards all read from this module so
 * the lists cannot drift.
 *
 * Adding a new content page is a registry entry plus a route file. No
 * other surface needs an update.
 *
 * Discipline:
 *   - Every entry must be either a methodology / educational page or a
 *     reference / data-model page. No marketing prose, no winner
 *     claims, no fabricated metrics.
 *   - Pages may cite verified facts only via the existing citation
 *     registry. If a metric is not yet verified anywhere in the data
 *     layer, the page must frame it as methodology, not as a claim.
 *   - Pages with thin content stay out of the registry until they are
 *     genuinely useful (≥ ~700 words for guides; reference pages may be
 *     shorter when concise is appropriate).
 */

export type ContentSection =
  | "research-guides"
  | "methodology"
  | "infrastructure-explainers"
  | "verification-policy"
  | "data-model"
  | "data-verification"
  | "pricing-docs"
  | "status-docs"
  | "comparison-docs";

export type ContentJsonLdType = "Article" | "TechArticle";

export interface ContentPage {
  /** Route segment without trailing slash (e.g. "/research/model-selection"). */
  slug: string;
  /** Title used in metadata, breadcrumbs, and the hub card. */
  title: string;
  /** One-sentence description used in metadata + the hub card. */
  description: string;
  /** Which family this page belongs to (drives hub grouping). */
  section: ContentSection;
  /** Last-edited date in ISO format. Bumped by the author per pass. */
  updatedDate: string;
  /** Stable list of internal routes this page links to. Surfaces on the page. */
  relatedRoutes: string[];
  /** Long-tail keywords. Informational; not stuffed into copy. */
  keywords: string[];
  /** Whether the page should appear in sitemap / llms.txt. */
  indexable: boolean;
  /** schema.org type for the page-level JSON-LD. */
  jsonLdType: ContentJsonLdType;
}

export const contentPages: ContentPage[] = [
  // -------------------------------------------------------------------
  // Research guides
  // -------------------------------------------------------------------
  {
    slug: "/research/model-selection",
    title: "Choosing an AI model: a verified-data approach",
    description:
      "A practical, source-aware framework for selecting an AI model — covering provider, pricing, context window, output limits, modality, lifecycle, and reliability signals.",
    section: "research-guides",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/models",
      "/compare",
      "/pricing",
      "/coverage",
      "/docs/model-page-schema",
      "/research/api-pricing-methodology",
    ],
    keywords: [
      "ai model selection",
      "compare ai models",
      "ai api selection",
      "model evaluation",
    ],
    indexable: true,
    jsonLdType: "Article",
  },
  {
    slug: "/research/api-pricing-methodology",
    title: "API pricing methodology: what the rows on /pricing mean",
    description:
      "How WebmasterID Models tracks AI API pricing — input tokens, output tokens, cache write windows, cache reads, per-hour cache storage, batch tiers — and why provider pricing cannot always be normalised into a single number.",
    section: "research-guides",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/pricing",
      "/docs/pricing-fields",
      "/sources",
      "/research/model-selection",
    ],
    keywords: [
      "ai api pricing",
      "token pricing",
      "cache pricing",
      "batch api pricing",
    ],
    indexable: true,
    jsonLdType: "Article",
  },
  {
    slug: "/research/model-context-windows",
    title: "Context windows in practice",
    description:
      "What a context window actually means for production workloads, why a million-token window on one provider is not the same as a million-token window on another, and how WebmasterID Models verifies the number.",
    section: "research-guides",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/models",
      "/pricing",
      "/docs/model-page-schema",
      "/research/api-pricing-methodology",
    ],
    keywords: [
      "ai context window",
      "1m context window",
      "context window comparison",
    ],
    indexable: true,
    jsonLdType: "Article",
  },
  {
    slug: "/research/model-output-limits",
    title: "Output token limits and what they constrain",
    description:
      "Why max output tokens is a separate dimension from the context window, how it shapes long-form generation, agentic workflows, and structured output, and which models publish what.",
    section: "research-guides",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/models",
      "/research/model-context-windows",
      "/docs/model-page-schema",
    ],
    keywords: [
      "max output tokens",
      "ai output limit",
      "structured output limits",
    ],
    indexable: true,
    jsonLdType: "Article",
  },
  {
    slug: "/research/ai-provider-status-monitoring",
    title: "AI provider status monitoring: vendor signals vs independent probes",
    description:
      "How WebmasterID Models separates vendor-reported status, independent HTTP probes, and computed uptime windows — and why no uptime percentage is published without durable observations.",
    section: "research-guides",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/status",
      "/coverage",
      "/sources",
      "/docs/status-observations",
    ],
    keywords: [
      "ai api status",
      "ai api uptime monitoring",
      "anthropic api status",
      "gemini status",
    ],
    indexable: true,
    jsonLdType: "Article",
  },
  {
    slug: "/research/benchmark-limitations",
    title: "Why benchmark scores need source discipline",
    description:
      "Benchmark scores are useful only when their provenance, dataset, and prompt protocol are documented. This page explains why WebmasterID Models does not republish unsourced provider-reported scores.",
    section: "research-guides",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/benchmarks",
      "/coverage",
      "/research/source-verification-methodology",
    ],
    keywords: [
      "ai benchmark limitations",
      "llm benchmark contamination",
      "benchmark methodology",
    ],
    indexable: true,
    jsonLdType: "Article",
  },
  {
    slug: "/research/inference-infrastructure",
    title: "AI inference infrastructure — fields, gaps, and roadmap",
    description:
      "Regions, cloud availability, status feeds, batching, caching, rate limits, throughput — the infrastructure dimensions a verified catalogue cares about, and which fields remain unverified today.",
    section: "research-guides",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/infrastructure",
      "/status",
      "/coverage",
      "/docs/provider-coverage",
    ],
    keywords: [
      "ai inference infrastructure",
      "ai api regions",
      "ai api rate limits",
    ],
    indexable: true,
    jsonLdType: "Article",
  },
  {
    slug: "/research/source-verification-methodology",
    title: "Source verification methodology",
    description:
      "How primary-source citations, retrieval timestamps, and verification statuses are encoded so every metric on this site traces to a source — or is suppressed entirely.",
    section: "verification-policy",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/sources",
      "/coverage",
      "/docs/data-verification",
    ],
    keywords: [
      "ai data source verification",
      "primary source citations",
      "ai data integrity",
    ],
    indexable: true,
    jsonLdType: "Article",
  },

  // -------------------------------------------------------------------
  // Docs / reference
  // -------------------------------------------------------------------
  {
    slug: "/docs/data-verification",
    title: "Data verification reference",
    description:
      "Reference for the verification state machine: VerifiedField, MaybeVerified, citation requirements, the canonical unverified-data label, and what content can and cannot be rendered.",
    section: "data-verification",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/sources",
      "/coverage",
      "/docs/model-page-schema",
      "/research/source-verification-methodology",
    ],
    keywords: ["verifiedfield", "data verification", "primary source citation"],
    indexable: true,
    jsonLdType: "TechArticle",
  },
  {
    slug: "/docs/decision-briefs",
    title: "Decision briefs",
    description:
      "What a decision brief is, how it differs from a recommendation, the verified fields it captures, the data gaps it surfaces, the source trail and freshness notes it carries, and the Markdown / JSON export formats.",
    section: "data-verification",
    updatedDate: "2026-05-24",
    relatedRoutes: [
      "/briefs/build",
      "/select",
      "/compare/build",
      "/docs/decision-workflow",
      "/research/source-verification-methodology",
      "/coverage",
      "/sources",
    ],
    keywords: [
      "decision brief",
      "evidence pack",
      "model selection report",
      "markdown export",
      "json export",
      "no recommendation",
    ],
    indexable: true,
    jsonLdType: "TechArticle",
  },
  {
    slug: "/docs/decision-workflow",
    title: "Decision workflow",
    description:
      "How WebmasterID Models supports model-selection decisions without ranking, recommendation, or winner claims — use cases first, source-backed shortlist, side-by-side verified comparison, explicit data gaps, source freshness, then external testing.",
    section: "data-verification",
    updatedDate: "2026-05-23",
    relatedRoutes: [
      "/select",
      "/use-cases",
      "/compare/build",
      "/docs/comparison-methodology",
      "/research/model-selection",
    ],
    keywords: [
      "decision workflow",
      "model selection",
      "comparison builder",
      "no ranking",
      "no recommendation",
    ],
    indexable: true,
    jsonLdType: "TechArticle",
  },
  {
    slug: "/docs/pricing-fields",
    title: "Pricing fields reference",
    description:
      "Every value the PricingUnit union can take — input, output, cache write (5m / 1h), cache read, per-hour cache storage, batch tiers, prompt-size tiers, the unknown placeholder — with rules for when each may carry a verified amount.",
    section: "pricing-docs",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/pricing",
      "/research/api-pricing-methodology",
      "/docs/data-verification",
    ],
    keywords: [
      "pricing unit reference",
      "cache pricing",
      "batch api pricing reference",
    ],
    indexable: true,
    jsonLdType: "TechArticle",
  },
  {
    slug: "/docs/status-observations",
    title: "Status observation reference",
    description:
      "Reference for StatusObservation: vendor_status_api / vendor_status_page / independent_http_probe sources, the ObservedStatus values, the sample threshold gating uptime exposure, and the rules against availability claims.",
    section: "status-docs",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/status",
      "/coverage",
      "/research/ai-provider-status-monitoring",
    ],
    keywords: [
      "status observation reference",
      "vendor status api",
      "http probe",
    ],
    indexable: true,
    jsonLdType: "TechArticle",
  },
  {
    slug: "/docs/comparison-methodology",
    title: "Comparison methodology reference",
    description:
      "Rules for /compare entries: two-sided verified, one-sided verified, pending; the type-level declaresWinner: false invariant; comparison-table rules and source-trail requirements.",
    section: "comparison-docs",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/compare",
      "/coverage",
      "/docs/data-verification",
    ],
    keywords: [
      "ai model comparison",
      "side-by-side ai comparison",
      "no winner declared",
    ],
    indexable: true,
    jsonLdType: "TechArticle",
  },
  {
    slug: "/docs/provider-coverage",
    title: "Provider coverage reference",
    description:
      "What 'verified' means at the provider level — the dimensions WebmasterID Models tracks (docs, API docs, pricing docs, model catalogue, status page, infrastructure, regions) and how each is sourced.",
    section: "data-verification",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/providers",
      "/coverage",
      "/docs/data-verification",
    ],
    keywords: [
      "provider coverage",
      "ai provider verification dimensions",
    ],
    indexable: true,
    jsonLdType: "TechArticle",
  },
  {
    slug: "/docs/model-page-schema",
    title: "Model page schema reference",
    description:
      "Fields on a ModelEntity record: identifiers, lifecycle, pricing, modality, capabilities, source trail. Includes the JSON-LD rules that guarantee unverified metrics never reach search-engine markup.",
    section: "data-model",
    updatedDate: "2026-05-21",
    relatedRoutes: [
      "/models",
      "/docs/data-verification",
      "/docs/pricing-fields",
    ],
    keywords: [
      "ai model schema",
      "modelentity reference",
      "ai api model fields",
    ],
    indexable: true,
    jsonLdType: "TechArticle",
  },
];

// ---------------------------------------------------------------------------
// Convenience accessors used by the hubs, the SEO files, and integrity guards.
// ---------------------------------------------------------------------------

export const researchPages = contentPages.filter((p) =>
  p.slug.startsWith("/research/")
);

export const docsPages = contentPages.filter((p) =>
  p.slug.startsWith("/docs/")
);

export function getContentPage(slug: string): ContentPage | undefined {
  return contentPages.find((p) => p.slug === slug);
}

export const RESEARCH_SECTION_LABEL: Record<ContentSection, string> = {
  "research-guides": "Research guides",
  methodology: "Methodology",
  "infrastructure-explainers": "Infrastructure explainers",
  "verification-policy": "Verification policy",
  "data-model": "Data model",
  "data-verification": "Data verification",
  "pricing-docs": "Pricing reference",
  "status-docs": "Status reference",
  "comparison-docs": "Comparison reference",
};
