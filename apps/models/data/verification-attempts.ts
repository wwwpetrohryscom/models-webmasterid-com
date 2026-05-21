/**
 * Structured log of retrieval attempts against primary-source URLs.
 *
 * Records both successful manual reviews and persistent failures
 * (e.g. HTTP 403 from a docs site). Used by the /coverage page and by
 * check:production to keep the platform honest about what has actually
 * been verified vs. what is blocked.
 *
 * Every entry is a fact about an attempt, not a fact about a model. No
 * verified-field rendering uses this file — it is observability for
 * the verification workflow itself.
 */

export type AttemptResult =
  | "verified" // page was retrieved, content used to populate verified fields
  | "reviewable" // page was retrieved, content reviewed but no values used
  | "blocked-403"
  | "blocked-401"
  | "blocked-429"
  | "not-found-404"
  | "redirect-loop"
  | "requires-manual-browser";

export interface VerificationAttempt {
  /** Provider slug this attempt belongs to. */
  providerSlug: string;
  /** Absolute URL of the primary-source page that was targeted. */
  url: string;
  /** Short human-readable description of what was being verified. */
  target: string;
  /** ISO-8601 datetime of the attempt. */
  attemptedAt: string;
  /** Outcome category. */
  result: AttemptResult;
  /** Free-text notes recorded at the attempt. */
  notes?: string;
}

