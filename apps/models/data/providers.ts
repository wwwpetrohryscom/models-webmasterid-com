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
      "Meta AI builds and releases the Llama family of open-weights foundation models. Meta does not run a first-party paid API for Llama; the models are downloaded under the Llama Community License and served by third-party hosting providers (Groq, Together, Bedrock, Vertex, etc.).",
    sourceUrl: "https://www.llama.com",
    website: "https://www.llama.com",
    docsUrl: "https://www.llama.com/docs/model-cards-and-prompt-formats/",
    modelCatalogueUrl: "https://www.llama.com",
    headquarters: "Menlo Park, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    updatedDate: "2026-05-21",
    notes:
      "Sprint 18 verification: Meta's Llama 4 model card at llama.com/docs/model-cards-and-prompt-formats/llama4 is publicly reachable and lists Scout (10M ctx) and Maverick (1M ctx) with input modalities, parameter counts, and knowledge cutoff. Because Meta does not host a paid API, per-model `pricing` rows are intentionally empty on the Llama 4 entries; max output and a stated release date are not on the model card and remain null.",
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
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    updatedDate: "2026-05-21",
    notes:
      "Models overview, models table, API reference, and the per-model spec card for Mistral Large 3 (v25.12) all retrievable. Sprint 16 verification pass landed the new spec-card URL pattern (/models/model-cards/<slug>), unlocking context window (256k) and pricing ($0.5/$1.5 per 1M input/output) on Mistral Large 3. Max output and explicit modality enumeration remain null because the spec card describes the model as 'multimodal' without listing channels.",
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
    apiDocsUrl: "https://api-docs.deepseek.com/api/create-chat-completion",
    pricingUrl: "https://api-docs.deepseek.com/quick_start/pricing",
    statusPageUrl: "https://status.deepseek.com",
    headquarters: "Hangzhou, China",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    updatedDate: "2026-05-21",
    notes:
      "API docs root, chat-completion API reference, and Models & Pricing page were all retrieved on 2026-05-20 and re-retrieved on 2026-05-21 (Sprint 8B) — no value changed. Used to verify deepseek-v4-pro end-to-end (API string, lifecycle, context window, input cache-miss / cache-hit / output rates). The R1-0528 release announcement anchors the historical deepseek-r1 entry.",
  },
  {
    id: "provider-groq",
    slug: "groq",
    name: "Groq",
    description:
      "Inference infrastructure provider. Hosts third-party open-weights models (Llama, GPT-OSS, Qwen, Whisper, etc.) on custom LPU hardware — Groq is a hosting platform, not a model creator.",
    sourceUrl: "https://groq.com",
    website: "https://groq.com",
    docsUrl: "https://console.groq.com/docs",
    apiDocsUrl: "https://console.groq.com/docs/api-reference",
    pricingUrl: "https://groq.com/pricing",
    modelCatalogueUrl: "https://console.groq.com/docs/models",
    statusPageUrl: "https://groqstatus.com",
    headquarters: "Mountain View, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    updatedDate: "2026-05-21",
    notes:
      "Sprint 18 verification: Groq's supported-models page at console.groq.com/docs/models is publicly reachable and lists hosted third-party models with context windows and per-million-tokens pricing. The catalogue intentionally does NOT carry per-model entries under provider=groq because those models (Llama 3.x, GPT-OSS variants, Qwen, etc.) are not Groq-created. Groq verification is for the provider/platform itself.",
  },
  {
    id: "provider-together",
    slug: "together-ai",
    name: "Together AI",
    description:
      "Open-source model inference platform. Hosts hundreds of third-party community model families (DeepSeek, Llama, Qwen, MiniMax, FLUX, etc.) — Together is a hosting platform, not a model creator.",
    sourceUrl: "https://together.ai",
    website: "https://together.ai",
    docsUrl: "https://docs.together.ai",
    apiDocsUrl: "https://docs.together.ai/reference",
    pricingUrl: "https://together.ai/pricing",
    modelCatalogueUrl: "https://docs.together.ai/docs/serverless-models",
    headquarters: "San Francisco, USA",
    verified: true,
    verificationStatus: "verified",
    lastCheckedAt: "2026-05-21T00:00:00.000Z",
    updatedDate: "2026-05-21",
    notes:
      "Sprint 18 verification: Together AI's serverless-models page at docs.together.ai/docs/serverless-models is publicly reachable and lists hosted third-party model families across chat, image, video, audio, and embedding categories. The catalogue intentionally does NOT carry per-model entries under provider=together-ai because those models are not Together-created. Together verification is for the provider/platform itself.",
  },
];

export function getProviderBySlug(slug: string): ProviderEntity | undefined {
  return providers.find((p) => p.slug === slug);
}
