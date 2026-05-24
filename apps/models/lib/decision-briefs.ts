import type { ModelEntity, SourceCitation } from "./types";
import { getModelBySlug, models } from "@/data/models";
import { getProviderBySlug, providers } from "@/data/providers";
import { hostedPricingForModel } from "@/data/hosted-pricing";
import { isVerified } from "./verified";
import { siteConfig } from "./site-config";
import {
  getFreshnessState,
  freshnessLabel,
  type FreshnessState,
} from "./source-freshness";
import {
  getUseCaseBySlug,
  type ModelUseCaseSlug,
} from "./use-cases";
import { getUseCaseShortlist } from "./model-shortlists";

/**
 * Decision-brief helper.
 *
 * Sprint 25 turns the selection + comparison workflow into a
 * shareable evidence pack. A decision brief is structured evidence
 * — verified fields, data gaps, source trail, freshness notes,
 * hosted availability — never a recommendation, never a winner,
 * never a derived score. The helper is a pure local read; no
 * fetch, no env, no Date.now, no mutation.
 *
 * The same helper feeds the /briefs/build UI and the
 * /api/briefs/decision export endpoint (Markdown + JSON), so a
 * reader can review the brief in a browser or paste it into a PR
 * description without a separate code path.
 */

export type DecisionBriefField =
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
  | "status"
  | "gaps";

export const DECISION_BRIEF_FIELDS: {
  value: DecisionBriefField;
  label: string;
}[] = [
  { value: "identity", label: "Identity" },
  { value: "lifecycle", label: "Lifecycle" },
  { value: "context", label: "Context window" },
  { value: "output", label: "Max output" },
  { value: "modality", label: "Modality channels" },
  { value: "pricing", label: "First-party pricing" },
  { value: "hosted", label: "Hosted availability" },
  { value: "sources", label: "Source trail" },
  { value: "freshness", label: "Freshness" },
  { value: "coverage", label: "Coverage notes" },
  { value: "status", label: "Status surface" },
  { value: "gaps", label: "Data gaps" },
];

export const DECISION_BRIEF_DEFAULT_FIELDS: DecisionBriefField[] = [
  "identity",
  "lifecycle",
  "context",
  "output",
  "modality",
  "pricing",
  "hosted",
  "sources",
  "freshness",
  "gaps",
];

export const DECISION_BRIEF_MAX_MODELS = 4;

export interface DecisionBriefInput {
  modelSlugs: string[];
  useCase?: ModelUseCaseSlug;
  fields?: DecisionBriefField[];
}

export interface DecisionBriefSelectedModel {
  slug: string;
  name: string;
  providerSlug: string;
  providerName: string;
  lifecycle: string;
  pageUrl: string;
}

export interface DecisionBriefEvidence {
  modelSlug: string;
  field: string;
  value: string;
  sourceIds: string[];
}

export interface DecisionBriefGap {
  modelSlug: string;
  field: string;
  reason: string;
  affectedRoute: string;
}

export interface DecisionBriefSource {
  sourceId: string;
  name: string;
  url: string;
  sourceType: string;
  retrievedAt: string;
}

export interface DecisionBriefFreshnessNote {
  sourceId?: string;
  modelSlug?: string;
  state: FreshnessState;
  note: string;
}

export interface DecisionBriefHostedAvailability {
  modelSlug: string;
  billingProviderSlug: string;
  hostedModelId: string;
  pricingReferenceAvailable: boolean;
  lastCheckedAt?: string;
}

export interface DecisionBrief {
  title: string;
  useCase?: string;
  generatedAt: string;
  selectedModels: DecisionBriefSelectedModel[];
  verifiedEvidence: DecisionBriefEvidence[];
  dataGaps: DecisionBriefGap[];
  sourceTrail: DecisionBriefSource[];
  freshnessNotes: DecisionBriefFreshnessNote[];
  hostedAvailability: DecisionBriefHostedAvailability[];
  nextExternalTests: string[];
  policyNotes: string[];
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function sanitizeSlugs(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const s = raw.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out.slice(0, DECISION_BRIEF_MAX_MODELS);
}

function citationId(url: string): string {
  // Stable, opaque-ish id derived from URL hostname + first path
  // segment. The brief is short-lived; readers cite the URL itself.
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean)[0] ?? "root";
    return `${u.hostname}/${seg}`.replace(/[^a-z0-9./-]+/gi, "-");
  } catch {
    return url.replace(/[^a-z0-9./-]+/gi, "-");
  }
}