export const verificationAttempts: VerificationAttempt[] = [
  // ---------------------------------------------------------------------
  // Anthropic — manually reviewed via automated retrieval, used for the
  // Claude 4 / 4.5 / 4.6 / 4.7 verified rows.
  // ---------------------------------------------------------------------
  {
    providerSlug: "anthropic",
    url: "https://platform.claude.com/docs/en/docs/about-claude/models/overview",
    target: "Claude family model specifications",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Models overview page retrieved successfully. Used for API IDs, context window, max output, modality, knowledge cutoff, features, and lifecycle across Claude Opus 4, Opus 4.7, Sonnet 4.6, Haiku 4.5.",
  },
  {
    providerSlug: "anthropic",
    url: "https://platform.claude.com/docs/en/about-claude/pricing",
    target: "Claude pricing reference",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Pricing reference page retrieved successfully. Used for base, cache write (5m/1h), cache hit, and batch input/output rates across the Claude family.",
  },

  // ---------------------------------------------------------------------
  // Google — manually reviewed via automated retrieval, used for the
  // Gemini 2.5 Pro verified row.
  // ---------------------------------------------------------------------
  {
    providerSlug: "google",
    url: "https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro",
    target: "Gemini 2.5 Pro model specifications",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Per-model docs page retrieved successfully. Used for canonical model ID, context window (1,048,576), max output (65,536), modality (Audio/images/video/text/PDF in, Text out), knowledge cutoff, features.",
  },
  {
    providerSlug: "google",
    url: "https://ai.google.dev/pricing",
    target: "Gemini pricing reference",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Pricing page retrieved. ≤200k-token-tier values used as canonical pricing; >200k surcharge recorded in row notes.",
  },
  {
    providerSlug: "google",
    url: "https://ai.google.dev/gemini-api/docs/quickstart",
    target: "Gemini API request shape",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Quickstart page retrieved. REST endpoint shape and request body used for the API usage section.",
  },

  // ---------------------------------------------------------------------
  // OpenAI — persistent automated-retrieval block.
  // ---------------------------------------------------------------------
  {
    providerSlug: "openai",
    url: "https://platform.openai.com/docs/models/gpt-5",
    target: "GPT-5 model specifications",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "blocked-403",
    notes:
      "Automated retrieval returned HTTP 403 Forbidden. Browser-based manual review required to verify any field. No GPT-5 metrics published.",
  },
  {
    providerSlug: "openai",
    url: "https://platform.openai.com/docs/pricing",
    target: "OpenAI pricing reference",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "blocked-403",
    notes:
      "Automated retrieval returned HTTP 403 Forbidden. Manual browser review required. No OpenAI pricing rows added.",
  },
  {
    providerSlug: "openai",
    url: "https://platform.openai.com/docs/models",
    target: "OpenAI model catalogue",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "blocked-403",
    notes:
      "Automated retrieval returned HTTP 403 Forbidden.",
  },
  {
    providerSlug: "openai",
    url: "https://openai.com/api/pricing",
    target: "OpenAI marketing-side pricing",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "blocked-403",
    notes:
      "Automated retrieval returned HTTP 403 Forbidden. WebSearch surfaced URLs but its summary text is itself an AI-generated synthesis and is not an allowed primary source under the verification policy.",
  },

  // ---------------------------------------------------------------------
  // Anthropic brand resources — research for the Sprint 7 brand-asset
  // upgrade decision. Outcome: NOT upgraded.
  // ---------------------------------------------------------------------
  {
    providerSlug: "anthropic",
    url: "https://www.anthropic.com/brand",
    target: "Anthropic brand resource page",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "not-found-404",
    notes:
      "Page returned HTTP 404. Searched for the public brand resource URL — no canonical /brand path is currently published. The current brand policy (per general public knowledge of Anthropic's guidelines) is that commercial use of the wordmark requires explicit permission; identification/editorial use is generally permitted but not yet manually confirmed against an Anthropic-hosted page from this environment. Brand asset stays lettermark.",
  },

  // ---------------------------------------------------------------------
  // DeepSeek — Sprint 8 successful verification pass.
  // ---------------------------------------------------------------------
  {
    providerSlug: "deepseek",
    url: "https://api-docs.deepseek.com",
    target: "DeepSeek API docs root (active vs deprecated models)",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Docs root retrieved. Active model list: deepseek-v4-flash, deepseek-v4-pro. Deprecated: deepseek-chat and deepseek-reasoner, scheduled for deprecation 2026/07/24. deepseek-r1 / DeepSeek R1-0520 are not in the current model list.",
  },
  {
    providerSlug: "deepseek",
    url: "https://api-docs.deepseek.com/quick_start/pricing",
    target: "DeepSeek Models & Pricing",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Pricing page retrieved. Verified context window (1M), regular and discounted rates for input cache-miss / cache-hit / output for both v4-pro and v4-flash. 75% promotional discount active on v4-pro until 2026/05/31 15:59 UTC.",
  },
  {
    providerSlug: "deepseek",
    url: "https://api-docs.deepseek.com/api/create-chat-completion",
    target: "DeepSeek chat completion API reference",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "API reference retrieved. Verified API string `deepseek-v4-pro` as a valid model parameter value; documented minimal request body; API base implied as https://api.deepseek.com per beta-feature note.",
  },

  // ---------------------------------------------------------------------
  // Mistral — Sprint 8 partial verification pass.
  // ---------------------------------------------------------------------
  {
    providerSlug: "mistral",
    url: "https://docs.mistral.ai/getting-started/models/models_overview",
    target: "Mistral models overview",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Overview page retrieved. Mistral Large 3 listed as current, v25.12, Open weights, multimodal. Used to verify lifecycle status and version.",
  },
  {
    providerSlug: "mistral",
    url: "https://docs.mistral.ai/getting-started/models",
    target: "Mistral models table (API strings)",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "Models table retrieved. Verified API string `mistral-large-3` for Mistral Large 3 and the broader current model catalogue (mistral-medium-3-5, mistral-small-4, etc.).",
  },
  {
    providerSlug: "mistral",
    url: "https://docs.mistral.ai/api",
    target: "Mistral chat completions API reference",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "verified",
    notes:
      "API reference retrieved. Endpoint https://api.mistral.ai/v1/chat/completions, required headers, minimal request body, and the `mistral-large-latest` alias used in the example.",
  },
  {
    providerSlug: "mistral",
    url: "https://docs.mistral.ai/getting-started/models/mistral-large-3",
    target: "Mistral Large 3 per-model spec card",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "not-found-404",
    notes:
      "Per-model spec card page returned 404. Without it, context window, max output, and explicit modality specs cannot be verified — those fields stay null on the mistral-large-3 record.",
  },
  {
    providerSlug: "mistral",
    url: "https://mistral.ai/pricing",
    target: "Mistral API pricing",
    attemptedAt: "2026-05-20T00:00:00.000Z",
    result: "requires-manual-browser",
    notes:
      "Marketing-side page renders Le Chat plans rather than the per-model API pricing table; the API pricing tab is JS-driven. Pricing values for mistral-large-3 are deferred to a manual browser pass.",
  },

  // ---------------------------------------------------------------------
  // Sprint 8B — re-verification pass on 2026-05-21.
  //
  // The preferred targets in the sprint plan were DeepSeek R1-0520 and
  // Mistral Large 2. The current docs show:
  //   * DeepSeek: R1 family (including R1-0520 / R1-0528) is not in the
  //     current API model parameter list; the documented current
  //     reasoning model is deepseek-v4-pro. Verification therefore
  //     continues against deepseek-v4-pro (Sprint 8 fallback target).
  //   * Mistral: Mistral Large 2 is documented as deprecated 2024-11-30
  //     with retirement 2025-03-30 — i.e. it is already retired as of
  //     today (2026-05-21). The current Large-tier flagship is Mistral
  //     Large 3 (v25.12, listed in Frontier > Generalist). Verification
  //     therefore continues against mistral-large-3 (Sprint 8 fallback
  //     target).
  //
  // Per-model spec card pages on docs.mistral.ai still 404 to automated
  // retrieval, and the mistral.ai/pricing API pricing tab is still JS-
  // driven. Mistral verification remains partial.
  // ---------------------------------------------------------------------
  {
    providerSlug: "deepseek",
    url: "https://api-docs.deepseek.com/quick_start/pricing",
    target: "DeepSeek Models & Pricing (Sprint 8B re-verification)",
    attemptedAt: "2026-05-21T00:00:00.000Z",
    result: "verified",
    notes:
      "Pricing page re-retrieved on 2026-05-21. Model IDs, context window (1M), and pricing tiers for deepseek-v4-pro and deepseek-v4-flash unchanged from 2026-05-20. The 75% promotional discount on deepseek-v4-pro is still active until 2026/05/31 15:59 UTC.",
  },
  {
    providerSlug: "deepseek",
    url: "https://api-docs.deepseek.com/api/create-chat-completion",
    target: "DeepSeek chat completion API reference (Sprint 8B re-verification)",
    attemptedAt: "2026-05-21T00:00:00.000Z",
    result: "verified",
    notes:
      "API reference re-retrieved on 2026-05-21. Endpoint POST /chat/completions on https://api.deepseek.com confirmed. Model parameter `Possible values: [deepseek-v4-flash, deepseek-v4-pro]` confirmed.",
  },
  {
    providerSlug: "deepseek",
    url: "https://api-docs.deepseek.com/news/news250528",
    target: "DeepSeek R1-0528 release announcement (historical R1 anchor)",
    attemptedAt: "2026-05-21T00:00:00.000Z",
    result: "reviewable",
    notes:
      "Release note for DeepSeek-R1-0528 (May 28, 2025) retrieved. Used only to anchor the historical deepseek-r1 catalogue entry — R1-0528 / R1-0520 are not in the current API parameter set (which is [deepseek-v4-flash, deepseek-v4-pro]).",
  },
  {
    providerSlug: "mistral",
    url: "https://docs.mistral.ai/getting-started/models/models_overview",
    target: "Mistral Large 2 lifecycle confirmation (Sprint 8B)",
    attemptedAt: "2026-05-21T00:00:00.000Z",
    result: "verified",
    notes:
      "Overview page re-retrieved on 2026-05-21. Mistral Large 2 is documented in the Legacy/Deprecated table as deprecated 2024-11-30, retired 2025-03-30. The preferred Sprint 8B target is therefore already retired; verification continues against the documented current flagship, Mistral Large 3 (v25.12).",
  },
  {
    providerSlug: "mistral",
    url: "https://docs.mistral.ai/getting-started/models/mistral-large-3",
    target: "Mistral Large 3 per-model spec card (Sprint 8B retry)",
    attemptedAt: "2026-05-21T00:00:00.000Z",
    result: "not-found-404",
    notes:
      "Per-model spec card still returns HTTP 404 to automated retrieval. Context window, max output, and explicit modality remain unverified on the mistral-large-3 record.",
  },
  {
    providerSlug: "mistral",
    url: "https://mistral.ai/pricing",
    target: "Mistral API pricing (Sprint 8B retry)",
    attemptedAt: "2026-05-21T00:00:00.000Z",
    result: "requires-manual-browser",
    notes:
      "Marketing-side page still renders Le Chat plans; API pricing tab is JS-driven. Mistral pricing rows remain empty.",
  },

  // ---------------------------------------------------------------------
  // Sprint 16 — Mistral Large 3 spec card now accessible at a new URL.
  // ---------------------------------------------------------------------
  {
    providerSlug: "mistral",
    url: "https://docs.mistral.ai/models/model-cards/mistral-large-3-25-12",
    target: "Mistral Large 3 (v25.12) per-model spec card",
    attemptedAt: "2026-05-21T15:00:00.000Z",
    result: "verified",
    notes:
      "Mistral moved spec cards from /getting-started/models/<slug> to /models/model-cards/<slug>. The new URL is reachable and yields canonical pinned snapshot `mistral-large-2512`, context window 256k, input $0.5 / output $1.5 per 1M tokens. Max output and explicit modality channel list are still not stated on the page.",
  },
  {
    providerSlug: "openai",
    url: "https://platform.openai.com/docs/models/gpt-5",
    target: "OpenAI GPT-5 model docs (Sprint 16 retry)",
    attemptedAt: "2026-05-21T15:00:00.000Z",
    result: "blocked-403",
    notes:
      "platform.openai.com still returns HTTP 403 to automated retrieval. OpenAI verification remains blocked pending a manual browser pass.",
  },
];

export function attemptsByProvider(slug: string): VerificationAttempt[] {
  return verificationAttempts.filter((a) => a.providerSlug === slug);
}

export function isProviderRetrievalBlocked(slug: string): boolean {
  const a = attemptsByProvider(slug);
  if (!a.length) return false;
  return a.every((entry) => entry.result.startsWith("blocked-"));
}
