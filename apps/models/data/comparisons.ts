import type { ComparisonEntity } from "@/lib/types";

/**
 * Comparison entries describe two models side-by-side using verified
 * fields from each model's record. They do NOT declare a winner.
 * `declaresWinner: false` is a type-level reminder for reviewers — see
 * lib/types.ts.
 */
export const comparisons: ComparisonEntity[] = [
  {
    id: "comparison-gpt-5-vs-claude-opus-4",
    slug: "gpt-5-vs-claude-opus-4",
    name: "GPT-5 vs Claude Opus 4",
    description:
      "Side-by-side reference for OpenAI GPT-5 and Anthropic Claude Opus 4. Only fields verified on each model's record are shown; everything else renders as 'Data not yet verified.' This page does not declare a winner.",
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
      "GPT-5 fields are not yet verified against an official OpenAI primary source, so most attributes render as 'Data not yet verified.'",
      "WebmasterID Models does not declare a winner; readers should compare verified facts against their own workload.",
    ],
    declaresWinner: false,
  },
  {
    id: "comparison-gemini-2-5-pro-vs-deepseek-r1",
    slug: "gemini-2-5-pro-vs-deepseek-r1",
    name: "Gemini 2.5 Pro vs DeepSeek R1-0520",
    description:
      "Side-by-side reference for Google Gemini 2.5 Pro and DeepSeek R1-0520. Only fields verified on each model's record are shown. This page does not declare a winner.",
    modelA: "gemini-2-5-pro",
    modelB: "deepseek-r1",
    sourceUrl: null,
    verified: false,
    verificationStatus: "unverified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    useCases: [
      "Multimodal understanding (image, audio, video)",
      "Open-weights self-hosting",
      "Cost-sensitive reasoning workloads",
    ],
    limitations: [
      "Neither model has been verified against a primary source on this platform yet — most attributes render as 'Data not yet verified.'",
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
