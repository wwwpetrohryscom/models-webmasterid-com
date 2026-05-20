import type { ComparisonEntity } from "@/lib/types";

/**
 * Comparison entries describe two models side-by-side using verified
 * fields from each model's record. They do NOT declare a winner.
 * `declaresWinner: false` is a type-level reminder for reviewers — see
 * lib/types.ts.
 */
export const comparisons: ComparisonEntity[] = [
  {
    id: "comparison-gemini-2-5-pro-vs-claude-opus-4-7",
    slug: "gemini-2-5-pro-vs-claude-opus-4-7",
    name: "Gemini 2.5 Pro vs Claude Opus 4.7",
    description:
      "First fully two-sided verified comparison on WebmasterID Models: Google Gemini 2.5 Pro (verified from Google AI's per-model docs and pricing reference) and Anthropic Claude Opus 4.7 (verified from Anthropic's Models overview and Pricing reference). This page does not declare a winner.",
    modelA: "gemini-2-5-pro",
    modelB: "claude-opus-4-7",
    sourceUrl: null,
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-20T00:00:00.000Z",
    updatedDate: "2026-05-20",
    useCases: [
      "Long-context document analysis (both models advertise million-token-class context)",
      "Multimodal understanding (Gemini 2.5 Pro accepts audio, image, video, and PDF inputs; Claude Opus 4.7 accepts text and image inputs per its model overview)",
      "Agentic coding workflows",
    ],
    limitations: [
      "Cache pricing semantics differ between the two providers (Google: per-hour cache storage; Anthropic: per-token TTL caching). Direct cache cost comparisons are not meaningful in this table.",
      "Google publishes a two-tier prompt-size price (≤200k vs >200k tokens); the pricing rows below reflect the standard ≤200k tier.",
      "WebmasterID Models does not declare a winner; readers should compare verified facts against their own workload.",
    ],
    declaresWinner: false,
  },
  {
    id: "comparison-gpt-5-vs-claude-opus-4",
    slug: "gpt-5-vs-claude-opus-4",
    name: "GPT-5 vs Claude Opus 4",
    description:
      "Side-by-side reference for OpenAI GPT-5 and Anthropic Claude Opus 4. Only fields verified on each model's record are shown; everything else is marked unverified. This page does not declare a winner.",
    modelA: "gpt-5",
    modelB: "claude-opus-4",
    sourceUrl: null,
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    useCases: [
      "Long-context document analysis",
      "Agentic coding workflows",
      "Reasoning and structured output",
    ],
    limitations: [
      "Claude Opus 4 (claude-opus-4-20250514) is deprecated and retires 2026-06-15. New workloads should evaluate the active Claude Opus generation listed on Anthropic's models overview.",
      "GPT-5 fields are not yet verified against an official OpenAI primary source, so most attributes are marked unverified.",
      "WebmasterID Models does not declare a winner; readers should compare verified facts against their own workload.",
    ],
    declaresWinner: false,
  },
  {
    id: "comparison-gemini-2-5-pro-vs-deepseek-r1",
    slug: "gemini-2-5-pro-vs-deepseek-r1",
    name: "Gemini 2.5 Pro vs DeepSeek R1-0520",
    description:
      "Side-by-side reference for Google Gemini 2.5 Pro and DeepSeek R1-0520. The Gemini side is verified from Google's official model and pricing pages; the DeepSeek side is not yet verified and renders unverified for every metric. This page does not declare a winner.",
    modelA: "gemini-2-5-pro",
    modelB: "deepseek-r1",
    sourceUrl: null,
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: "2026-05-20T00:00:00.000Z",
    updatedDate: "2026-05-20",
    useCases: [
      "Multimodal understanding (Gemini 2.5 Pro accepts audio, image, video, and PDF inputs per Google AI docs)",
      "Open-weights self-hosting (DeepSeek R1 ships open weights)",
      "Cost-sensitive reasoning workloads",
    ],
    limitations: [
      "Only the Gemini 2.5 Pro side has been verified against primary sources; the DeepSeek R1 row remains structural until a primary-source pass.",
      "WebmasterID Models does not declare a winner; readers should compare verified facts against their own workload.",
    ],
    declaresWinner: false,
  },
];

export const topComparisons = comparisons;

export function getComparisonBySlug(
  slug: string
): ComparisonEntity | undefined {
  return comparisons.find((c) => c.slug === slug);
}
