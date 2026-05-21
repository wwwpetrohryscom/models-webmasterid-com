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

/**
 * Anthropic vendor status page. Used by the Sprint 9 vendor-status
 * observer at `apps/models/lib/observers/anthropic.ts`. The status JSON
 * feed (Statuspage's `/api/v2/status.json`) is served from the same
 * host and redirects to status.claude.com. THIS IS A VENDOR-REPORTED
 * SOURCE — it is not an independent uptime probe.
 */
export const anthropicStatusPage: SourceCitation = citation({
  url: "https://status.anthropic.com",
  name: "Anthropic — Status page",
  type: "official-vendor-site",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Anthropic's public status page (Statuspage-style). The machine-readable feed at /api/v2/status.json (redirects to status.claude.com) is consumed by the vendor-status observer at lib/observers/anthropic.ts. Vendor-reported; not an independent uptime monitor.",
});

/**
 * Anthropic API host root, used as the target of the Sprint 12
 * independent HTTP probe at `apps/models/lib/observers/anthropic-probe.ts`.
 * The probe issues a single unauthenticated GET against the host root
 * (no path) and treats any 2xx/3xx/4xx as "host reachable". No
 * inference is performed, no API key is sent, no billing is triggered.
 */
export const anthropicApiHostProbeTarget: SourceCitation = citation({
  url: "https://api.anthropic.com/",
  name: "Anthropic — API host root (independent probe target)",
  type: "official-vendor-site",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Probe target only — the bare api.anthropic.com host responds 404 to unauthenticated GETs at /, which tells us the host is reachable without invoking any inference endpoint. Hourly probe via /api/cron/status.",
});

/**
 * Google Cloud public incidents feed. Used by the Sprint 12 Google
 * vendor-status observer at `apps/models/lib/observers/google.ts`. The
 * feed is a JSON array of incident records; the observer filters to
 * incidents touching Gemini / Vertex AI / AI Studio products. THIS IS
 * A VENDOR-REPORTED SOURCE — Google reports on themselves.
 */
export const googleCloudStatusIncidents: SourceCitation = citation({
  url: "https://status.cloud.google.com/incidents.json",
  name: "Google Cloud — Incidents feed",
  type: "official-vendor-site",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Google Cloud's public incidents feed (JSON array of incident records). The vendor-status observer filters to incidents whose affected_products mention Gemini / Vertex AI / AI Studio. Vendor-reported; not an independent uptime monitor.",
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

/**
 * DeepSeek R1-0528 announcement. Used only to anchor the historical
 * `deepseek-r1` catalogue entry to a primary-source release note — the
 * announcement documents the R1-0528 snapshot (the closest documented
 * sibling of the R1-0520 build the task originally targeted). The current
 * DeepSeek API parameter set is `[deepseek-v4-flash, deepseek-v4-pro]`;
 * the R1 family is not in the current API model list.
 */
export const deepseekR1_0528News: SourceCitation = citation({
  url: "https://api-docs.deepseek.com/news/news250528",
  name: "DeepSeek — R1-0528 release announcement",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Historical release note for DeepSeek-R1-0528 (May 28, 2025). Used to anchor the historical deepseek-r1 catalogue entry — R1 family is not in the current API model parameter set.",
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

// ---------------------------------------------------------------------------
// Meta Llama primary sources.
// ---------------------------------------------------------------------------

/**
 * Meta Llama 4 model card (Scout + Maverick). Hosted on Meta's
 * llama.com domain; lists context window, modality, knowledge cutoff,
 * and parameter counts. Meta does not host these models as a paid
 * first-party API, so the pricing fields stay null on the Llama
 * model records — no API pricing is asserted from this source.
 */
export const metaLlama4ModelCard: SourceCitation = citation({
  url: "https://www.llama.com/docs/model-cards-and-prompt-formats/llama4",
  name: "Meta — Llama 4 model card",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Meta Llama 4 model card (Scout + Maverick). Context windows (Scout 10M, Maverick 1M), input modalities (text + up to 5 images), output modality (text only), parameter counts (17B active), knowledge cutoff (August 2024). Max output tokens and a stated release date are NOT on the page. Meta does not run a hosted paid API for Llama; pricing stays null.",
});

// ---------------------------------------------------------------------------
// Groq primary sources.
// ---------------------------------------------------------------------------

/**
 * Groq supported-models documentation. Used for the provider entity;
 * the individual models listed there (Llama 3.x, GPT-OSS, Whisper,
 * Qwen, etc.) are third-party model families hosted on Groq's
 * platform — they are NOT Groq-created models and the catalogue
 * intentionally does not list them under provider=groq.
 */
export const groqSupportedModels: SourceCitation = citation({
  url: "https://console.groq.com/docs/models",
  name: "Groq — Supported models",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Groq supported-models reference. Lists Llama 3.x, GPT-OSS, Whisper, Qwen and other third-party models hosted on the Groq inference platform; Groq does not create these models. Used as provider verification only.",
});

// ---------------------------------------------------------------------------
// Together AI primary sources.
// ---------------------------------------------------------------------------

/**
 * Together AI serverless-models documentation. Like Groq, Together
 * is a hosting platform for third-party model families (DeepSeek,
 * Llama, Qwen, MiniMax, Black Forest Labs FLUX, etc.). The catalogue
 * does not list those as Together-created.
 */
export const togetherServerlessModels: SourceCitation = citation({
  url: "https://docs.together.ai/docs/serverless-models",
  name: "Together AI — Serverless models",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Together AI serverless-models reference. Lists hosted third-party model families; Together does not create these models. Used as provider verification only.",
});

/**
 * Mistral Large 3 per-model spec card. The URL pattern was previously
 * `/getting-started/models/<slug>` (which 404'd in Sprint 8B); Mistral
 * moved the spec cards to `/models/model-cards/<slug>`, where they are
 * now accessible. Used to verify canonical snapshot ID, context window,
 * and pricing for `mistral-large-2512`.
 */
export const mistralLarge3ModelCard: SourceCitation = citation({
  url: "https://docs.mistral.ai/models/model-cards/mistral-large-3-25-12",
  name: "Mistral — Large 3 (v25.12) model card",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-21T00:00:00.000Z",
  notes:
    "Mistral Large 3 spec card at the new URL pattern (/models/model-cards/<slug>). Canonical pinned snapshot is mistral-large-2512; context window 256k; input $0.5 / output $1.5 per 1M tokens. Max output and explicit modality list still not stated.",
});
