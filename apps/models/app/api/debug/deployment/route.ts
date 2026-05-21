/**
 * /api/debug/deployment
 *
 * Read-only deployment introspection endpoint. Returns a JSON document
 * containing safe, non-secret metadata about the running build:
 *
 *   - package name + version
 *   - Vercel deployment metadata (commit SHA, branch, repo owner/slug,
 *     environment) — all of these are documented as public by Vercel
 *     and are present on every preview URL
 *   - the route contract (`routeSetVersion`, required pages, required
 *     API routes, status endpoints, debug endpoints)
 *   - whether KV storage credentials are configured (boolean only,
 *     never the values)
 *
 * What this endpoint NEVER returns:
 *   - `CRON_SECRET`
 *   - `KV_REST_API_TOKEN`
 *   - `KV_REST_API_URL` (full URL is treated as sensitive infrastructure
 *     — only `kvStorageConfigured: boolean` is exposed)
 *   - any other env-var value beyond the Vercel public set above
 *
 * External consumers (the production smoke test) read this payload to
 * detect a stale deployment in O(1) — comparing `build.routeSetVersion`
 * against the expected value gives a fast staleness signal without
 * having to crawl every page.
 */

import { NextResponse } from "next/server";
import pkg from "../../../../package.json";
import { siteConfig } from "@/lib/site-config";
import { isStatusStorageConfigured } from "@/lib/status-store";
import {
  DEBUG_ENDPOINTS,
  EXPECTED_DEPLOYED_COMMIT_PREFIX,
  REQUIRED_API_ROUTES,
  REQUIRED_PAGE_ROUTES,
  ROUTE_SET_VERSION,
  STATUS_ENDPOINTS,
} from "@/lib/route-contract";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readVercelEnv(name: string): string | null {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function GET() {
  return NextResponse.json(
    {
      service: siteConfig.name,
      domain: siteConfig.domain,
      url: siteConfig.url,
      packageName: pkg.name,
      packageVersion: pkg.version,
      deployment: {
        vercelEnv: readVercelEnv("VERCEL_ENV"),
        vercelGitCommitSha: readVercelEnv("VERCEL_GIT_COMMIT_SHA"),
        vercelGitCommitRef: readVercelEnv("VERCEL_GIT_COMMIT_REF"),
        vercelGitRepoOwner: readVercelEnv("VERCEL_GIT_REPO_OWNER"),
        vercelGitRepoSlug: readVercelEnv("VERCEL_GIT_REPO_SLUG"),
        nodeEnv: readVercelEnv("NODE_ENV"),
      },
      build: {
        expectedCurrentCommit: EXPECTED_DEPLOYED_COMMIT_PREFIX,
        routeSetVersion: ROUTE_SET_VERSION,
        buildDate: siteConfig.buildDate,
        generatedAt: new Date().toISOString(),
      },
      routes: {
        requiredApiRoutes: [...REQUIRED_API_ROUTES],
        requiredPages: [...REQUIRED_PAGE_ROUTES],
        statusEndpoints: [...STATUS_ENDPOINTS],
        debugEndpoints: [...DEBUG_ENDPOINTS],
      },
      storage: {
        kvConfigured: isStatusStorageConfigured(),
      },
      status: "ok",
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
