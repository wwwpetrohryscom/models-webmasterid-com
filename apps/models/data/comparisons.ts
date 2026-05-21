import type { ComparisonEntity } from "@/lib/types";

/**
 * Comparison entries describe two models side-by-side using verified
 * fields from each model's record. They do NOT declare a winner.
 * `declaresWinner: false` is a type-level reminder for reviewers — see
 * lib/types.ts.
 */
export const comparisons: ComparisonEntity[] = [
  {
    id: "comparison-claude-opus-4-7-vs-deepseek-v4-pro",
    slug: "claude-opus-4-7-vs-deepseek-v4-pro",
    name: "Claude Opus 4.7 vs DeepSeek V4 Pro",
    description:
      "Anthropic's current Claude Opus flagship vs DeepSeek's current generation reasoning model. Both sides are verified from each vendor's own documentation and pricing pages. This page does not declare a winner.",
    modelA: "claude-opus-4-7",
    modelB: "deepseek-v4-pro",
    sourceUrl: null,
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-20T00:00:00.000Z",
    updatedDate: "2026-05-20",
    useCases: [
      "Long-context reasoning (both advertise million-token-class context windows)",
      "Agentic coding workflows",
      "Cost-sensitive reasoning (DeepSeek v4-pro has a 75% promotional discount window — see model record)",
    ],
    limitations: [
      "DeepSeek v4-pro is currently running a time-limited 75% promotional discount (until 2026/05/31 15:59 UTC). The pricing rows on this page record the regular rate as the durable canonical value; the effective discounted rate is noted per row.",
      "DeepSeek and Anthropic publish pricing under different unit semantics; cache pricing rows compare cache-hit input pricing on both sides.",
      "WebmasterID Models does not declare a winner; readers should compare verified facts against their own workload.",
    ],
    declaresWinner: false,
  },
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
    name: "Gemini 2.5 Pro vs DeepSeek R1 (historical)",
    description:
      "Side-by-side reference for Google Gemini 2.5 Pro (verified from Google's official model and pricing pages) and the historical DeepSeek R1 line. R1 is no longer in DeepSeek's current API model parameter list — the current reasoning model is DeepSeek V4 Pro — so the DeepSeek row here renders unverified for most metrics. This page does not declare a winner.",
    modelA: "gemini-2-5-pro",
    modelB: "deepseek-r1",
    sourceUrl: null,
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    updatedDate: "2026-05-21",
    useCases: [
      "Multimodal understanding (Gemini 2.5 Pro accepts audio, image, video, and PDF inputs per Google AI docs)",
      "Historical / reference reading — DeepSeek R1 family is no longer in the current API model parameter list",
      "Cost-sensitive reasoning workloads (see the current Gemini 2.5 Pro vs DeepSeek V4 Pro pairing for a like-for-like view)",
    ],
    limitations: [
      "DeepSeek R1 is documented as historical only; the current DeepSeek reasoning model is `deepseek-v4-pro`. For a fully two-sided current pairing see /compare/claude-opus-4-7-vs-deepseek-v4-pro.",
      "Only the Gemini 2.5 Pro side has been verified against primary sources; the DeepSeek R1 row remains historical/structural.",
      "WebmasterID Models does not declare a winner; readers should compare verified facts against their own workload.",
    ],
    declaresWinner: false,
  },
  {
    id: "comparison-mistral-large-3-vs-claude-sonnet-4-6",
    slug: "mistral-large-3-vs-claude-sonnet-4-6",
    name: "Mistral Large 3 vs Claude Sonnet 4.6",
    description:
      "Side-by-side reference for Mistral's current Large-tier flagship (Mistral Large 3) and Anthropic's current Sonnet model (Claude Sonnet 4.6). The Claude side is fully verified from Anthropic's Models overview and Pricing reference; the Mistral side is partially verified — API string and lifecycle only, pending a manual browser pass against the per-model spec card and the JS-driven API pricing tab. This page does not declare a winner.",
    modelA: "mistral-large-3",
    modelB: "claude-sonnet-4-6",
    sourceUrl: null,
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    updatedDate: "2026-05-21",
    useCases: [
      "European-hosted serving (Mistral) versus US-hosted serving (Anthropic)",
      "Open-weights vs closed-weights flagship reasoning",
      "Agentic coding workflows",
    ],
    limitations: [
      "Mistral pricing, context window, and modality are not yet verified — Mistral's per-model spec card pages 404 to automated retrieval and the API pricing tab is JS-driven. Most Mistral fields render unverified here.",
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
