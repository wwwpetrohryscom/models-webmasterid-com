import type { ModelEntity } from "@/lib/types";
import { verified, mergeCitations } from "@/lib/verified";
import { anthropicModelsOverview, anthropicPricing } from "./citations";

// ---------------------------------------------------------------------------
// Claude Opus 4 — verified end-to-end against official Anthropic documentation
//
// Both source pages were retrieved on 2026-05-20 and stamped in
// `data/citations.ts`. Every value below is either:
//   (a) wrapped with `verified()` and a citation, or
//   (b) explicitly null and rendered through the DataNotVerified component.
//
// Re-verify per VERIFICATION.md before changing any field.
// ---------------------------------------------------------------------------

const claudeOpus4: ModelEntity = {
  id: "model-claude-opus-4",
  slug: "claude-opus-4",
  name: "Claude Opus 4",
  description:
    "Anthropic's Claude Opus 4 (snapshot 2025-05-14, deprecated). Original Claude 4 generation Opus model. Anthropic has announced retirement of this snapshot; new workloads should target Claude Opus 4.7.",
  providerSlug: "anthropic",
  sourceUrl: anthropicModelsOverview.url,
  sourceName: anthropicModelsOverview.name,
  sourceType: anthropicModelsOverview.type,
  verified: true,
  verificationStatus: "verified",
  confidenceLevel: "high",
  lastCheckedAt: "2026-05-20T00:00:00.000Z",
  updatedDate: "2026-05-20",
  notes:
    "Original Claude Opus 4 (claude-opus-4-20250514). Now deprecated; retires 2026-06-15. Tracked here to keep the historical record intact and to anchor verification workflow on real, sourced data.",

  apiIdentifiers: verified(
    {
      canonical: "claude-opus-4-20250514",
      alias: "claude-opus-4-0",
      bedrock: "anthropic.claude-opus-4-20250514-v1:0",
      vertex: "claude-opus-4@20250514",
    },
    anthropicModelsOverview,
    {
      notes:
        "API IDs verified from the 'Legacy models' table on Anthropic's Models overview page.",
    }
  ),

  // The model ID date is documented by Anthropic as a "pinned snapshot"; we
  // record it as the snapshot date and intentionally leave releaseDate null
  // until a separate primary source confirms public release timing.
  releaseDate: null,
  snapshotDate: verified("2025-05-14", anthropicModelsOverview, {
    notes:
      "Snapshot date encoded in the canonical API ID (claude-opus-4-20250514). Per Anthropic's stated naming convention, dated IDs are pinned snapshots.",
  }),

  knowledgeCutoff: verified(
    { reliable: "2025-01", training: "2025-03" },
    anthropicModelsOverview,
    { notes: "Reliable knowledge cutoff: Jan 2025; training data cutoff: Mar 2025." }
  ),

  contextWindow: verified(200_000, anthropicModelsOverview, {
    notes: "Listed as '200k tokens' on the Anthropic Models overview page.",
  }),

  maxOutputTokens: verified(32_000, anthropicModelsOverview, {
    notes:
      "Listed as '32k tokens' max output on the synchronous Messages API. Batch API may differ.",
  }),

  modality: verified(
    ["text-in", "text-out"],
    anthropicModelsOverview,
    {
      confidence: "high",
      notes:
        "Conservative: only text input and text output are recorded as verified from the Anthropic Models overview page entry for this deprecated snapshot. Vision support is widely advertised for the Claude 4 family but is not explicitly listed in the deprecated row; image-in is intentionally not asserted here.",
    }
  ),

  pricing: [
    {
      unit: "1M input tokens",
      amount: verified(15, anthropicPricing, {
        notes: "Base input tokens — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M output tokens",
      amount: verified(75, anthropicPricing, {
        notes: "Output tokens — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M cache write tokens (5m)",
      amount: verified(18.75, anthropicPricing, {
        notes: "5-minute prompt-cache write — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M cache write tokens (1h)",
      amount: verified(30, anthropicPricing, {
        notes: "1-hour prompt-cache write — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M cache read tokens",
      amount: verified(1.5, anthropicPricing, {
        notes: "Cache hits / refreshes — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M batch input tokens",
      amount: verified(7.5, anthropicPricing, {
        notes: "Batch API input (50% discount) — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M batch output tokens",
      amount: verified(37.5, anthropicPricing, {
        notes: "Batch API output (50% discount) — Anthropic pricing reference.",
      }),
    },
  ],

  // No third-party benchmark sources are verified yet for this snapshot.
  benchmarks: [],

  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },

  features: verified(
    {
      extendedThinking: true,
      priorityTier: true,
      visionInput: undefined,
      toolUse: true,
    },
    anthropicModelsOverview,
    {
      notes:
        "Extended thinking: Yes; Priority Tier: Yes; Tool use: documented on Anthropic pricing reference for this row. visionInput intentionally left undefined per modality note.",
    }
  ),

  lifecycle: verified(
    {
      status: "deprecated",
      retirementDate: "2026-06-15",
      migrationTarget: "claude-opus-4-7",
    },
    anthropicModelsOverview,
    {
      notes:
        "Anthropic warning: 'Claude Opus 4 (claude-opus-4-20250514) is deprecated and will be retired on June 15, 2026. Migrate to Claude Opus 4.7.'",
    }
  ),

  citations: mergeCitations([anthropicModelsOverview, anthropicPricing]),
};

// ---------------------------------------------------------------------------
// All other models: structure migrated to the new verified shape but every
// field is null until verified against a primary source. They exist as
// catalogue entries only.
// ---------------------------------------------------------------------------

function unverifiedModel(params: {
  id: string;
  slug: string;
  name: string;
  providerSlug: string;
  providerHomepage: string;
  description: string;
}): ModelEntity {
  return {
    id: params.id,
    slug: params.slug,
    name: params.name,
    description: params.description,
    providerSlug: params.providerSlug,
    sourceUrl: params.providerHomepage,
    sourceName: `${params.providerSlug} — homepage (pending primary-source verification)`,
    sourceType: "official-vendor-site",
    verified: false,
    verificationStatus: "unverified",
    confidenceLevel: "unverified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    notes:
      "Catalogue entry only. No metric has been verified against a primary source yet.",

    apiIdentifiers: null,
    releaseDate: null,
    snapshotDate: null,
    knowledgeCutoff: null,
    contextWindow: null,
    maxOutputTokens: null,
    modality: null,

    pricing: [
      { unit: "1M input tokens", amount: null },
      { unit: "1M output tokens", amount: null },
    ],
    benchmarks: [],
    infrastructure: {
      regions: null,
      avgLatencyMs: null,
      uptimePercent: null,
    },
    features: null,
    lifecycle: null,

    citations: [],
  };
}

export const models: ModelEntity[] = [
  claudeOpus4,
  unverifiedModel({
    id: "model-gpt-5",
    slug: "gpt-5",
    name: "GPT-5",
    providerSlug: "openai",
    providerHomepage: "https://openai.com",
    description:
      "OpenAI GPT-5 catalogue entry. No metric has been verified against an official OpenAI source yet.",
  }),
  unverifiedModel({
    id: "model-gemini-2-5-pro",
    slug: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    providerSlug: "google",
    providerHomepage: "https://deepmind.google",
    description:
      "Google Gemini 2.5 Pro catalogue entry. No metric has been verified against an official Google DeepMind source yet.",
  }),
  unverifiedModel({
    id: "model-deepseek-r1",
    slug: "deepseek-r1",
    name: "DeepSeek R1-0520",
    providerSlug: "deepseek",
    providerHomepage: "https://deepseek.com",
    description:
      "DeepSeek R1-0520 catalogue entry. No metric has been verified against an official DeepSeek source yet.",
  }),
  unverifiedModel({
    id: "model-llama-4-scout",
    slug: "llama-4-scout",
    name: "Llama 4 Scout",
    providerSlug: "meta",
    providerHomepage: "https://ai.meta.com",
    description:
      "Meta Llama 4 Scout catalogue entry. No metric has been verified against an official Meta AI source yet.",
  }),
  unverifiedModel({
    id: "model-mistral-large-2",
    slug: "mistral-large-2",
    name: "Mistral Large 2",
    providerSlug: "mistral",
    providerHomepage: "https://mistral.ai",
    description:
      "Mistral Large 2 catalogue entry. No metric has been verified against an official Mistral source yet.",
  }),
];

export const featuredModels = models.slice(0, 6);

export function getModelBySlug(slug: string): ModelEntity | undefined {
  return models.find((m) => m.slug === slug);
}

export function getModelsByProvider(providerSlug: string): ModelEntity[] {
  return models.filter((m) => m.providerSlug === providerSlug);
}