function collectSources(model: ModelEntity): SourceCitation[] {
  // Walk model citations + per-tier pricing citations; dedupe by URL.
  const byUrl = new Map<string, SourceCitation>();
  for (const c of model.citations) byUrl.set(c.url, c);
  for (const t of model.pricing) {
    if (isVerified(t.amount)) byUrl.set(t.amount.citation.url, t.amount.citation);
  }
  for (const r of hostedPricingForModel(model.slug)) {
    if (r.citation) byUrl.set(r.citation.url, r.citation);
    for (const t of r.tiers) {
      if (isVerified(t.amount)) {
        byUrl.set(t.amount.citation.url, t.amount.citation);
      }
    }
  }
  return Array.from(byUrl.values());
}

function fieldValueForBrief(
  field: DecisionBriefField,
  model: ModelEntity
): { value: string; sourceIds: string[] } | null {
  switch (field) {
    case "identity": {
      const provider = getProviderBySlug(model.providerSlug);
      const canonical = isVerified(model.apiIdentifiers)
        ? model.apiIdentifiers.value.canonical
        : null;
      const value = `${provider?.name ?? model.providerSlug}${
        canonical ? ` (${canonical})` : ""
      }`;
      const sourceIds = isVerified(model.apiIdentifiers)
        ? [citationId(model.apiIdentifiers.citation.url)]
        : [];
      return { value, sourceIds };
    }
    case "lifecycle": {
      if (!isVerified(model.lifecycle)) return null;
      const v = model.lifecycle.value;
      const tail = v.retirementDate ? ` (retires ${v.retirementDate})` : "";
      return {
        value: `${v.status}${tail}`,
        sourceIds: [citationId(model.lifecycle.citation.url)],
      };
    }
    case "context": {
      if (!isVerified(model.contextWindow)) return null;
      return {
        value: `${model.contextWindow.value.toLocaleString()} tokens`,
        sourceIds: [citationId(model.contextWindow.citation.url)],
      };
    }
    case "output": {
      if (!isVerified(model.maxOutputTokens)) return null;
      return {
        value: `${model.maxOutputTokens.value.toLocaleString()} tokens max output`,
        sourceIds: [citationId(model.maxOutputTokens.citation.url)],
      };
    }
    case "modality": {
      if (!isVerified(model.modality)) return null;
      return {
        value: model.modality.value.join(", "),
        sourceIds: [citationId(model.modality.citation.url)],
      };
    }
    case "pricing": {
      const tiers = model.pricing.filter((t) => isVerified(t.amount));
      if (tiers.length === 0) return null;
      const parts = tiers.map((t) => {
        if (!isVerified(t.amount)) return "";
        return `${t.unit}: $${t.amount.value}`;
      });
      const sourceIds = Array.from(
        new Set(
          tiers
            .filter((t) => isVerified(t.amount))
            .map((t) =>
              isVerified(t.amount) ? citationId(t.amount.citation.url) : ""
            )
        )
      ).filter(Boolean);
      return {
        value: `${parts.join(" · ")} (reference, not live quote)`,
        sourceIds,
      };
    }
    case "hosted": {
      const hosted = hostedPricingForModel(model.slug);
      if (hosted.length === 0) return null;
      const parts = hosted.map(
        (r) =>
          `${r.billingProviderSlug}${
            r.hostedModelId ? `: ${r.hostedModelId}` : ""
          }`
      );
      const sourceIds = Array.from(
        new Set(
          hosted
            .map((r) => (r.citation ? citationId(r.citation.url) : ""))
            .filter(Boolean)
        )
      );
      return {
        value: parts.join(" · "),
        sourceIds,
      };
    }
    case "sources": {
      const list = collectSources(model);
      if (list.length === 0) return null;
      return {
        value: `${list.length} primary-source citation${
          list.length === 1 ? "" : "s"
        }`,
        sourceIds: list.map((c) => citationId(c.url)),
      };
    }
    case "freshness": {
      const state = getFreshnessState(model.lastCheckedAt, {
        category: "model",
      });
      return {
        value: `${freshnessLabel(state)}${
          model.lastCheckedAt
            ? ` (last checked ${model.lastCheckedAt.slice(0, 10)})`
            : ""
        }`,
        sourceIds: [],
      };
    }
    case "coverage": {
      return {
        value: model.notes ?? "—",
        sourceIds: [],
      };
    }
    case "status": {
      const provider = getProviderBySlug(model.providerSlug);
      const has = Boolean(provider?.statusPageUrl);
      return {
        value: has
          ? "Provider status page recorded (vendor-reported)"
          : "No status surface recorded",
        sourceIds: [],
      };
    }
    case "gaps": {
      // Handled in the dedicated dataGaps array; nothing to add to
      // verifiedEvidence here.
      return null;
    }
  }
}

