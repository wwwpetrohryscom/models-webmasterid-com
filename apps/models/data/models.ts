import type { ModelEntity } from "@/lib/types";
import { verified, mergeCitations } from "@/lib/verified";
import {
  anthropicModelsOverview,
  anthropicPricing,
  googleGeminiModelDocs,
  googleGeminiPricing,
  googleGeminiQuickstart,
  deepseekModelsAndPricing,
  deepseekApiReference,
  deepseekDocsRoot,
  deepseekR1_0528News,
  mistralModelsOverview,
  mistralModelsTable,
  mistralApiReference,
  mistralLarge3ModelCard,
} from "./citations";

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
// Claude Opus 4.7 — current flagship Anthropic Opus model. Verified from the
// same Anthropic Models overview and Pricing pages that anchor Claude Opus 4.
// ---------------------------------------------------------------------------

const claudeOpus4_7: ModelEntity = {
  id: "model-claude-opus-4-7",
  slug: "claude-opus-4-7",
  name: "Claude Opus 4.7",
  description:
    "Anthropic's current flagship Claude Opus model. Documented by Anthropic as its most capable generally available model for complex reasoning and agentic coding.",
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
    "Per Anthropic, Opus 4.7 uses a new tokenizer compared to previous models that may use up to 35% more tokens for the same fixed text.",

  apiIdentifiers: verified(
    {
      canonical: "claude-opus-4-7",
      alias: "claude-opus-4-7",
      bedrock: "anthropic.claude-opus-4-7",
      vertex: "claude-opus-4-7",
    },
    anthropicModelsOverview,
    {
      notes:
        "API IDs verified from the 'Latest models comparison' table on Anthropic's Models overview page.",
    }
  ),

  releaseDate: null,
  snapshotDate: null,

  knowledgeCutoff: verified(
    { reliable: "2026-01", training: "2026-01" },
    anthropicModelsOverview,
    { notes: "Reliable knowledge cutoff and training data cutoff both Jan 2026." }
  ),

  contextWindow: verified(1_000_000, anthropicModelsOverview, {
    notes:
      "Listed as '1M tokens' on the Anthropic Models overview page. Tooltip: ~555k words / ~2.5M unicode characters (new tokenizer).",
  }),

  maxOutputTokens: verified(128_000, anthropicModelsOverview, {
    notes:
      "Listed as '128k tokens' max output on the synchronous Messages API. Up to 300k via Message Batches API beta header.",
  }),

  modality: verified(
    ["text-in", "image-in", "text-out"],
    anthropicModelsOverview,
    {
      confidence: "high",
      notes:
        "Overview page: 'All current Claude models support text and image input, text output, multilingual capabilities, and vision.' Opus 4.7 is a current model on that page.",
    }
  ),

  pricing: [
    {
      unit: "1M input tokens",
      amount: verified(5, anthropicPricing, {
        notes: "Base input tokens — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M output tokens",
      amount: verified(25, anthropicPricing, {
        notes: "Output tokens — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M cache write tokens (5m)",
      amount: verified(6.25, anthropicPricing, {
        notes: "5-minute prompt-cache write — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M cache write tokens (1h)",
      amount: verified(10, anthropicPricing, {
        notes: "1-hour prompt-cache write — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M cache read tokens",
      amount: verified(0.5, anthropicPricing, {
        notes: "Cache hits / refreshes — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M batch input tokens",
      amount: verified(2.5, anthropicPricing, {
        notes: "Batch API input (50% discount) — Anthropic pricing reference.",
      }),
    },
    {
      unit: "1M batch output tokens",
      amount: verified(12.5, anthropicPricing, {
        notes: "Batch API output (50% discount) — Anthropic pricing reference.",
      }),
    },
  ],

  benchmarks: [],

  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },

  features: verified(
    {
      extendedThinking: false,
      adaptiveThinking: true,
      priorityTier: true,
      visionInput: true,
      toolUse: true,
    },
    anthropicModelsOverview,
    {
      notes:
        "Extended thinking: No; Adaptive thinking: Yes; Priority Tier: Yes; Tool use overhead documented on Anthropic pricing reference.",
    }
  ),

  lifecycle: verified(
    { status: "active" },
    anthropicModelsOverview,
    {
      notes:
        "Listed in 'Latest models comparison' (current section) on Anthropic's Models overview page.",
    }
  ),

  citations: mergeCitations([anthropicModelsOverview, anthropicPricing]),
};

// ---------------------------------------------------------------------------
// Claude Sonnet 4.6 — current Anthropic Sonnet model.
// ---------------------------------------------------------------------------

const claudeSonnet4_6: ModelEntity = {
  id: "model-claude-sonnet-4-6",
  slug: "claude-sonnet-4-6",
  name: "Claude Sonnet 4.6",
  description:
    "Anthropic's current Sonnet model. Documented by Anthropic as the best combination of speed and intelligence.",
  providerSlug: "anthropic",
  sourceUrl: anthropicModelsOverview.url,
  sourceName: anthropicModelsOverview.name,
  sourceType: anthropicModelsOverview.type,
  verified: true,
  verificationStatus: "verified",
  confidenceLevel: "high",
  lastCheckedAt: "2026-05-20T00:00:00.000Z",
  updatedDate: "2026-05-20",
  notes: null,

  apiIdentifiers: verified(
    {
      canonical: "claude-sonnet-4-6",
      alias: "claude-sonnet-4-6",
      bedrock: "anthropic.claude-sonnet-4-6",
      vertex: "claude-sonnet-4-6",
    },
    anthropicModelsOverview,
    { notes: "API IDs from Anthropic's Models overview." }
  ),

  releaseDate: null,
  snapshotDate: null,

  knowledgeCutoff: verified(
    { reliable: "2025-08", training: "2026-01" },
    anthropicModelsOverview,
    { notes: "Reliable knowledge cutoff Aug 2025; training data cutoff Jan 2026." }
  ),

  contextWindow: verified(1_000_000, anthropicModelsOverview, {
    notes:
      "Listed as '1M tokens'. Tooltip: ~750k words / ~3.4M unicode characters.",
  }),

  maxOutputTokens: verified(64_000, anthropicModelsOverview, {
    notes: "64k tokens max output on the synchronous Messages API.",
  }),

  modality: verified(
    ["text-in", "image-in", "text-out"],
    anthropicModelsOverview,
    {
      notes:
        "Overview page: 'All current Claude models support text and image input, text output, multilingual capabilities, and vision.'",
    }
  ),

  pricing: [
    {
      unit: "1M input tokens",
      amount: verified(3, anthropicPricing),
    },
    {
      unit: "1M output tokens",
      amount: verified(15, anthropicPricing),
    },
    {
      unit: "1M cache write tokens (5m)",
      amount: verified(3.75, anthropicPricing),
    },
    {
      unit: "1M cache write tokens (1h)",
      amount: verified(6, anthropicPricing),
    },
    {
      unit: "1M cache read tokens",
      amount: verified(0.3, anthropicPricing),
    },
    {
      unit: "1M batch input tokens",
      amount: verified(1.5, anthropicPricing),
    },
    {
      unit: "1M batch output tokens",
      amount: verified(7.5, anthropicPricing),
    },
  ],

  benchmarks: [],

  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },

  features: verified(
    {
      extendedThinking: true,
      adaptiveThinking: true,
      priorityTier: true,
      visionInput: true,
      toolUse: true,
    },
    anthropicModelsOverview,
    {
      notes:
        "Extended thinking: Yes; Adaptive thinking: Yes; Priority Tier: Yes; Tool use documented on Anthropic pricing reference.",
    }
  ),

  lifecycle: verified(
    { status: "active" },
    anthropicModelsOverview
  ),

  citations: mergeCitations([anthropicModelsOverview, anthropicPricing]),
};

// ---------------------------------------------------------------------------
// Claude Haiku 4.5 — current Anthropic Haiku model (fastest tier).
// ---------------------------------------------------------------------------

const claudeHaiku4_5: ModelEntity = {
  id: "model-claude-haiku-4-5",
  slug: "claude-haiku-4-5",
  name: "Claude Haiku 4.5",
  description:
    "Anthropic's current Haiku model. Documented by Anthropic as the fastest model with near-frontier intelligence.",
  providerSlug: "anthropic",
  sourceUrl: anthropicModelsOverview.url,
  sourceName: anthropicModelsOverview.name,
  sourceType: anthropicModelsOverview.type,
  verified: true,
  verificationStatus: "verified",
  confidenceLevel: "high",
  lastCheckedAt: "2026-05-20T00:00:00.000Z",
  updatedDate: "2026-05-20",
  notes: null,

  apiIdentifiers: verified(
    {
      canonical: "claude-haiku-4-5-20251001",
      alias: "claude-haiku-4-5",
      bedrock: "anthropic.claude-haiku-4-5-20251001-v1:0",
      vertex: "claude-haiku-4-5@20251001",
    },
    anthropicModelsOverview,
    { notes: "API IDs from Anthropic's Models overview." }
  ),

  releaseDate: null,
  snapshotDate: verified("2025-10-01", anthropicModelsOverview, {
    notes:
      "Snapshot date encoded in the canonical API ID (claude-haiku-4-5-20251001).",
  }),

  knowledgeCutoff: verified(
    { reliable: "2025-02", training: "2025-07" },
    anthropicModelsOverview
  ),

  contextWindow: verified(200_000, anthropicModelsOverview, {
    notes:
      "Listed as '200k tokens'. Tooltip: ~150k words / ~680k unicode characters.",
  }),

  maxOutputTokens: verified(64_000, anthropicModelsOverview),

  modality: verified(
    ["text-in", "image-in", "text-out"],
    anthropicModelsOverview
  ),

  pricing: [
    {
      unit: "1M input tokens",
      amount: verified(1, anthropicPricing),
    },
    {
      unit: "1M output tokens",
      amount: verified(5, anthropicPricing),
    },
    {
      unit: "1M cache write tokens (5m)",
      amount: verified(1.25, anthropicPricing),
    },
    {
      unit: "1M cache write tokens (1h)",
      amount: verified(2, anthropicPricing),
    },
    {
      unit: "1M cache read tokens",
      amount: verified(0.1, anthropicPricing),
    },
    {
      unit: "1M batch input tokens",
      amount: verified(0.5, anthropicPricing),
    },
    {
      unit: "1M batch output tokens",
      amount: verified(2.5, anthropicPricing),
    },
  ],

  benchmarks: [],

  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },

  features: verified(
    {
      extendedThinking: true,
      adaptiveThinking: false,
      priorityTier: true,
      visionInput: true,
      toolUse: true,
    },
    anthropicModelsOverview,
    {
      notes:
        "Extended thinking: Yes; Adaptive thinking: No; Priority Tier: Yes.",
    }
  ),

  lifecycle: verified({ status: "active" }, anthropicModelsOverview),

  citations: mergeCitations([anthropicModelsOverview, anthropicPricing]),
};

// ---------------------------------------------------------------------------
// Gemini 2.5 Pro — verified against Google AI's per-model docs and pricing
// reference. Pricing rows use the ≤200k-token tier as the canonical value;
// the >200k-token surcharge is recorded in each tier's `notes` field.
// ---------------------------------------------------------------------------

const gemini2_5Pro: ModelEntity = {
  id: "model-gemini-2-5-pro",
  slug: "gemini-2-5-pro",
  name: "Gemini 2.5 Pro",
  description:
    "Google DeepMind's flagship Gemini 2.5 model. Documented by Google as its most advanced model for complex tasks, featuring deep reasoning and coding capabilities.",
  providerSlug: "google",
  sourceUrl: googleGeminiModelDocs.url,
  sourceName: googleGeminiModelDocs.name,
  sourceType: googleGeminiModelDocs.type,
  verified: true,
  verificationStatus: "verified",
  confidenceLevel: "high",
  lastCheckedAt: "2026-05-20T00:00:00.000Z",
  updatedDate: "2026-05-20",
  notes:
    "Google publishes a two-tier prompt-size price: pricing values below are the ≤200k-token tier; the >200k-token surcharge is recorded in each pricing row's notes. Cache pricing semantics on the Gemini API differ from Anthropic's (per-hour cache storage rather than per-token TTL caching) and are not yet mapped into the schema — see model record notes.",

  apiIdentifiers: verified(
    {
      canonical: "gemini-2.5-pro",
    },
    googleGeminiModelDocs,
    {
      notes:
        "Model code as listed on the Gemini 2.5 Pro per-model documentation page.",
    }
  ),

  releaseDate: null,
  snapshotDate: null,

  knowledgeCutoff: verified(
    { reliable: "2025-01" },
    googleGeminiModelDocs,
    {
      notes:
        "Knowledge cutoff listed as 'January 2025' on the Gemini 2.5 Pro per-model documentation page.",
    }
  ),

  contextWindow: verified(1_048_576, googleGeminiModelDocs, {
    notes:
      "Input token limit listed as '1,048,576' on the Gemini 2.5 Pro per-model documentation page.",
  }),

  maxOutputTokens: verified(65_536, googleGeminiModelDocs, {
    notes:
      "Output token limit listed as '65,536' on the Gemini 2.5 Pro per-model documentation page.",
  }),

  modality: verified(
    ["text-in", "image-in", "audio-in", "video-in", "text-out"],
    googleGeminiModelDocs,
    {
      confidence: "high",
      notes:
        "Supported inputs listed as 'Audio, images, video, text, and PDF' on the Gemini 2.5 Pro per-model documentation page; output listed as 'Text'. PDF input is not represented in the ModalityChannel union (closest to a document modality); recorded as image-in is incorrect — left out. text-in covers PDF text content as a working approximation; see notes.",
    }
  ),

  pricing: [
    {
      unit: "1M input tokens",
      amount: verified(1.25, googleGeminiPricing, {
        notes: "Standard tier, prompts ≤200k tokens.",
      }),
    },
    {
      unit: "1M input tokens (>200k context)",
      amount: verified(2.5, googleGeminiPricing, {
        notes: "Standard tier surcharge for prompts >200k tokens.",
      }),
    },
    {
      unit: "1M output tokens",
      amount: verified(10, googleGeminiPricing, {
        notes: "Standard tier, prompts ≤200k tokens.",
      }),
    },
    {
      unit: "1M output tokens (>200k context)",
      amount: verified(15, googleGeminiPricing, {
        notes: "Standard tier surcharge for prompts >200k tokens.",
      }),
    },
    {
      unit: "1M cache write tokens (5m)",
      amount: verified(0.125, googleGeminiPricing, {
        notes:
          "Cache write rate per million tokens, prompts ≤200k. Gemini does not advertise a 5m vs 1h TTL distinction; the value is recorded under the closest existing unit and the per-hour cache storage rate is captured separately below.",
      }),
    },
    {
      unit: "1M cache write tokens (>200k context)",
      amount: verified(0.25, googleGeminiPricing, {
        notes: "Cache write surcharge for prompts >200k tokens.",
      }),
    },
    {
      unit: "1M cache storage / hour",
      amount: verified(4.5, googleGeminiPricing, {
        notes:
          "Cache storage rate per million tokens per hour. Independent of the cache write fee above.",
      }),
    },
    {
      unit: "1M batch input tokens",
      amount: verified(0.625, googleGeminiPricing, {
        notes: "Batch tier, prompts ≤200k tokens.",
      }),
    },
    {
      unit: "1M batch input tokens (>200k context)",
      amount: verified(1.25, googleGeminiPricing, {
        notes: "Batch tier surcharge for prompts >200k tokens.",
      }),
    },
    {
      unit: "1M batch output tokens",
      amount: verified(5, googleGeminiPricing, {
        notes: "Batch tier, prompts ≤200k tokens.",
      }),
    },
    {
      unit: "1M batch output tokens (>200k context)",
      amount: verified(7.5, googleGeminiPricing, {
        notes: "Batch tier surcharge for prompts >200k tokens.",
      }),
    },
  ],

  benchmarks: [],

  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },

  features: verified(
    {
      extendedThinking: undefined,
      adaptiveThinking: undefined,
      priorityTier: true,
      visionInput: true,
      toolUse: true,
    },
    googleGeminiModelDocs,
    {
      notes:
        "Function calling: Supported. Code execution: Supported. Structured output: Supported. Grounding with Google Search: Supported. Vision input verified via 'Audio, images, video, text, and PDF' supported inputs. Priority tier exists on Gemini pricing page.",
    }
  ),

  lifecycle: verified(
    { status: "active" },
    googleGeminiModelDocs,
    {
      notes:
        "Gemini 2.5 Pro is listed under active models on the Gemini API documentation, not in deprecated models.",
    }
  ),

  citations: mergeCitations([
    googleGeminiModelDocs,
    googleGeminiPricing,
    googleGeminiQuickstart,
  ]),
};

// ---------------------------------------------------------------------------
// DeepSeek v4 Pro — verified against api-docs.deepseek.com pricing page
// and API reference. Canonical (regular) prices are recorded; the 75%
// promotional discount active until 2026-05-31 15:59 UTC is captured in
// each pricing row's notes so the page does not encode a soon-to-expire
// value as the durable rate.
// ---------------------------------------------------------------------------

const deepseekV4Pro: ModelEntity = {
  id: "model-deepseek-v4-pro",
  slug: "deepseek-v4-pro",
  name: "DeepSeek V4 Pro",
  description:
    "DeepSeek's current generation reasoning model. Listed by DeepSeek alongside deepseek-v4-flash on the API Models & Pricing page; the older deepseek-chat and deepseek-reasoner models are documented as scheduled for deprecation on 2026/07/24.",
  providerSlug: "deepseek",
  sourceUrl: deepseekModelsAndPricing.url,
  sourceName: deepseekModelsAndPricing.name,
  sourceType: deepseekModelsAndPricing.type,
  verified: true,
  verificationStatus: "verified",
  confidenceLevel: "high",
  lastCheckedAt: "2026-05-21T00:00:00.000Z",
  updatedDate: "2026-05-21",
  notes:
    "DeepSeek is running a 75% promotional discount on deepseek-v4-pro until 2026/05/31 15:59 UTC. Pricing rows below record the regular rate as the durable canonical value; the effective discounted rate is captured per row in `notes`. Sprint 8B re-verified the API reference and pricing pages on 2026-05-21 — no value changed.",

  apiIdentifiers: verified(
    {
      canonical: "deepseek-v4-pro",
    },
    deepseekApiReference,
    {
      notes:
        "Listed in `Possible values: [deepseek-v4-flash, deepseek-v4-pro]` on the chat completion API reference.",
    }
  ),

  releaseDate: null,
  snapshotDate: null,

  knowledgeCutoff: null,

  contextWindow: verified(1_000_000, deepseekModelsAndPricing, {
    notes:
      "Listed as '1M' on the DeepSeek Models & Pricing page for both deepseek-v4-flash and deepseek-v4-pro.",
  }),

  maxOutputTokens: null,

  modality: null,

  pricing: [
    {
      unit: "1M input tokens",
      amount: verified(1.74, deepseekModelsAndPricing, {
        notes:
          "Cache-miss input regular rate. Effective rate $0.435 / MTok during the 75% discount window (until 2026/05/31 15:59 UTC).",
      }),
    },
    {
      unit: "1M cache read tokens",
      amount: verified(0.0145, deepseekModelsAndPricing, {
        notes:
          "Cache-hit input regular rate. Effective rate $0.003625 / MTok during the 75% discount window. The cache pricing change (vs. previous schedule) took effect from 2026/4/26 12:15 UTC.",
      }),
    },
    {
      unit: "1M output tokens",
      amount: verified(3.48, deepseekModelsAndPricing, {
        notes:
          "Output regular rate. Effective rate $0.87 / MTok during the 75% discount window.",
      }),
    },
  ],

  benchmarks: [],

  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },

  features: null,

  lifecycle: verified(
    { status: "active" },
    deepseekDocsRoot,
    {
      notes:
        "Listed as a current model on the DeepSeek API docs root, not in the deprecation list (which currently contains deepseek-chat and deepseek-reasoner, scheduled for deprecation 2026/07/24).",
    }
  ),

  citations: mergeCitations([
    deepseekModelsAndPricing,
    deepseekApiReference,
    deepseekDocsRoot,
  ]),
};

// ---------------------------------------------------------------------------
// Mistral Large 3 — partial verification.
// Mistral's per-model spec card pages return 404 from automated retrieval,
// so only the API identifier and lifecycle status are verified. Context
// window, max output, modality, and pricing remain null until a manual
// browser pass against the individual model card.
// ---------------------------------------------------------------------------

const mistralLarge3: ModelEntity = {
  id: "model-mistral-large-3",
  slug: "mistral-large-3",
  name: "Mistral Large 3",
  description:
    "Mistral's current Large-tier flagship (v25.12). Open-weight, multimodal, state-of-the-art general-purpose model — verified end-to-end against Mistral's overview, models table, API reference, and the per-model spec card.",
  providerSlug: "mistral",
  sourceUrl: mistralLarge3ModelCard.url,
  sourceName: mistralLarge3ModelCard.name,
  sourceType: mistralLarge3ModelCard.type,
  verified: true,
  verificationStatus: "verified",
  confidenceLevel: "high",
  lastCheckedAt: "2026-05-21T00:00:00.000Z",
  updatedDate: "2026-05-21",
  notes:
    "Mistral's per-model spec card moved to docs.mistral.ai/models/model-cards/<slug>. Re-retrieved on 2026-05-21 — canonical snapshot `mistral-large-2512`, 256k context window, $0.5/$1.5 per-million input/output verified. Max output and explicit modality list are still not stated on the page; those fields remain null.",

  apiIdentifiers: verified(
    {
      canonical: "mistral-large-2512",
      alias: "mistral-large-latest",
    },
    mistralLarge3ModelCard,
    {
      notes:
        "Canonical pinned snapshot ID from the Mistral Large 3 (v25.12) spec card. The `mistral-large-latest` alias is documented in the API reference as the version-agnostic example identifier.",
    }
  ),

  releaseDate: null,
  snapshotDate: null,
  knowledgeCutoff: null,

  contextWindow: verified(256_000, mistralLarge3ModelCard, {
    notes:
      "Listed as '256k' on the Mistral Large 3 (v25.12) spec card.",
  }),

  maxOutputTokens: null,
  modality: null,

  pricing: [
    {
      unit: "1M input tokens",
      amount: verified(0.5, mistralLarge3ModelCard, {
        notes: "Listed as '$0.5 /M Tokens' on the Mistral Large 3 (v25.12) spec card.",
      }),
    },
    {
      unit: "1M output tokens",
      amount: verified(1.5, mistralLarge3ModelCard, {
        notes: "Listed as '$1.5 /M Tokens' on the Mistral Large 3 (v25.12) spec card.",
      }),
    },
  ],

  benchmarks: [],

  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },

  features: null,

  lifecycle: verified(
    { status: "active" },
    mistralModelsOverview,
    {
      notes:
        "Listed in the 'Frontier Generalist Models' section as version v25.12, Open. Not in any legacy/deprecated section on the models overview.",
    }
  ),

  citations: mergeCitations([
    mistralLarge3ModelCard,
    mistralModelsOverview,
    mistralModelsTable,
    mistralApiReference,
  ]),
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

// ---------------------------------------------------------------------------
// DeepSeek R1 — historical entry. R1 family is not in the current DeepSeek
// API parameter set (which is [deepseek-v4-flash, deepseek-v4-pro]); kept
// here as a historical record anchored to the R1-0528 release note.
// Lifecycle is recorded as `retired` because the snapshot is no longer a
// valid value of the `model` parameter on the current chat-completions
// endpoint.
// ---------------------------------------------------------------------------

const deepseekR1Historical: ModelEntity = {
  id: "model-deepseek-r1",
  slug: "deepseek-r1",
  name: "DeepSeek R1-0528 (historical)",
  description:
    "Historical DeepSeek R1 reasoning model. The R1-0528 snapshot was announced on 2025-05-28 and the related R1-0520 build referenced in Sprint 8B's preferred-target list belongs to the same family. The current DeepSeek chat-completions endpoint accepts only `deepseek-v4-flash` and `deepseek-v4-pro` as model values, so R1 is recorded here as a historical reference rather than a currently callable model.",
  providerSlug: "deepseek",
  sourceUrl: deepseekR1_0528News.url,
  sourceName: deepseekR1_0528News.name,
  sourceType: deepseekR1_0528News.type,
  verified: false,
  verificationStatus: "partial",
  confidenceLevel: "medium",
  lastCheckedAt: "2026-05-21T00:00:00.000Z",
  updatedDate: "2026-05-21",
  notes:
    "Anchored to DeepSeek's R1-0528 release announcement. Specs (context window, max output, pricing) are not republished here because the announcement does not encode them as standalone numbers and the snapshot is no longer in the active API model list. New workloads should target deepseek-v4-pro.",

  apiIdentifiers: null,
  releaseDate: verified("2025-05-28", deepseekR1_0528News, {
    notes:
      "Release date for DeepSeek-R1-0528 as documented in the official news announcement.",
  }),
  snapshotDate: verified("2025-05-28", deepseekR1_0528News, {
    notes:
      "Snapshot date encoded in the release announcement title (news250528).",
  }),
  knowledgeCutoff: null,
  contextWindow: null,
  maxOutputTokens: null,
  modality: null,

  pricing: [],
  benchmarks: [],
  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },
  features: null,

  lifecycle: verified(
    { status: "retired", migrationTarget: "deepseek-v4-pro" },
    deepseekApiReference,
    {
      notes:
        "DeepSeek's chat-completions API reference lists `Possible values: [deepseek-v4-flash, deepseek-v4-pro]`. The R1 snapshot is no longer a valid value of the `model` parameter and is recorded as retired here.",
    }
  ),

  citations: mergeCitations([deepseekR1_0528News, deepseekApiReference]),
};

// ---------------------------------------------------------------------------
// Mistral Large 2 — historical entry. Documented by Mistral as deprecated
// 2024-11-30 and retired 2025-03-30 (already retired as of today, 2026-05-21).
// Recorded for historical reference only; new workloads should evaluate
// the current Mistral Large 3.
// ---------------------------------------------------------------------------

const mistralLarge2Historical: ModelEntity = {
  id: "model-mistral-large-2",
  slug: "mistral-large-2",
  name: "Mistral Large 2 (retired)",
  description:
    "Historical Mistral Large 2 entry. Mistral documents this snapshot in the Legacy/Deprecated section of its models overview as deprecated on 2024-11-30 and retired on 2025-03-30 — i.e. already retired as of the most recent verification (2026-05-21). New workloads should evaluate Mistral Large 3, the current Large-tier flagship.",
  providerSlug: "mistral",
  sourceUrl: mistralModelsOverview.url,
  sourceName: mistralModelsOverview.name,
  sourceType: mistralModelsOverview.type,
  verified: false,
  verificationStatus: "partial",
  confidenceLevel: "medium",
  lastCheckedAt: "2026-05-21T00:00:00.000Z",
  updatedDate: "2026-05-21",
  notes:
    "Only lifecycle metadata is verified. Per-model spec card pages return 404 on docs.mistral.ai, and Mistral does not republish historical pricing for retired models. Context window, max output, and pricing remain null.",

  apiIdentifiers: null,
  releaseDate: null,
  snapshotDate: null,
  knowledgeCutoff: null,
  contextWindow: null,
  maxOutputTokens: null,
  modality: null,

  pricing: [],
  benchmarks: [],
  infrastructure: {
    regions: null,
    avgLatencyMs: null,
    uptimePercent: null,
  },
  features: null,

  lifecycle: verified(
    {
      status: "retired",
      retirementDate: "2025-03-30",
      migrationTarget: "mistral-large-3",
    },
    mistralModelsOverview,
    {
      notes:
        "Mistral models overview Legacy/Deprecated table: deprecated 2024-11-30, retired 2025-03-30. Recommended migration target on the same page is the current Large-tier model (Mistral Large 3).",
    }
  ),

  citations: mergeCitations([mistralModelsOverview]),
};

export const models: ModelEntity[] = [
  claudeOpus4_7,
  claudeSonnet4_6,
  claudeHaiku4_5,
  gemini2_5Pro,
  deepseekV4Pro,
  mistralLarge3,
  claudeOpus4,
  deepseekR1Historical,
  mistralLarge2Historical,
  unverifiedModel({
    id: "model-gpt-5",
    slug: "gpt-5",
    name: "GPT-5",
    providerSlug: "openai",
    providerHomepage: "https://openai.com",
    description:
      "OpenAI GPT-5 catalogue entry. The OpenAI documentation site (platform.openai.com) returned HTTP 403 to automated retrieval on 2026-05-20; no metric is yet verified. A manual browser-based verification pass is queued — see VERIFICATION.md.",
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
];

export const featuredModels = models.slice(0, 6);

export function getModelBySlug(slug: string): ModelEntity | undefined {
  return models.find((m) => m.slug === slug);
}

export function getModelsByProvider(providerSlug: string): ModelEntity[] {
  return models.filter((m) => m.providerSlug === providerSlug);
}
