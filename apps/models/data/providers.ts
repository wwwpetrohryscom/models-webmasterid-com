import type { ProviderEntity } from "@/lib/types";

/**
 * Provider entity catalogue. All URLs below point at provider primary
 * sites or official documentation roots. URLs are kept conservative —
 * an unstable deep link is left null rather than asserted.
 *
 * Anthropic URLs have been actively traversed during model verification
 * (see data/citations.ts) and are recorded with "verified" status.
 * Other providers are listed as "partial" — homepage is reachable but
 * none of their model/pricing metrics has been verified by this
 * platform yet.
 */
export const providers: ProviderEntity[] = [
  {
    id: "provider-anthropic",
    slug: "anthropic",
    name: "Anthropic",
    description:
      "AI safety research lab; trains and serves the Claude family of models.",
    sourceUrl: "https://anthropic.com",
    website: "https://anthropic.com",
    docsUrl: "https://platform.claude.com/docs",
    apiDocsUrl: "https://platform.claude.com/docs/en/api",
    pricingUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    modelCatalogueUrl:
      "https://platform.claude.com/docs/en/docs/about-claude/models/overview",
    statusPageUrl: "https://status.anthropic.com",
    deprecationsUrl:
      "https://platform.claude.com/docs/en/about-claude/model-deprecations",
    headquarters: "San Francisco, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-20T00:00:00.000Z",
    updatedDate: "2026-05-20",
  },
  {
    id: "provider-openai",
    slug: "openai",
    name: "OpenAI",
    description:
      "Frontier AI lab; trains and serves the GPT family of models.",
    sourceUrl: "https://openai.com",
    website: "https://openai.com",
    docsUrl: "https://platform.openai.com/docs",
    apiDocsUrl: "https://platform.openai.com/docs/api-reference",
    pricingUrl: "https://platform.openai.com/docs/pricing",
    modelCatalogueUrl: "https://platform.openai.com/docs/models",
    statusPageUrl: "https://status.openai.com",
    deprecationsUrl: "https://platform.openai.com/docs/deprecations",
    headquarters: "San Francisco, USA",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    notes:
      "URLs are the public documentation entry points. As of 2026-05-20 the platform.openai.com docs site returned HTTP 403 to automated retrieval; primary-source verification requires a manual browser review. No GPT-5 metrics have been published on this platform until that review completes.",
  },
  {
    id: "provider-google",
    slug: "google",
    name: "Google",
    description:
      "Google DeepMind builds the Gemini family of multimodal foundation models served via Google AI.",
    sourceUrl: "https://deepmind.google",
    website: "https://deepmind.google",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    apiDocsUrl: "https://ai.google.dev/api",
    pricingUrl: "https://ai.google.dev/pricing",
    modelCatalogueUrl: "https://ai.google.dev/gemini-api/docs/models",
    statusPageUrl: "https://status.cloud.google.com",
    headquarters: "Mountain View, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-20T00:00:00.000Z",
    updatedDate: "2026-05-20",
    notes:
      "Per-model documentation, pricing reference, and API quickstart actively traversed on 2026-05-20 (see Gemini 2.5 Pro model record citations).",
  },
  {
    id: "provider-meta",
    slug: "meta",
    name: "Meta",
    description:
      "Meta AI builds and releases the Llama family of open-weights foundation models.",
    sourceUrl: "https://ai.meta.com",
    website: "https://ai.meta.com",
    docsUrl: "https://llama.com",
    modelCatalogueUrl: "https://llama.com/models",
    headquarters: "Menlo Park, USA",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    notes:
      "URLs are the public documentation entry points. Llama models are open-weights; pricing/serving terms vary by host.",
  },
  {
    id: "provider-mistral",
    slug: "mistral",
    name: "Mistral",
    description:
      "European AI lab building Mistral and Mixtral open and commercial language models.",
    sourceUrl: "https://mistral.ai",
    website: "https://mistral.ai",
    docsUrl: "https://docs.mistral.ai",
    apiDocsUrl: "https://docs.mistral.ai/api",
    pricingUrl: "https://mistral.ai/pricing",
    modelCatalogueUrl: "https://docs.mistral.ai/getting-started/models/models_overview",
    headquarters: "Paris, France",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    notes:
      "URLs are the public documentation entry points. Their content has not yet been retrieved as primary-source citations by this platform.",
  },
  {
    id: "provider-deepseek",
    slug: "deepseek",
    name: "DeepSeek",
    description:
      "DeepSeek develops open and commercial reasoning-focused language models.",
    sourceUrl: "https://deepseek.com",
    website: "https://deepseek.com",
    docsUrl: "https://api-docs.deepseek.com",
    apiDocsUrl: "https://api-docs.deepseek.com",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    statusPageUrl: "https://status.deepseek.com",
    headquarters: "Hangzhou, China",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    notes:
      "URLs are the public documentation entry points. Their content has not yet been retrieved as primary-source citations by this platform.",
  },
  {
    id: "provider-groq",
    slug: "groq",
    name: "Groq",
    description:
      "Inference infrastructure provider serving open-weights models on custom LPU hardware.",
    sourceUrl: "https://groq.com",
    website: "https://groq.com",
    docsUrl: "https://console.groq.com/docs",
    apiDocsUrl: "https://console.groq.com/docs/api-reference",
    pricingUrl: "https://groq.com/pricing",
    statusPageUrl: "https://groqstatus.com",
    headquarters: "Mountain View, USA",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    notes:
      "URLs are the public documentation entry points. Their content has not yet been retrieved as primary-source citations by this platform.",
  },
  {
    id: "provider-together",
    slug: "together-ai",
    name: "Together AI",
    description:
      "Open-source model inference platform supporting hundreds of community models.",
    sourceUrl: "https://together.ai",
    website: "https://together.ai",
    docsUrl: "https://docs.together.ai",
    apiDocsUrl: "https://docs.together.ai/reference",
    pricingUrl: "https://together.ai/pricing",
    modelCatalogueUrl: "https://docs.together.ai/docs/inference-models",
    headquarters: "San Francisco, USA",
    verified: false,
    verificationStatus: "partial",
    lastCheckedAt: null,
    updatedDate: "2026-05-20",
    notes:
      "URLs are the public documentation entry points. Their content has not yet been retrieved as primary-source citations by this platform.",
  },
];

export function getProviderBySlug(slug: string): ProviderEntity | undefined {
  return providers.find((p) => p.slug === slug);
}
