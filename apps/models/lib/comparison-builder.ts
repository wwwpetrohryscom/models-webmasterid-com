import type { ModelEntity, SourceCitation } from "./types";
import { models, getModelBySlug } from "@/data/models";
import { providers, getProviderBySlug } from "@/data/providers";
import {
  hostedPricingForModel,
} from "@/data/hosted-pricing";
import { isVerified } from "./verified";
import {
  getFreshnessState,
  type FreshnessState,
} from "./source-freshness";
import {
  type ModelUseCaseSlug,
  getUseCaseBySlug,
} from "./use-cases";
import {
  getUseCaseShortlist,
} from "./model-shortlists";
import { comparisons } from "@/data/comparisons";

/**
 * Comparison builder.
 *
 * Sprint 24 turns the selection workflow into an ad-hoc, server-
 * rendered side-by-side view: a reader chooses 2–4 models and the
 * builder renders the verified fields each one carries. The result
 * is never persisted as a separate indexable page, never declares a
 * winner, never ranks, and never invents derived metrics.
 *
 * Pure local read — no fetch, no env, no Date.now, no record
 * mutation. The output structure is rendered directly by
 * /compare/build and is also designed to feed a future export
 * pipeline (Sprint 25 decision briefs).
 */

export type ComparisonBuilderField =
  | "identity"
  | "lifecycle"
  | "context"
  | "output"
  | "modality"
  | "pricing"
  | "hosted"
  | "sources"
  | "freshness"
  | "coverage"
  | "status";

export const COMPARISON_BUILDER_FIELDS: {
  value: ComparisonBuilderField;
  label: string;
  description: string;
}[] = [
  {
    value: "identity",
    label: "Identity",
    description: "Provider / creator + canonical API ID.",
  },
  {
    value: "lifecycle",
    label: "Lifecycle",
    description: "Active / preview / deprecated / retired status.",
  },
  {
    value: "context",
    label: "Context window",
    description: "Verified context window (tokens).",
  },
  {
    value: "output",
    label: "Max output",
    description: "Verified max output tokens.",
  },
  {
    value: "modality",
    label: "Modality channels",
    description: "Verified input + output modality channels.",
  },
  {
    value: "pricing",
    label: "First-party pricing",
    description:
      "Per-unit pricing references from the model creator. Not live quotes.",
  },
  {
    value: "hosted",
    label: "Hosted availability",
    description: "Hosting platforms + hosted model IDs.",
  },
  {
    value: "sources",
    label: "Source count",
    description: "Number of primary-source citations recorded.",
  },
  {
    value: "freshness",
    label: "Freshness",
    description: "Deterministic freshness state from buildDate.",
  },
  {
    value: "coverage",
    label: "Coverage gaps",
    description: "Canonical fields recorded as unverified.",
  },
  {
    value: "status",
    label: "Status observation",
    description:
      "Whether a status observer is wired for the model's provider.",
  },
];

export const COMPARISON_BUILDER_DEFAULT_FIELDS: ComparisonBuilderField[] = [
  "identity",
  "lifecycle",
  "context",
  "output",
  "modality",
  "pricing",
  "hosted",
  "sources",
  "freshness",
];

export const COMPARISON_BUILDER_MAX_MODELS = 4;

export interface ComparisonBuilderInput {
  modelSlugs: string[];
  useCase?: ModelUseCaseSlug;
  fields?: ComparisonBuilderField[];
  showGaps?: boolean;
}

export interface ComparisonBuilderHostedEntry {
  billingProviderSlug: string;
  hostedModelId?: string;
  hasVerifiedRate: boolean;
  sourceUrl?: string;
}

export interface ComparisonBuilderColumn {
  slug: string;
  model: ModelEntity | null;
  providerName?: string;
  lifecycleStatus?: string;
  canonicalId?: string;
  contextWindow?: number;
  maxOutput?: number;
  modalityChannels?: string[];
  firstPartyPricingVerified: boolean;
  firstPartyPricingSourceUrl?: string;
  hosted: ComparisonBuilderHostedEntry[];
  sourceCount: number;
  freshness: FreshnessState;
  dataGaps: string[];
  observerWired: boolean;
  /** Comparison entries that this model is part of (already curated). */
  relatedComparisonSlugs: string[];
  notes?: string;
}

