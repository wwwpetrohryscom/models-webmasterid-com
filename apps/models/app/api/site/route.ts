import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";

const ROUTES = [
  "/",
  "/models",
  "/providers",
  "/compare",
  "/benchmarks",
  "/pricing",
  "/infrastructure",
  "/status",
  "/coverage",
  "/sources",
  "/news",
  "/research",
  "/docs",
];

/**
 * Status API surface, listed so partner integrations can discover every
 * status endpoint without scraping the codebase. Each entry is a stable
 * literal URL; the dynamic `/api/status/[provider]/*` route serves the
 * same payloads when the slug is recognised but is not enumerated here
 * because there is no canonical list of "all possible providers".
 */
const STATUS_ENDPOINTS = [
  "/api/cron/status",
  "/api/status/anthropic",
  "/api/status/anthropic/latest",
  "/api/status/anthropic/window",
  "/api/status/google",
  "/api/status/google/latest",
  "/api/status/google/window",
];

export function GET() {
  return NextResponse.json(
    {
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      domain: siteConfig.domain,
      ecosystem: siteConfig.ecosystem,
      positioning: siteConfig.positioning,
      routes: ROUTES,
      sitemap: `${siteConfig.url}/sitemap.xml`,
      robots: `${siteConfig.url}/robots.txt`,
      llms: `${siteConfig.url}/llms.txt`,
      rss: `${siteConfig.url}/rss.xml`,
      health: `${siteConfig.url}/api/health`,
      statusEndpoints: STATUS_ENDPOINTS.map((p) => `${siteConfig.url}${p}`),
      updatedDate: siteConfig.buildDate,
      verificationPolicy:
        "Data not verified unless backed by primary source citation.",
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