function gapsForModel(model: ModelEntity): DecisionBriefGap[] {
  const gaps: DecisionBriefGap[] = [];
  const route = `/models/${model.slug}`;
  if (!isVerified(model.contextWindow)) {
    gaps.push({
      modelSlug: model.slug,
      field: "context window",
      reason: "Vendor docs not yet retrieved or value not published.",
      affectedRoute: route,
    });
  }
  if (!isVerified(model.maxOutputTokens)) {
    gaps.push({
      modelSlug: model.slug,
      field: "max output tokens",
      reason: "Not published on the model card or not yet verified.",
      affectedRoute: route,
    });
  }
  if (!isVerified(model.modality)) {
    gaps.push({
      modelSlug: model.slug,
      field: "modality channels",
      reason:
        "Vendor card does not enumerate channels — modality recorded as null rather than guessed.",
      affectedRoute: route,
    });
  }
  if (!isVerified(model.knowledgeCutoff)) {
    gaps.push({
      modelSlug: model.slug,
      field: "knowledge cutoff",
      reason: "Vendor docs not yet retrieved or value not published.",
      affectedRoute: route,
    });
  }
  if (!isVerified(model.releaseDate)) {
    gaps.push({
      modelSlug: model.slug,
      field: "release date",
      reason: "Vendor docs not yet retrieved or value not published.",
      affectedRoute: route,
    });
  }
  if (!isVerified(model.lifecycle)) {
    gaps.push({
      modelSlug: model.slug,
      field: "lifecycle",
      reason: "No verified lifecycle status on record.",
      affectedRoute: route,
    });
  }
  if (!model.pricing.some((t) => isVerified(t.amount))) {
    gaps.push({
      modelSlug: model.slug,
      field: "first-party pricing",
      reason:
        "Model creator publishes no paid first-party API rate, or rate is not yet verified.",
      affectedRoute: "/pricing",
    });
  }
  return gaps;
}

function freshnessNotesForModel(
  model: ModelEntity,
  citations: SourceCitation[]
): DecisionBriefFreshnessNote[] {
  const notes: DecisionBriefFreshnessNote[] = [];
  const modelState = getFreshnessState(model.lastCheckedAt, {
    category: "model",
  });
  if (modelState !== "fresh") {
    notes.push({
      modelSlug: model.slug,
      state: modelState,
      note: `Model record last checked ${
        model.lastCheckedAt ? model.lastCheckedAt.slice(0, 10) : "(unknown)"
      } — state: ${freshnessLabel(modelState)}. Stale ≠ false; re-verify before reuse.`,
    });
  }
  for (const c of citations) {
    const state = getFreshnessState(c.retrievedAt, {
      category: c.type === "official-vendor-pricing" ? "pricing" : "source",
    });
    if (state === "fresh") continue;
    notes.push({
      sourceId: citationId(c.url),
      state,
      note: `${c.name} retrievedAt ${c.retrievedAt.slice(0, 10)} — state: ${freshnessLabel(state)}.`,
    });
  }
  return notes;
}

const NEXT_EXTERNAL_TESTS = [
  "Run task-specific prompt tests against the candidate models in your own environment.",
  "Verify request latency from your target deployment region.",
  "Check rate limits in your provider account against your expected load.",
  "Validate per-token cost against the vendor's current pricing page (references in this brief are not live quotes).",
  "Confirm compliance / security requirements against your organisation's controls — verification status here is not a certification.",
];

