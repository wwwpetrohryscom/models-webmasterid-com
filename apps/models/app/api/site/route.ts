/**
 * /api/site
 *
 * Public site metadata. This endpoint is the external contract for
 * partner integrations and smoke tests, so its shape is stable. The
 * route lists, status endpoints, debug endpoints, and route-set version
 * all flow from `lib/route-contract.ts` so the lists cannot drift apart
 * from `/api/debug/deployment` or from the smoke scripts.
 */

import { NextResponse } from "next/server";
import pkg from "../../../package.json";
import { siteConfig } from "@/lib/site-config";
import {
  DEBUG_ENDPOINTS,
  INTELLIGENCE_ENDPOINTS,
  REQUIRED_PAGE_ROUTES,
  ROUTE_SET_VERSION,
  STATUS_ENDPOINTS,
} from "@/lib/route-contract";
import { contentPages } from "@/lib/content";

export const dynamic = "force-static";

function readSafeEnv(name: string): string | null {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function GET() {
  const absolute = (path: string) => `${siteConfig.url}${path}`;
  return NextResponse.json(
    {
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      domain: siteConfig.domain,
      ecosystem: siteConfig.ecosystem,
      positioning: siteConfig.positioning,
      appVersion: pkg.version,
      routeSetVersion: ROUTE_SET_VERSION,
      // `deployedCommit` is taken from Vercel's automatic env var when
      // present. It's documented as public by Vercel (the same SHA is
      // visible on every preview URL).
      deployedCommit: readSafeEnv("VERCEL_GIT_COMMIT_SHA"),
      routes: [...REQUIRED_PAGE_ROUTES],
      sitemap: `${siteConfig.url}/sitemap.xml`,
      robots: `${siteConfig.url}/robots.txt`,
      llms: `${siteConfig.url}/llms.txt`,
      rss: `${siteConfig.url}/rss.xml`,
      health: absolute("/api/health"),
      statusEndpoints: STATUS_ENDPOINTS.map(absolute),
      debugEndpoints: DEBUG_ENDPOINTS.map(absolute),
      researchPages: contentPages
        .filter((p) => p.indexable && p.slug.startsWith("/research/"))
        .map((p) => absolute(p.slug)),
      docsPages: contentPages
        .filter((p) => p.indexable && p.slug.startsWith("/docs/"))
        .map((p) => absolute(p.slug)),
      updatedDate: siteConfig.buildDate,
      verificationPolicy:
        "Data not verified unless backed by primary source citation. Verified facts age; the reverification queue at /reverification (machine-readable at /api/reverification) lists sources due for manual re-check. The catalogue never auto-fetches or auto-mutates verified values.",
      reverificationQueue: absolute("/reverification"),
      reverificationApi: absolute("/api/reverification"),
      reverificationChecklistApi: absolute("/api/reverification/checklist"),
      intelligenceWorkspace: absolute("/intelligence"),
      intelligenceApi: absolute("/api/intelligence"),
      intelligenceEndpoints: INTELLIGENCE_ENDPOINTS.map(absolute),
      decisionBriefBuilder: absolute("/briefs/build"),
      decisionBriefApi: absolute("/api/briefs/decision"),
      labHub: absolute("/lab"),
      labTemplates: absolute("/lab/templates"),
      labTemplateEndpoints: [
        absolute("/api/lab/templates/model-evaluation-plan"),
        absolute("/api/lab/templates/prompt-test-matrix"),
        absolute("/api/lab/templates/automation-risk-checklist"),
      ],
      labPrompts: absolute("/lab/prompts"),
      labEvaluationGuide: absolute("/lab/evaluation"),
      labPromptEndpoints: [
        absolute("/api/lab/prompts/summarization-quality"),
        absolute("/api/lab/prompts/structured-extraction"),
        absolute("/api/lab/prompts/long-context-recall"),
        absolute("/api/lab/prompts/instruction-following"),
        absolute("/api/lab/prompts/refusal-boundary"),
        absolute("/api/lab/prompts/automation-robustness"),
      ],
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