export interface ComparisonBuilderResult {
  input: ComparisonBuilderInput;
  /** Same length / order as `input.modelSlugs`; unknown slugs become
   *  columns with `model: null`. */
  columns: ComparisonBuilderColumn[];
  fields: ComparisonBuilderField[];
  showGaps: boolean;
  /** Set of model slugs requested but not found in the catalogue. */
  unresolvedSlugs: string[];
  /** Set of slugs requested that exceed the max-column cap. */
  truncatedSlugs: string[];
  /** All distinct citations referenced by any column. */
  sources: SourceCitation[];
}

function uniq<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const v of arr) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function dataGapsFor(model: ModelEntity): string[] {
  const gaps: string[] = [];
  if (!isVerified(model.contextWindow)) gaps.push("context window");
  if (!isVerified(model.maxOutputTokens)) gaps.push("max output");
  if (!isVerified(model.modality)) gaps.push("modality channels");
  if (!isVerified(model.knowledgeCutoff)) gaps.push("knowledge cutoff");
  if (!isVerified(model.releaseDate)) gaps.push("release date");
  if (!isVerified(model.lifecycle)) gaps.push("lifecycle");
  if (!model.pricing.some((t) => isVerified(t.amount))) {
    gaps.push("first-party pricing");
  }
  return gaps;
}

function buildColumn(slug: string): ComparisonBuilderColumn {
  const model = getModelBySlug(slug) ?? null;
  if (!model) {
    return {
      slug,
      model: null,
      firstPartyPricingVerified: false,
      hosted: [],
      sourceCount: 0,
      freshness: "unknown",
      dataGaps: ["model record not found"],
      observerWired: false,
      relatedComparisonSlugs: [],
    };
  }
  const provider = getProviderBySlug(model.providerSlug);
  const hostedRows = hostedPricingForModel(model.slug);
  const firstPartyVerifiedTier = model.pricing.find((t) =>
    isVerified(t.amount)
  );
  const firstPartyCitation =
    firstPartyVerifiedTier && isVerified(firstPartyVerifiedTier.amount)
      ? firstPartyVerifiedTier.amount.citation
      : undefined;
  const observerWired = providers.some(
    (p) =>
      p.slug === model.providerSlug &&
      Boolean(p.statusPageUrl)
  );
  return {
    slug: model.slug,
    model,
    providerName: provider?.name,
    lifecycleStatus: isVerified(model.lifecycle)
      ? model.lifecycle.value.status
      : undefined,
    canonicalId: isVerified(model.apiIdentifiers)
      ? model.apiIdentifiers.value.canonical
      : undefined,
    contextWindow: isVerified(model.contextWindow)
      ? model.contextWindow.value
      : undefined,
    maxOutput: isVerified(model.maxOutputTokens)
      ? model.maxOutputTokens.value
      : undefined,
    modalityChannels: isVerified(model.modality)
      ? [...model.modality.value]
      : undefined,
    firstPartyPricingVerified: model.pricing.some((t) =>
      isVerified(t.amount)
    ),
    firstPartyPricingSourceUrl: firstPartyCitation?.url,
    hosted: hostedRows.map((r) => ({
      billingProviderSlug: r.billingProviderSlug,
      hostedModelId: r.hostedModelId,
      hasVerifiedRate: r.tiers.some((t) => isVerified(t.amount)),
      sourceUrl: r.citation?.url,
    })),
    sourceCount: model.citations.length,
    freshness: getFreshnessState(model.lastCheckedAt, {
      category: "model",
    }),
    dataGaps: dataGapsFor(model),
    observerWired,
    relatedComparisonSlugs: comparisons
      .filter((c) => c.modelA === model.slug || c.modelB === model.slug)
      .map((c) => c.slug),
    notes: model.notes ?? undefined,
  };
}

