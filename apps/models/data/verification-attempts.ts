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
];

export function attemptsByProvider(slug: string): VerificationAttempt[] {
  return verificationAttempts.filter((a) => a.providerSlug === slug);
}

export function isProviderRetrievalBlocked(slug: string): boolean {
  const a = attemptsByProvider(slug);
  if (!a.length) return false;
  return a.every((entry) => entry.result.startsWith("blocked-"));
}
