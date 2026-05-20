import type { ComparisonEntity } from "@/lib/types";

export const comparisons: ComparisonEntity[] = [
  {
    id: "comparison-gpt-5-vs-claude-opus-4",
    slug: "gpt-5-vs-claude-opus-4",
    name: "GPT-5 vs Claude Opus 4",
    description:
      "Side-by-side comparison of OpenAI GPT-5 and Anthropic Claude Opus 4 across pricing, benchmarks, and use cases. Metric values are not yet independently verified.",
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
      "Public pricing and benchmark numbers not yet verified by WebmasterID.",
      "Provider-reported scores may not be reproducible.",
    ],
  },
  {
    id: "comparison-gemini-2-5-pro-vs-deepseek-r1",
    slug: "gemini-2-5-pro-vs-deepseek-r1",
    name: "Gemini 2.5 Pro vs DeepSeek R1-0520",
    description:
      "Compare Google Gemini 2.5 Pro and DeepSeek R1-0520 across multimodality, reasoning, and deployment options. Metric values are not yet independently verified.",
    modelA: "gemini-2-5-pro",
    modelB: "deepseek-r1",
    sourceUrl: null,
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    useCases: [
      "Multimodal understanding (image, audio, video)",
      "Open-weights self-hosting",
      "Cost-sensitive reasoning workloads",
    ],
    limitations: [
      "Public pricing and benchmark numbers not yet verified by WebmasterID.",
      "Deployment surfaces and regional availability change frequently.",
    ],
  },
];

export const topComparisons = comparisons;

export function getComparisonBySlug(
  slug: string
): ComparisonEntity | undefined {
  return comparisons.find((c) => c.slug === slug);
}