const POLICY_NOTES = [
  "This is an evidence pack, not a recommendation.",
  "WebmasterID Models does not declare a winner.",
  "WebmasterID Models does not rank by price.",
  "Hosted pricing is set by the hosting platform, not the model creator.",
  "Unknown values remain explicitly unverified — gaps are not invented.",
  "All values are sourced from the typed local data layer; no live fetching occurred during brief generation.",
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

export function buildDecisionBrief(
  input: DecisionBriefInput
): DecisionBrief {
  const slugs = sanitizeSlugs(input.modelSlugs);
  const fields =
    input.fields && input.fields.length > 0
      ? input.fields
      : DECISION_BRIEF_DEFAULT_FIELDS;
  const useCase = input.useCase
    ? getUseCaseBySlug(input.useCase)
    : undefined;

  const selectedModels: DecisionBriefSelectedModel[] = [];
  const verifiedEvidence: DecisionBriefEvidence[] = [];
  const dataGaps: DecisionBriefGap[] = [];
  const sourceTrail: DecisionBriefSource[] = [];
  const freshnessNotes: DecisionBriefFreshnessNote[] = [];
  const hostedAvailability: DecisionBriefHostedAvailability[] = [];
  const sourceById = new Map<string, DecisionBriefSource>();

  for (const slug of slugs) {
    const model = getModelBySlug(slug);
    if (!model) continue;
    const provider = getProviderBySlug(model.providerSlug);
    selectedModels.push({
      slug: model.slug,
      name: model.name,
      providerSlug: model.providerSlug,
      providerName: provider?.name ?? model.providerSlug,
      lifecycle: isVerified(model.lifecycle)
        ? model.lifecycle.value.status
        : "unverified",
      pageUrl: `${siteConfig.url}/models/${model.slug}`,
    });

    for (const field of fields) {
      const ev = fieldValueForBrief(field, model);
      if (!ev) continue;
      verifiedEvidence.push({
        modelSlug: model.slug,
        field,
        value: ev.value,
        sourceIds: ev.sourceIds,
      });
    }

    if (fields.includes("gaps") || fields.includes("coverage")) {
      dataGaps.push(...gapsForModel(model));
    } else {
      // Always surface gaps so the brief is honest, even when the
      // caller forgot to ask.
      dataGaps.push(...gapsForModel(model));
    }

    const hosted = hostedPricingForModel(model.slug);
    for (const r of hosted) {
      hostedAvailability.push({
        modelSlug: model.slug,
        billingProviderSlug: r.billingProviderSlug,
        hostedModelId: r.hostedModelId ?? "",
        pricingReferenceAvailable: r.tiers.some((t) =>
          isVerified(t.amount)
        ),
        lastCheckedAt: r.lastCheckedAt ?? undefined,
      });
    }

    const citations = collectSources(model);
    for (const c of citations) {
      const id = citationId(c.url);
      if (sourceById.has(id)) continue;
      const entry: DecisionBriefSource = {
        sourceId: id,
        name: c.name,
        url: c.url,
        sourceType: c.type,
        retrievedAt: c.retrievedAt,
      };
      sourceById.set(id, entry);
      sourceTrail.push(entry);
    }
    freshnessNotes.push(...freshnessNotesForModel(model, citations));
  }

  const title = useCase
    ? `Decision brief — ${useCase.title}`
    : "Decision brief";

  return {
    title,
    useCase: useCase?.title,
    generatedAt: siteConfig.buildDate,
    selectedModels,
    verifiedEvidence,
    dataGaps,
    sourceTrail,
    freshnessNotes,
    hostedAvailability,
    nextExternalTests: NEXT_EXTERNAL_TESTS,
    policyNotes: POLICY_NOTES,
  };
}

export function decisionBriefToJson(brief: DecisionBrief): object {
  return JSON.parse(JSON.stringify(brief));
}

export function decisionBriefToMarkdown(brief: DecisionBrief): string {
  const buf: string[] = [];
  buf.push(`# ${brief.title}`);
  buf.push("");
  buf.push(`Generated at: ${brief.generatedAt}`);
  if (brief.useCase) buf.push(`Use case: ${brief.useCase}`);
  buf.push(
    `Selected models: ${brief.selectedModels.length} · Verified evidence rows: ${brief.verifiedEvidence.length} · Data gaps: ${brief.dataGaps.length} · Sources: ${brief.sourceTrail.length}`
  );
  buf.push("");
  buf.push("> This is an evidence pack, not a recommendation.");
  buf.push("");

  if (brief.selectedModels.length) {
    buf.push("## Selected models");
    buf.push("");
    for (const m of brief.selectedModels) {
      buf.push(
        `- **${m.name}** — ${m.providerName} · lifecycle: ${m.lifecycle} · ${m.pageUrl}`
      );
    }
    buf.push("");
  }

  if (brief.verifiedEvidence.length) {
    buf.push("## Verified evidence");
    buf.push("");
    buf.push("| Model | Field | Value | Sources |");
    buf.push("|-------|-------|-------|---------|");
    for (const e of brief.verifiedEvidence) {
      buf.push(
        `| ${e.modelSlug} | ${e.field} | ${e.value.replace(/\|/g, "\\|")} | ${e.sourceIds.join(", ") || "—"} |`
      );
    }
    buf.push("");
  }

  if (brief.dataGaps.length) {
    buf.push("## Data gaps");
    buf.push("");
    buf.push("| Model | Field | Reason | Affected route |");
    buf.push("|-------|-------|--------|----------------|");
    for (const g of brief.dataGaps) {
      buf.push(
        `| ${g.modelSlug} | ${g.field} | ${g.reason.replace(/\|/g, "\\|")} | ${g.affectedRoute} |`
      );
    }
    buf.push("");
  }

  if (brief.sourceTrail.length) {
    buf.push("## Source trail");
    buf.push("");
    buf.push("| Source ID | Name | Type | Retrieved | URL |");
    buf.push("|-----------|------|------|-----------|-----|");
    for (const s of brief.sourceTrail) {
      buf.push(
        `| ${s.sourceId} | ${s.name.replace(/\|/g, "\\|")} | ${s.sourceType} | ${s.retrievedAt.slice(0, 10)} | ${s.url} |`
      );
    }
    buf.push("");
  }

  if (brief.freshnessNotes.length) {
    buf.push("## Freshness notes");
    buf.push("");
    for (const n of brief.freshnessNotes) {
      buf.push(
        `- ${n.modelSlug ?? n.sourceId ?? "—"}: ${n.note}`
      );
    }
    buf.push("");
  }

  if (brief.hostedAvailability.length) {
    buf.push("## Hosted availability");
    buf.push("");
    buf.push("| Model | Billing provider | Hosted model ID | Pricing reference | Last checked |");
    buf.push("|-------|------------------|-----------------|-------------------|--------------|");
    for (const h of brief.hostedAvailability) {
      buf.push(
        `| ${h.modelSlug} | ${h.billingProviderSlug} | ${h.hostedModelId || "—"} | ${h.pricingReferenceAvailable ? "available" : "not verified"} | ${h.lastCheckedAt ? h.lastCheckedAt.slice(0, 10) : "—"} |`
      );
    }
    buf.push("");
  }

  buf.push("## Next external tests");
  buf.push("");
  for (const t of brief.nextExternalTests) {
    buf.push(`- [ ] ${t}`);
  }
  buf.push("");

  buf.push("## Policy notes");
  buf.push("");
  for (const p of brief.policyNotes) {
    buf.push(`- ${p}`);
  }
  buf.push("");

  return buf.join("\n");
}

export function getDecisionBriefDefaults(
  useCase?: ModelUseCaseSlug
): DecisionBriefInput {
  if (!useCase) {
    return { modelSlugs: [], fields: DECISION_BRIEF_DEFAULT_FIELDS };
  }
  const shortlist = getUseCaseShortlist(useCase).slice(0, 4);
  return {
    modelSlugs: shortlist.map((e) => e.model.slug),
    useCase,
    fields: DECISION_BRIEF_DEFAULT_FIELDS,
  };
}

export function decisionBriefUrl(input: {
  modelSlugs: string[];
  useCase?: ModelUseCaseSlug;
  fields?: DecisionBriefField[];
}): string {
  const params = new URLSearchParams();
  if (input.modelSlugs.length) {
    params.set("models", input.modelSlugs.join(","));
  }
  if (input.useCase) params.set("useCase", input.useCase);
  if (input.fields && input.fields.length) {
    params.set("fields", input.fields.join(","));
  }
  const qs = params.toString();
  return qs ? `/briefs/build?${qs}` : "/briefs/build";
}

/** Available models for the select dropdowns. */
export function getBriefableModels(): ModelEntity[] {
  return [...models];
}

/** Provider list — useful for filtering in the UI. */
export function getBriefableProviders() {
  return providers;
}
