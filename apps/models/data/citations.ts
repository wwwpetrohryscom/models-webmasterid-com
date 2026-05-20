import { citation } from "@/lib/verified";
import type { SourceCitation } from "@/lib/types";

/**
 * Centralised registry of primary-source citations used across the data
 * layer. Adding a citation here is the only sanctioned way to mark a
 * value as verified.
 *
 * Rules:
 *   1. Primary sources only (official vendor documentation, primary
 *      vendor sites, regulatory filings, public datasets).
 *   2. retrievedAt is an ISO-8601 datetime stamped during the manual
 *      review (see VERIFICATION.md).
 *   3. Once a citation is added, edits must be reviewed.
 */

export const anthropicModelsOverview: SourceCitation = citation({
  url: "https://platform.claude.com/docs/en/docs/about-claude/models/overview",
  name: "Anthropic — Models overview",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Anthropic's models overview page (legacy section), including the Claude Opus 4 row.",
});

export const anthropicPricing: SourceCitation = citation({
  url: "https://platform.claude.com/docs/en/about-claude/pricing",
  name: "Anthropic — Pricing",
  type: "official-vendor-pricing",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Anthropic's pricing reference (model pricing, prompt caching multipliers, batch API pricing).",
});

// ---------------------------------------------------------------------------
// Google AI primary sources.
//
// All three URLs were retrieved on 2026-05-20 against the public Google AI
// developer site. Pricing values use the standard ≤200k-token tier on the
// pricing page; the >200k-token tier is recorded in each tier's notes
// field rather than as a separate row.
// ---------------------------------------------------------------------------

export const googleGeminiModelDocs: SourceCitation = citation({
  url: "https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro",
  name: "Google AI — Gemini 2.5 Pro model docs",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Per-model specification page for gemini-2.5-pro (model code, token limits, supported input types, knowledge cutoff, supported features).",
});

export const googleGeminiPricing: SourceCitation = citation({
  url: "https://ai.google.dev/pricing",
  name: "Google AI — Gemini pricing",
  type: "official-vendor-pricing",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Gemini API pricing reference — standard, batch, flex, and priority tiers with ≤200k vs >200k-token pricing.",
});

export const googleGeminiQuickstart: SourceCitation = citation({
  url: "https://ai.google.dev/gemini-api/docs/quickstart",
  name: "Google AI — Gemini API quickstart",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Quickstart with REST endpoint shape, model parameter format, request body, and Python/JS SDK examples.",
});

// ---------------------------------------------------------------------------
// DeepSeek primary sources.
// ---------------------------------------------------------------------------

export const deepseekModelsAndPricing: SourceCitation = citation({
  url: "https://api-docs.deepseek.com/quick_start/pricing",
  name: "DeepSeek — Models & Pricing",
  type: "official-vendor-pricing",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "DeepSeek API Models & Pricing page — current model IDs (deepseek-v4-flash, deepseek-v4-pro), context window, input cache-miss / cache-hit / output rates, time-boxed discount window.",
});

export const deepseekApiReference: SourceCitation = citation({
  url: "https://api-docs.deepseek.com/api/create-chat-completion",
  name: "DeepSeek — Chat completion API reference",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "DeepSeek chat completion API reference — endpoint, model parameter values (deepseek-v4-flash, deepseek-v4-pro), minimal request body.",
});

export const deepseekDocsRoot: SourceCitation = citation({
  url: "https://api-docs.deepseek.com",
  name: "DeepSeek — API docs root",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "DeepSeek API docs root — active vs deprecated model status (deepseek-chat and deepseek-reasoner marked for deprecation 2026/07/24).",
});

// ---------------------------------------------------------------------------
// Mistral primary sources.
//
// Only the catalogue page and API reference were retrievable from this
// environment; per-model spec cards returned 404. Mistral verification
// is therefore partial — API string + lifecycle only.
// ---------------------------------------------------------------------------

export const mistralModelsOverview: SourceCitation = citation({
  url: "https://docs.mistral.ai/getting-started/models/models_overview",
  name: "Mistral — Models overview",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Mistral models overview — current active models, version stamps, open vs premier classification.",
});

export const mistralModelsTable: SourceCitation = citation({
  url: "https://docs.mistral.ai/getting-started/models",
  name: "Mistral — Models table (API strings)",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Mistral models table — exact API string for every current model (mistral-large-3, mistral-medium-3-5, etc.).",
});

export const mistralApiReference: SourceCitation = citation({
  url: "https://docs.mistral.ai/api",
  name: "Mistral — API reference",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Mistral chat completions endpoint, headers, minimal request body, and model parameter format.",
});
