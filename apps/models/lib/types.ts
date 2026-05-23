export type VerificationStatus =
  | "verified"
  | "partial"
  | "unverified";

export type LifecycleStatus =
  | "active"
  | "preview"
  | "deprecated"
  | "retired";

export type SourceType =
  | "official-vendor-docs"
  | "official-vendor-pricing"
  | "official-vendor-site"
  | "regulatory-filing"
  | "research-paper"
  | "public-dataset"
  | "unknown";

export type ConfidenceLevel = "high" | "medium" | "low" | "unverified";

/**
 * A single citation pointing at a primary source. Every verified value in
 * the entity graph must reference one of these. No secondary summaries,
 * blogs, or social posts.
 */
export interface SourceCitation {
  url: string;
  name: string;
  type: SourceType;
  /** ISO-8601 datetime the source was last retrieved against. */
  retrievedAt: string;
  /** Optional free-text disambiguation about what exactly was sourced. */
  notes?: string;
}

/**
 * A value paired with its provenance. Use this for ANY claim that could
 * mislead a reader if presented without a source — pricing, benchmark
 * scores, latency, uptime, context window, release date, lifecycle.
 */
export interface VerifiedField<T> {
  value: T;
  citation: SourceCitation;
  confidenceLevel: ConfidenceLevel;
  notes?: string;
}

/**
 * Either a verified field with citation, or null when unverified. Never
 * a bare T — the type system is what blocks unsourced rendering.
 */
export type MaybeVerified<T> = VerifiedField<T> | null;

export interface BaseEntity {
  id: string;
  slug: string;
  name: string;
  description: string;
  sourceUrl?: string | null;
  sourceName?: string | null;
  sourceType?: SourceType;
  verified: boolean;
  verificationStatus: VerificationStatus;
  confidenceLevel?: ConfidenceLevel;
  lastCheckedAt: string | null;
  updatedDate: string | null;
  createdDate?: string | null;
  notes?: string | null;
}

export interface ProviderEntity extends BaseEntity {
  headquarters?: string | null;
  website?: string | null;
  /** Top-level docs URL. */
  docsUrl?: string | null;
  /** API reference URL. */
  apiDocsUrl?: string | null;
  /** Official pricing reference page. */
  pricingUrl?: string | null;
  /** Public model catalogue / list page. */
  modelCatalogueUrl?: string | null;
  /** Vendor-published status page (not an independent monitor). */
  statusPageUrl?: string | null;
  /** Stable docs page that documents the deprecation lifecycle. */
  deprecationsUrl?: string | null;
}

/**
 * Pricing-unit vocabulary. Providers publish cache pricing under several
 * incompatible semantics — Anthropic uses per-token TTL writes/reads,
 * Google uses a per-hour cache storage rate plus a one-shot write — and
 * we keep each provider's semantics distinct rather than collapsing them
 * into a single misleading row. Every literal here is the canonical
 * display label and is also what is asserted by the integrity guard
 * "PricingUnit covers all units used in models.ts" in
 * scripts/check-production-readiness.ts.
 *
 * `"unknown"` is the placeholder for a row whose unit semantics have not
 * yet been verified. By policy, no row with a verified `amount` may carry
 * unit `"unknown"` (enforced by the integrity guard
 * "pricing row with a verified amount may not declare unit 'unknown'").
 */
export type PricingUnit =
  | "1M input tokens"
  | "1M output tokens"
  // Anthropic-style TTL cache writes / reads
  | "1M cache write tokens (5m)"
  | "1M cache write tokens (1h)"
  | "1M cache read tokens"
  // Google-style per-hour cache storage (Gemini). Independent of the
  // one-shot cache-write fee — the two are NOT interchangeable.
  | "1M cache storage / hour"
  // Google-style prompt-size tiered pricing (Gemini >200k prompts)
  | "1M input tokens (>200k context)"
  | "1M output tokens (>200k context)"
  | "1M cache write tokens (>200k context)"
  // Batch API discounts (same rate-card semantics across providers)
  | "1M batch input tokens"
  | "1M batch output tokens"
  | "1M batch input tokens (>200k context)"
  | "1M batch output tokens (>200k context)"
  // Non-token units
  | "request"
  | "image"
  | "minute"
  // Placeholder for rows whose unit semantics are still pending review.
  // A row with this unit MUST NOT carry a verified amount.
  | "unknown";

export interface VerifiedPricingTier {
  unit: PricingUnit;
  /** Verified amount in USD, or null if not yet verified. */
  amount: MaybeVerified<number>;
  notes?: string;
}

export interface PricingEntity extends BaseEntity {
  modelSlug: string;
  tiers: VerifiedPricingTier[];
  currency: "USD";
}

/**
 * Pricing context — who is billing whom for what.
 *
 * Sprint 19 distinguishes between API pricing that comes from the
 * organisation that *created* a model (first-party) and pricing that
 * comes from a third-party platform *hosting* an open-weights model
 * created by someone else. Conflating the two misleads readers: e.g.
 * Groq's Llama 4 Scout rate is a Groq pricing decision, not a Meta one,
 * and Meta does not run a paid first-party Llama API at all.
 */
