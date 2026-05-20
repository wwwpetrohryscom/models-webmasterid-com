import type { ProviderEntity } from "@/lib/types";

export const providers: ProviderEntity[] = [
  {
    id: "provider-openai",
    slug: "openai",
    name: "OpenAI",
    description:
      "Frontier AI lab and API provider for the GPT family of models.",
    sourceUrl: "https://openai.com",
    website: "https://openai.com",
    headquarters: "San Francisco, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-anthropic",
    slug: "anthropic",
    name: "Anthropic",
    description:
      "AI safety research lab and API provider for the Claude family of models.",
    sourceUrl: "https://anthropic.com",
    website: "https://anthropic.com",
    headquarters: "San Francisco, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-google",
    slug: "google",
    name: "Google",
    description:
      "Google DeepMind builds the Gemini family of multimodal foundation models served via Google AI.",
    sourceUrl: "https://deepmind.google",
    website: "https://deepmind.google",
    headquarters: "Mountain View, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-meta",
    slug: "meta",
    name: "Meta",
    description:
      "Meta AI builds and releases the Llama family of open-weights foundation models.",
    sourceUrl: "https://ai.meta.com",
    website: "https://ai.meta.com",
    headquarters: "Menlo Park, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-mistral",
    slug: "mistral",
    name: "Mistral",
    description:
      "European AI lab building Mistral and Mixtral open and commercial language models.",
    sourceUrl: "https://mistral.ai",
    website: "https://mistral.ai",
    headquarters: "Paris, France",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-deepseek",
    slug: "deepseek",
    name: "DeepSeek",
    description:
      "DeepSeek develops open and commercial reasoning-focused language models.",
    sourceUrl: "https://deepseek.com",
    website: "https://deepseek.com",
    headquarters: "Hangzhou, China",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-groq",
    slug: "groq",
    name: "Groq",
    description:
      "Inference infrastructure provider running open-weights models on custom LPU hardware.",
    sourceUrl: "https://groq.com",
    website: "https://groq.com",
    headquarters: "Mountain View, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-together",
    slug: "together-ai",
    name: "Together AI",
    description:
      "Open-source model inference platform supporting hundreds of community models.",
    sourceUrl: "https://together.ai",
    website: "https://together.ai",
    headquarters: "San Francisco, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
  },
];

export function getProviderBySlug(slug: string): ProviderEntity | undefined {
  return providers.find((p) => p.slug === slug);
}
