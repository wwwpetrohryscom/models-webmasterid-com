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

export type PricingUnit =
  | "1M input tokens"
  | "1M output tokens"
  | "1M cache write tokens (5m)"
  | "1M cache write tokens (1h)"
  | "1M cache read tokens"
  | "1M batch input tokens"
  | "1M batch output tokens"
  | "request"
  | "image"
  | "minute";

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
