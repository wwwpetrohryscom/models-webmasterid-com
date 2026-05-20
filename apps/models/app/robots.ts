import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

/**
 * Allow major search engine crawlers and major AI crawlers. The platform
 * is positioned as AI ecosystem intelligence, so being visible to LLM
 * surfaces (Claude, ChatGPT, Perplexity, etc.) is intentional.
 *
 * /api/ JSON endpoints are disallowed — they exist for monitoring and
 * are not useful to surface in search results.
 *
 * Pages that should not be indexed (news, research, status, thin
 * comparisons) opt out via per-page `robots` metadata in their route
 * files. This file controls only crawl-level access.
 */
export default function robots(): MetadataRoute.Robots {
  const aiAndSearchBots = [
    // Major search engines
    "Googlebot",
    "Bingbot",
    "DuckDuckBot",
    "Slurp",
    "Baiduspider",
    "YandexBot",
    "Applebot",
    // Google AI surfaces
    "Google-Extended",
    "GoogleOther",
    // OpenAI
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    // Anthropic
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "anthropic-ai",
    // Perplexity
    "PerplexityBot",
    "Perplexity-User",
    // Common Crawl
    "CCBot",
    // Meta
    "FacebookBot",
    "meta-externalagent",
    // Bytedance
    "Bytespider",
    // Mistral
    "MistralAI-User",
  ];

  return {
    rules: [
      ...aiAndSearchBots.map((userAgent) => ({
        userAgent,
        allow: ["/"],
        disallow: ["/api/"],
      })),
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
