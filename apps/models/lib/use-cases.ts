/**
 * Source-safe use-case definitions.
 *
 * Sprint 23 introduces use cases as *selection workflows*, not
 * recommendations. Each use case describes which verified fields a
 * reader should inspect when they have a particular problem; it
 * never declares a model "best for" anything, never ranks, and
 * never asserts unverified properties.
 *
 * The shape is intentionally narrow:
 *   - title + description: human-readable framing
 *   - verifiedFieldsUsed: the fields a reader should weight when
 *     screening models for this use case
 *   - caution: the most common misread a reader could make
 *   - route: canonical detail-page route (may be null if no page
 *     ships this sprint)
 *   - relatedRoutes: hubs / docs / research the page should link to
 */

export type ModelUseCaseSlug =
  | "long-context-analysis"
  | "multimodal-input"
  | "structured-output"
  | "hosted-inference"
  | "cost-review"
  | "governance-review"
  | "status-aware-selection"
  | "comparison-research";

export interface ModelUseCase {
  slug: ModelUseCaseSlug;
  title: string;
  description: string;
  verifiedFieldsUsed: string[];
  caution: string;
  /** Canonical detail-page route. Null when no detail page ships yet. */
  route: string | null;
  relatedRoutes: string[];
}

export const modelUseCases: ModelUseCase[] = [
  {
    slug: "long-context-analysis",
    title: "Long-context analysis",
    description:
      "Working with prompts and corpora that exceed the small-context tier (≥200k tokens). The relevant verified fields are context window, max output tokens, and the pricing reference rows that apply at the prompt-size tier the vendor publishes.",
    verifiedFieldsUsed: [
      "context window",
      "max output tokens",
      "pricing references (incl. >200k tier where the vendor publishes one)",
      "lifecycle status",
      "source citations",
    ],
    caution:
      "Context window is not quality. A large window only means the model can accept long prompts; it does not assert that the model uses every token equally well. Long context also typically increases cost — re-verify pricing references before projecting.",
    route: "/use-cases/long-context-analysis",
    relatedRoutes: [
      "/models?modality=text",
      "/pricing",
      "/research/model-context-windows",
      "/docs/pricing-fields",
      "/coverage",
      "/sources",
    ],
  },
  {
    slug: "multimodal-input",
    title: "Multimodal input",
    description:
      "Workloads that pass images, audio, video, or PDFs in addition to text. The verified modality channel list is the only safe filter — unsupported modalities remain explicitly unverified.",
    verifiedFieldsUsed: [
      "modality channel list (input + output)",
      "context window",
      "lifecycle status",
      "source citations",
    ],
    caution:
      "A model may informally advertise multimodal support without a vendor page listing the input channels. WebmasterID Models filters on the verified modality field only — absence of a channel is not the same as the model rejecting it. Confirm against the vendor docs.",
    route: "/use-cases/multimodal-input",
    relatedRoutes: [
      "/models",
      "/research/inference-infrastructure",
      "/docs/model-page-schema",
      "/sources",
    ],
  },
  {
    slug: "structured-output",
    title: "Structured output",
    description:
      "Workloads that depend on JSON, tool-calls, schema validation, or other structured response surfaces. The catalogue does not yet model structured-output guarantees as a verified field; this use case currently surfaces models with verified tool-use signals where the vendor docs publish them.",
    verifiedFieldsUsed: [
      "features (tool use, where verified)",
      "modality output channels",
      "source citations",
    ],
    caution:
      "Most vendors document structured-output behaviour on a per-API basis rather than per-model. Treat this use case as a shortlist starting point and confirm structured-output guarantees against the vendor API reference before committing.",
    route: null,
    relatedRoutes: [
      "/docs/model-page-schema",
      "/research/source-verification-methodology",
    ],
  },
  {
    slug: "hosted-inference",
    title: "Hosted inference",
    description:
      "When the model creator does not run a paid first-party API and inference is delivered by a third-party hosting platform (Groq, Together AI). Hosted availability is a stable identity claim; hosted pricing is a volatile reference value.",
    verifiedFieldsUsed: [
      "hosted availability record (host × model)",
      "hosted model ID",
      "billing provider slug",
      "model creator slug",
      "hosted pricing references + freshness",
    ],
    caution:
      "Hosted availability is not the same as model ownership. A hosting platform does not become the model creator by exposing the model. Hosted pricing is set by the hosting platform — never the model creator. WebmasterID Models does not rank hosting platforms by price.",
    route: "/use-cases/hosted-inference",
    relatedRoutes: [
      "/pricing",
      "/providers",
      "/research/api-pricing-methodology",
      "/docs/pricing-fields",
    ],
  },
  {
    slug: "cost-review",
    title: "Cost review",
    description:
      "Walking pricing references before a procurement decision. The catalogue exposes first-party rates as source-backed references (not live quotes) alongside hosted-provider references; the freshness chip tells you how recently each was confirmed.",
    verifiedFieldsUsed: [
      "first-party pricing references",
      "hosted pricing references",
      "pricing freshness state",
      "volatility tag",
      "source citation retrievedAt",
    ],
    caution:
      "Prices change. WebmasterID Models does not provide live quotes, does not rank providers by price, and does not project cost. Review-due and stale rows surface on the reverification queue with the source URL — re-confirm before commitment.",
    route: null,
    relatedRoutes: [
      "/pricing",
      "/reverification?entityType=pricing",
      "/research/api-pricing-methodology",
      "/docs/pricing-fields",
    ],
  },
  {
    slug: "governance-review",
    title: "Governance review",
    description:
      "Internal AI model inventory + source-backed due diligence. The relevant signals are verification status, lifecycle, source citations, freshness states, and the reverification queue — all derived from primary-source documentation, with explicit data gaps where the vendor does not publish.",
    verifiedFieldsUsed: [
      "verification status",
      "lifecycle status",
      "source citations with retrievedAt",
      "freshness state",
      "provider coverage",
      "reverification queue entries",
    ],
    caution:
      "A 'verified' record means the field is backed by a primary-source citation on the date recorded — it does not assert certification status, compliance attestation, or fitness for a specific regulatory regime. Use this use case as a starting point, not as a substitute for legal or compliance review.",
    route: "/use-cases/governance-review",
    relatedRoutes: [
      "/coverage",
      "/sources",
      "/reverification",
      "/docs/data-verification",
      "/research/source-verification-methodology",
    ],
  },
  {
    slug: "status-aware-selection",
    title: "Status-aware selection",
    description:
      "Picking models whose providers expose either a vendor-reported status page or an independent host probe. The catalogue records observations, not uptime; readers can use the status surface to verify *that monitoring exists*, not to assert SLA compliance.",
    verifiedFieldsUsed: [
      "provider statusPageUrl",
      "wired observer presence",
      "status observations (vendor-reported / independent probe)",
    ],
    caution:
      "Status observations are not uptime claims. A vendor status page reflects what the vendor reports; an independent host probe only confirms that the API host responds. Neither is a guarantee of availability for a given account.",
    route: null,
    relatedRoutes: [
      "/status",
      "/research/ai-provider-status-monitoring",
      "/providers",
    ],
  },
  {
    slug: "comparison-research",
    title: "Comparison research",
    description:
      "Reading two models side-by-side after the use case has narrowed which fields matter. Comparison pages render verified fields per side — they do not declare a winner and do not synthesise derived metrics.",
    verifiedFieldsUsed: [
      "every verified field on each comparison's two model records",
      "comparison cluster membership",
    ],
    caution:
      "Comparisons are reference views. WebmasterID Models never declares a winner, never ranks by price, and never computes deltas between sides. Use comparisons after a use case shortlist.",
    route: null,
    relatedRoutes: [
      "/compare",
      "/docs/comparison-methodology",
      "/research/model-selection",
    ],
  },
];

export function getUseCaseBySlug(
  slug: string
): ModelUseCase | undefined {
  return modelUseCases.find((u) => u.slug === slug);
}

/**
 * Use cases that ship a dedicated detail page this sprint. Other use
 * cases still appear on /use-cases hub with a "deep dive coming"
 * note so the slug is reserved.
 */
export const useCasesWithDetailPage: ModelUseCase[] = modelUseCases.filter(
  (u): u is ModelUseCase => u.route !== null
);
