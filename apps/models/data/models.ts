import type { ModelEntity } from "@/lib/types";

export const models: ModelEntity[] = [
  {
    id: "model-gpt-5",
    slug: "gpt-5",
    name: "GPT-5",
    description:
      "OpenAI's flagship frontier model. Metrics shown here are not yet independently verified by WebmasterID.",
    providerSlug: "openai",
    sourceUrl: "https://openai.com",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    releaseDate: null,
    contextWindow: null,
    modality: ["text", "image", "code"],
    pricing: [
      { unit: "1M input tokens", amountUsd: null },
      { unit: "1M output tokens", amountUsd: null },
    ],
    benchmarks: [],
    infrastructure: {
      regions: null,
      avgLatencyMs: null,
      uptimePercent: null,
    },
    citations: [
      { label: "Provider site (OpenAI)", href: "https://openai.com" },
    ],
  },
  {
    id: "model-claude-opus-4",
    slug: "claude-opus-4",
    name: "Claude Opus 4",
    description:
      "Anthropic's most capable Claude 4 generation model. Metrics not yet independently verified.",
    providerSlug: "anthropic",
    sourceUrl: "https://anthropic.com",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    releaseDate: null,
    contextWindow: null,
    modality: ["text", "image", "code"],
    pricing: [
      { unit: "1M input tokens", amountUsd: null },
      { unit: "1M output tokens", amountUsd: null },
    ],
    benchmarks: [],
    infrastructure: {
      regions: null,
      avgLatencyMs: null,
      uptimePercent: null,
    },
    citations: [
      { label: "Provider site (Anthropic)", href: "https://anthropic.com" },
    ],
  },
  {
    id: "model-gemini-2-5-pro",
    slug: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    description:
      "Google DeepMind's flagship multimodal model in the Gemini 2.5 family. Metrics not yet independently verified.",
    providerSlug: "google",
    sourceUrl: "https://deepmind.google",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    releaseDate: null,
    contextWindow: null,
    modality: ["text", "image", "audio", "video", "code"],
    pricing: [
      { unit: "1M input tokens", amountUsd: null },
      { unit: "1M output tokens", amountUsd: null },
    ],
    benchmarks: [],
    infrastructure: {
      regions: null,
      avgLatencyMs: null,
      uptimePercent: null,
    },
    citations: [
      { label: "Provider site (Google DeepMind)", href: "https://deepmind.google" },
    ],
  },
  {
    id: "model-deepseek-r1",
    slug: "deepseek-r1",
    name: "DeepSeek R1-0520",
    description:
      "DeepSeek's open-weights reasoning model. Metrics not yet independently verified by WebmasterID.",
    providerSlug: "deepseek",
    sourceUrl: "https://deepseek.com",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    releaseDate: null,
    contextWindow: null,
    modality: ["text", "code"],
    pricing: [
      { unit: "1M input tokens", amountUsd: null },
      { unit: "1M output tokens", amountUsd: null },
    ],
    benchmarks: [],
    infrastructure: {
      regions: null,
      avgLatencyMs: null,
      uptimePercent: null,
    },
    citations: [
      { label: "Provider site (DeepSeek)", href: "https://deepseek.com" },
    ],
  },
  {
    id: "model-llama-4-scout",
    slug: "llama-4-scout",
    name: "Llama 4 Scout",
    description:
      "Meta's mid-size Llama 4 open-weights model. Metrics not yet independently verified.",
    providerSlug: "meta",
    sourceUrl: "https://ai.meta.com",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    releaseDate: null,
    contextWindow: null,
    modality: ["text", "image"],
    pricing: [
      { unit: "1M input tokens", amountUsd: null },
      { unit: "1M output tokens", amountUsd: null },
    ],
    benchmarks: [],
    infrastructure: {
      regions: null,
      avgLatencyMs: null,
      uptimePercent: null,
    },
    citations: [
      { label: "Provider site (Meta AI)", href: "https://ai.meta.com" },
    ],
  },
  {
    id: "model-mistral-large-2",
    slug: "mistral-large-2",
    name: "Mistral Large 2",
    description:
      "Mistral's flagship commercial model. Metrics not yet independently verified.",
    providerSlug: "mistral",
    sourceUrl: "https://mistral.ai",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    releaseDate: null,
    contextWindow: null,
    modality: ["text", "code"],
    pricing: [
      { unit: "1M input tokens", amountUsd: null },
      { unit: "1M output tokens", amountUsd: null },
    ],
    benchmarks: [],
    infrastructure: {
      regions: null,
      avgLatencyMs: null,
      uptimePercent: null,
    },
    citations: [
      { label: "Provider site (Mistral)", href: "https://mistral.ai" },
    ],
  },
];

export const featuredModels = models.slice(0, 6);

export function getModelBySlug(slug: string): ModelEntity | undefined {
  return models.find((m) => m.slug === slug);
}

export function getModelsByProvider(providerSlug: string): ModelEntity[] {
  return models.filter((m) => m.providerSlug === providerSlug);
}
