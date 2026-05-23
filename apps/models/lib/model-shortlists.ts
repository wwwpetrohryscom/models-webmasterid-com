import type { ModelEntity } from "./types";
import { models } from "@/data/models";
import { hostedPricing } from "@/data/hosted-pricing";
import { comparisons } from "@/data/comparisons";
import { isVerified } from "./verified";
import {
  getFreshnessState,
  type FreshnessState,
} from "./source-freshness";
import { getUseCaseBySlug, type ModelUseCaseSlug } from "./use-cases";

/**
 * Model shortlist helper.
 *
 * Sprint 23 produces source-backed shortlists from the verified
 * field set on each model — never from opinions, never from scores,
 * never from a hidden ranking. Sort order is deterministic and
 * documented; consumers render the result as a "shortlist order"
 * (the term "rank" is deliberately avoided).
 *
 * The helper is a pure local read:
 *   - no fetch
 *   - no process.env
 *   - no Date.now (freshness derives from siteConfig.buildDate)
 *   - no model record mutation
 */

export interface ModelShortlistFilters {
  useCase?: ModelUseCaseSlug;
  provider?: string;
  lifecycle?: string;
  minContext?: number;
  modality?: string;
  pricingCoverage?: "verified" | "any";
  hostedAvailability?: "true" | "false";
  verification?: "verified" | "partial";
  freshness?: FreshnessState;
}

export interface ModelSelectionSignals {
  activeLifecycle: boolean;
  verifiedContext: boolean;
  verifiedMaxOutput: boolean;
  verifiedModality: boolean;
  verifiedFirstPartyPricing: boolean;
  hostedAvailability: boolean;
  sourceCount: number;
  dataGapCount: number;
  freshnessState: FreshnessState;
  comparisonCount: number;
  verifiedFieldCount: number;
}

export interface ModelShortlistEntry {
  model: ModelEntity;
  signals: ModelSelectionSignals;
  suggestedAction: string;
}

export interface ShortlistSummary {
  total: number;
  withVerifiedContext: number;
  withVerifiedPricing: number;
  withHostedAvailability: number;
  activeOnly: number;
}

function hostedSlugSet(): Set<string> {
  return new Set(hostedPricing.map((r) => r.modelSlug));
}

function lifecycleStatus(m: ModelEntity): string | undefined {
  if (!isVerified(m.lifecycle)) return undefined;
  return m.lifecycle.value.status;
}

export function getModelSelectionSignals(
  modelSlug: string
): ModelSelectionSignals | undefined {
  const m = models.find((x) => x.slug === modelSlug);
  if (!m) return undefined;
  return signalsFor(m);
}

function signalsFor(m: ModelEntity): ModelSelectionSignals {
  const hosted = hostedSlugSet();
  const verifiedContext = isVerified(m.contextWindow);
  const verifiedMaxOutput = isVerified(m.maxOutputTokens);
  const verifiedModality = isVerified(m.modality);
  const verifiedFirstPartyPricing = m.pricing.some((t) =>
    isVerified(t.amount)
  );
  const hostedAvailability = hosted.has(m.slug);
  const sourceCount = m.citations.length;
  // Data gaps: canonical metric slots left null on the model record.
  const slots = [
    isVerified(m.contextWindow),
    isVerified(m.maxOutputTokens),
    isVerified(m.modality),
    isVerified(m.knowledgeCutoff),
    isVerified(m.releaseDate),
    isVerified(m.lifecycle),
    isVerified(m.apiIdentifiers),
  ];
  const dataGapCount = slots.filter((v) => !v).length;
  const verifiedFieldCount = slots.filter((v) => v).length;
  const status = lifecycleStatus(m);
  const activeLifecycle = !status || status === "active";
  const freshnessState = getFreshnessState(m.lastCheckedAt, {
    category: "model",
  });
  const comparisonCount = comparisons.filter(
    (c) => c.modelA === m.slug || c.modelB === m.slug
  ).length;
  return {
    activeLifecycle,
    verifiedContext,
    verifiedMaxOutput,
    verifiedModality,
    verifiedFirstPartyPricing,
    hostedAvailability,
    sourceCount,
    dataGapCount,
    freshnessState,
    comparisonCount,
    verifiedFieldCount,
  };
}

function suggestedActionFor(
  m: ModelEntity,
  s: ModelSelectionSignals
): string {
  if (!s.activeLifecycle) {
    return "Historical record — open the model page to read the lifecycle note.";
  }
  if (s.verifiedFirstPartyPricing) {
    return "Review the verified pricing reference and re-check the freshness state before projecting cost.";
  }
  if (s.hostedAvailability) {
    return "Inspect the hosted-availability record and the third-party hosted pricing reference on the provider page.";
  }
  if (m.verificationStatus === "partial") {
    return "Walk the data-gap list on the model page — manual review required for the unverified fields.";
  }
  if (s.comparisonCount > 0) {
    return "Compare with a verified peer on /compare to read side-by-side fields.";
  }
  return "Open the model page to inspect verified fields and source citations.";
}