export function buildModelComparison(
  input: ComparisonBuilderInput
): ComparisonBuilderResult {
  const sanitized = uniq(
    input.modelSlugs
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  );
  const capped = sanitized.slice(0, COMPARISON_BUILDER_MAX_MODELS);
  const truncatedSlugs = sanitized.slice(COMPARISON_BUILDER_MAX_MODELS);
  const columns = capped.map(buildColumn);
  const unresolvedSlugs = columns
    .filter((c) => c.model === null)
    .map((c) => c.slug);

  // Collect distinct citations across columns.
  const sources: SourceCitation[] = [];
  const seenUrls = new Set<string>();
  for (const c of columns) {
    if (!c.model) continue;
    for (const cit of c.model.citations) {
      if (!seenUrls.has(cit.url)) {
        seenUrls.add(cit.url);
        sources.push(cit);
      }
    }
  }

  const fields =
    input.fields && input.fields.length > 0
      ? input.fields
      : COMPARISON_BUILDER_DEFAULT_FIELDS;

  return {
    input: { ...input, modelSlugs: capped },
    columns,
    fields,
    showGaps: Boolean(input.showGaps),
    unresolvedSlugs,
    truncatedSlugs,
    sources,
  };
}

export function getComparableModels(): ModelEntity[] {
  return [...models];
}

export function getComparisonBuilderDefaults(
  useCase?: ModelUseCaseSlug
): ComparisonBuilderInput {
  if (!useCase) {
    return {
      modelSlugs: [],
      fields: COMPARISON_BUILDER_DEFAULT_FIELDS,
    };
  }
  const shortlist = getUseCaseShortlist(useCase).slice(0, 4);
  return {
    modelSlugs: shortlist.map((e) => e.model.slug),
    useCase,
    fields: COMPARISON_BUILDER_DEFAULT_FIELDS,
  };
}

export function getComparisonFieldDefinitions() {
  return COMPARISON_BUILDER_FIELDS;
}

export interface ComparisonBuilderSummary {
  columns: number;
  withVerifiedContext: number;
  withVerifiedOutput: number;
  withVerifiedPricing: number;
  withHostedAvailability: number;
  totalGaps: number;
  totalSources: number;
  useCaseTitle?: string;
}

export function getComparisonBuilderSummary(
  result: ComparisonBuilderResult
): ComparisonBuilderSummary {
  const useCase = result.input.useCase
    ? getUseCaseBySlug(result.input.useCase)
    : undefined;
  return {
    columns: result.columns.length,
    withVerifiedContext: result.columns.filter(
      (c) => c.contextWindow !== undefined
    ).length,
    withVerifiedOutput: result.columns.filter(
      (c) => c.maxOutput !== undefined
    ).length,
    withVerifiedPricing: result.columns.filter(
      (c) => c.firstPartyPricingVerified
    ).length,
    withHostedAvailability: result.columns.filter(
      (c) => c.hosted.length > 0
    ).length,
    totalGaps: result.columns.reduce(
      (acc, c) => acc + c.dataGaps.length,
      0
    ),
    totalSources: result.sources.length,
    useCaseTitle: useCase?.title,
  };
}

/** Convenience used by /select + use-case pages to build the
 *  builder URL from a list of model slugs. */
export function comparisonBuilderUrl(input: {
  modelSlugs: string[];
  useCase?: ModelUseCaseSlug;
  fields?: ComparisonBuilderField[];
  showGaps?: boolean;
}): string {
  const params = new URLSearchParams();
  if (input.modelSlugs.length) {
    params.set("models", input.modelSlugs.join(","));
  }
  if (input.useCase) params.set("useCase", input.useCase);
  if (input.fields && input.fields.length) {
    params.set("fields", input.fields.join(","));
  }
  if (input.showGaps) params.set("showGaps", "true");
  const qs = params.toString();
  return qs ? `/compare/build?${qs}` : "/compare/build";
}