export type PricingContext =
  | "model_creator_first_party_api"
  | "hosted_provider_api"
  | "cloud_marketplace"
  | "unknown";

/**
 * Pricing volatility — how often the rate is expected to change.
 *
 * Hosted-platform rates on Groq, Together, Bedrock, Vertex can move
 * weekly; first-party rates move less often but still move
 * (promotional windows, regional adjustments, model retirements).
 * Sprint 20 records the expected volatility on every pricing record
 * so the UI can pair the rate with a freshness signal — never with
 * "live quote" framing.
 */
export type PricingVolatility = "high" | "medium" | "low" | "unknown";

/**
 * A single pricing record, ready for /pricing rendering. Always carries
 * an explicit pricing context; the billing provider is the entity that
 * actually invoices the developer, and the model-creator provider is
 * the organisation that built the underlying model. They are the same
 * slug for first-party records and different for hosted records.
 *
 * `hostedModelId` is the platform-specific identifier (e.g. Groq's
 * "meta-llama/llama-4-scout-17b-16e-instruct"). It is intentionally
 * optional: first-party records use the canonical API ID on the
 * model entity, while hosted records carry the platform-side ID here.
 */
export interface PricingRecord {
  id: string;
  modelSlug: string;
  modelCreatorProviderSlug: string;
  billingProviderSlug: string;
  hostedModelId?: string;
  pricingContext: PricingContext;
  tiers: VerifiedPricingTier[];
  /** Optional record-level citation; tier-level citations remain authoritative. */
  citation?: SourceCitation;
  lastCheckedAt: string | null;
  verified: boolean;
  verificationStatus: VerificationStatus;
  notes?: string | null;
  /**
   * Sprint 20: expected volatility of the rate. Required on every
   * pricing record so the renderer can pair the value with a
   * freshness signal. Default for hosted_provider_api rows is
   * "high"; first-party rows default to "medium".
   */
  volatility: PricingVolatility;
  /**
   * Sprint 20: how often this row should be re-verified, in days.
   * Optional; if absent the renderer falls back to the default
   * freshness thresholds in `lib/pricing-freshness.ts`.
   */
  reviewCadenceDays?: number;
}

export type BenchmarkCategory =
  | "reasoning"
  | "coding"
  | "math"
  | "knowledge"
  | "multimodal"
  | "agentic";

export interface VerifiedBenchmarkScore {
  benchmark: string;
  metric: string;
  score: MaybeVerified<number>;
}

export interface BenchmarkEntity extends BaseEntity {
  modelSlug?: string;
  category: BenchmarkCategory;
  description: string;
}

export type ModalityChannel =
  | "text-in"
  | "image-in"
  | "audio-in"
  | "video-in"
  | "text-out"
  | "image-out"
  | "audio-out";

export interface ModelApiIdentifiers {
  /** The canonical Claude API ID (pinned snapshot). */
  canonical: string;
  alias?: string;
  bedrock?: string;
  vertex?: string;
  other?: { platform: string; id: string }[];
}

export interface ModelKnowledgeCutoff {
  reliable?: string;
  training?: string;
}

export interface ModelLifecycle {
  status: LifecycleStatus;
  retirementDate?: string;
  migrationTarget?: string;
}

export interface ModelFeatures {
  extendedThinking?: boolean;
  adaptiveThinking?: boolean;
  priorityTier?: boolean;
  visionInput?: boolean;
  toolUse?: boolean;
}

export interface ModelInfrastructure {
  regions: MaybeVerified<string[]>;
  avgLatencyMs: MaybeVerified<number>;
  uptimePercent: MaybeVerified<number>;
}

export interface ModelEntity extends BaseEntity {
  providerSlug: string;

  apiIdentifiers: MaybeVerified<ModelApiIdentifiers>;
  releaseDate: MaybeVerified<string>;
  snapshotDate: MaybeVerified<string>;
  knowledgeCutoff: MaybeVerified<ModelKnowledgeCutoff>;
  contextWindow: MaybeVerified<number>;
  maxOutputTokens: MaybeVerified<number>;
  modality: MaybeVerified<ModalityChannel[]>;

  pricing: VerifiedPricingTier[];
  benchmarks: VerifiedBenchmarkScore[];
  infrastructure: ModelInfrastructure;

  features: MaybeVerified<ModelFeatures>;
  lifecycle: MaybeVerified<ModelLifecycle>;

  /** Every primary-source citation referenced by any verified field. */
  citations: SourceCitation[];
}

export interface ComparisonEntity extends BaseEntity {
  modelA: string;
  modelB: string;
  /** Workloads each side tends to be used for. NOT a ranking. */
  useCases: string[];
  /** Caveats and ways the comparison may mislead. */
  limitations: string[];
  /**
   * Comparisons NEVER declare a winner. This constant exists as a
   * type-level reminder for reviewers.
   */
  declaresWinner: false;
}

export interface RegionEntity extends BaseEntity {
  countryCode: string;
  providersAvailable: string[];
}

export interface StatusEntity extends BaseEntity {
  providerSlug: string;
  status: "operational" | "degraded" | "outage" | "unknown";
  lastIncidentDate?: string | null;
}