function modalityMatch(m: ModelEntity, target: string): boolean {
  if (!isVerified(m.modality)) return false;
  return m.modality.value.some((ch) =>
    ch.toLowerCase().includes(target.toLowerCase())
  );
}

function applyUseCase(m: ModelEntity, useCase: ModelUseCaseSlug): boolean {
  const s = signalsFor(m);
  switch (useCase) {
    case "long-context-analysis": {
      if (!isVerified(m.contextWindow)) return false;
      return m.contextWindow.value >= 200_000;
    }
    case "multimodal-input": {
      if (!isVerified(m.modality)) return false;
      return m.modality.value.some(
        (ch) =>
          ch.startsWith("image-") ||
          ch.startsWith("audio-") ||
          ch.startsWith("video-")
      );
    }
    case "structured-output": {
      // Structured output is not yet a verified per-model field;
      // surface verified tool-use signals when published.
      if (!isVerified(m.features)) return false;
      return Boolean(m.features.value.toolUse);
    }
    case "hosted-inference":
      return s.hostedAvailability;
    case "cost-review":
      return s.verifiedFirstPartyPricing || s.hostedAvailability;
    case "governance-review":
      return s.sourceCount > 0;
    case "status-aware-selection":
      // We treat any verified provider as having useful status surface.
      return m.verificationStatus === "verified";
    case "comparison-research":
      return s.comparisonCount > 0;
  }
}

export function getModelShortlist(
  filters: ModelShortlistFilters = {}
): ModelShortlistEntry[] {
  const hosted = hostedSlugSet();
  const filtered = models.filter((m) => {
    if (filters.useCase) {
      if (!applyUseCase(m, filters.useCase)) return false;
    }
    if (filters.provider && m.providerSlug !== filters.provider) return false;
    if (filters.lifecycle) {
      if (!isVerified(m.lifecycle)) return false;
      if (m.lifecycle.value.status !== filters.lifecycle) return false;
    }
    if (typeof filters.minContext === "number" && filters.minContext > 0) {
      if (!isVerified(m.contextWindow)) return false;
      if (m.contextWindow.value < filters.minContext) return false;
    }
    if (filters.modality) {
      if (!modalityMatch(m, filters.modality)) return false;
    }
    if (filters.pricingCoverage === "verified") {
      if (!m.pricing.some((t) => isVerified(t.amount))) return false;
    }
    if (filters.hostedAvailability === "true") {
      if (!hosted.has(m.slug)) return false;
    }
    if (filters.hostedAvailability === "false") {
      if (hosted.has(m.slug)) return false;
    }
    if (filters.verification) {
      if (m.verificationStatus !== filters.verification) return false;
    }
    if (filters.freshness) {
      if (
        getFreshnessState(m.lastCheckedAt, { category: "model" }) !==
        filters.freshness
      )
        return false;
    }
    return true;
  });

  const entries: ModelShortlistEntry[] = filtered.map((m) => {
    const signals = signalsFor(m);
    return {
      model: m,
      signals,
      suggestedAction: suggestedActionFor(m, signals),
    };
  });

  // Shortlist order — not a ranking. The ordering is documented:
  //   1. verified field count desc
  //   2. active lifecycle first
  //   3. source count desc
  //   4. model name asc
  entries.sort((a, b) => {
    if (a.signals.verifiedFieldCount !== b.signals.verifiedFieldCount) {
      return b.signals.verifiedFieldCount - a.signals.verifiedFieldCount;
    }
    if (a.signals.activeLifecycle !== b.signals.activeLifecycle) {
      return a.signals.activeLifecycle ? -1 : 1;
    }
    if (a.signals.sourceCount !== b.signals.sourceCount) {
      return b.signals.sourceCount - a.signals.sourceCount;
    }
    return a.model.name.localeCompare(b.model.name);
  });
  return entries;
}

export function getUseCaseShortlist(
  useCaseSlug: ModelUseCaseSlug
): ModelShortlistEntry[] {
  if (!getUseCaseBySlug(useCaseSlug)) return [];
  return getModelShortlist({ useCase: useCaseSlug });
}

export function getShortlistSummary(
  filters: ModelShortlistFilters = {}
): ShortlistSummary {
  const list = getModelShortlist(filters);
  return {
    total: list.length,
    withVerifiedContext: list.filter((e) => e.signals.verifiedContext)
      .length,
    withVerifiedPricing: list.filter(
      (e) => e.signals.verifiedFirstPartyPricing
    ).length,
    withHostedAvailability: list.filter((e) => e.signals.hostedAvailability)
      .length,
    activeOnly: list.filter((e) => e.signals.activeLifecycle).length,
  };
}
