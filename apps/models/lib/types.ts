export type VerificationStatus =
  | "verified"
  | "partial"
  | "unverified"
  | "deprecated";

export type SourceType =
  | "official-vendor-docs"
  | "primary-vendor-site"
  | "public-dataset"
  | "research-paper"
  | "regulatory-filing"
  | "unknown";

export type ConfidenceLevel = "high" | "medium" | "low" | "unverified";

export interface SourceCitation {
  url: string;
  name: string;
  type: SourceType;
  retrievedAt?: string | null;
}

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
}

export interface PricingTier {
  unit: "1M input tokens" | "1M output tokens" | "request" | "image" | "minute";
  amountUsd: number | null;
}

export interface PricingEntity extends BaseEntity {
  modelSlug: string;
  tiers: PricingTier[];
  currency: "USD";
}

export interface BenchmarkScore {
  benchmark: string;
  score: number | null;
  metric: string;
  sourceUrl?: string | null;
}

export interface BenchmarkEntity extends BaseEntity {
  modelSlug?: string;
  category: "reasoning" | "coding" | "math" | "knowledge" | "multimodal" | "agentic";
  description: string;
}

export interface ModelEntity extends BaseEntity {
  providerSlug: string;
  releaseDate: string | null;
  contextWindow: number | null;
  modality: ("text" | "image" | "audio" | "video" | "code")[];
  pricing: PricingTier[];
  benchmarks: BenchmarkScore[];
  infrastructure: {
    regions: string[] | null;
    avgLatencyMs: number | null;
    uptimePercent: number | null;
  };
  citations?: { label: string; href: string }[];
}

export interface ComparisonEntity extends BaseEntity {
  modelA: string;
  modelB: string;
  useCases: string[];
  limitations: string[];
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
