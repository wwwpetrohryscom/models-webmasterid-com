/**
 * Production route contract.
 *
 * Single source of truth for the routes every external consumer
 * (`/api/site`, `/api/debug/deployment`, the smoke scripts, the
 * integrity guards) needs to know about. Everything that talks about
 * "the production surface" imports from here so the lists cannot drift
 * apart.
 *
 * `ROUTE_SET_VERSION` is bumped whenever the API contract changes in a
 * way that external smoke tests should detect. Smoke scripts can read
 * `/api/debug/deployment` and compare the deployed version against the
 * expected one to detect a stale deployment in seconds.
 *
 * `EXPECTED_DEPLOYED_COMMIT_PREFIX` is the latest commit hash prefix the
 * smoke script considers "current". Bump it any time you ship a sprint
 * that adds new routes. The smoke script warns when the deployed
 * commit (from VERCEL_GIT_COMMIT_SHA) does not start with this prefix.
 */

export const ROUTE_SET_VERSION = "content-v14";

/**
 * Short prefix of the latest commit on `main` that this version of the
 * route contract was authored against. Smoke tests can compare against
 * `process.env.VERCEL_GIT_COMMIT_SHA` to flag stale deployments.
 */
export const EXPECTED_DEPLOYED_COMMIT_PREFIX = "1219d0b";

/** Indexable + noindex hub / detail pages a smoke test should reach. */
export const REQUIRED_PAGE_ROUTES = [
  "/",
  "/models",
  "/providers",
  "/compare",
  "/pricing",
  "/status",
  "/coverage",
  "/sources",
  "/research",
  "/docs",
  "/reverification",
  "/intelligence",
  "/select",
  "/use-cases",
  "/compare/build",
  "/briefs/build",
  "/how-it-works",
  "/demos",
  "/examples/decision-brief",
  "/learn",
  "/learn/exercises",
  "/learn/paths",
  "/learn/path/beginner",
  "/learn/path/developer",
  "/learn/path/product-manager",
  "/learn/path/governance",
  "/learn/path/automation-specialist",
  "/lab",
  "/lab/templates",
  "/lab/prompts",
  "/lab/evaluation",
] as const;
export type RequiredPageRoute = (typeof REQUIRED_PAGE_ROUTES)[number];

/** Every JSON / plain-text API route the deployment must serve. */
export const REQUIRED_API_ROUTES = [
  "/api/health",
  "/api/site",
  "/api/debug/deployment",
  "/api/cron/status",
  "/api/status/anthropic",
  "/api/status/google",
  "/api/status/anthropic/latest",
  "/api/status/google/latest",
  "/api/status/anthropic/window",
  "/api/status/google/window",
  "/api/reverification",
  "/api/reverification/checklist",
  "/api/intelligence",
  "/api/briefs/decision",
  "/api/lab/templates/model-evaluation-plan",
  "/api/lab/templates/prompt-test-matrix",
  "/api/lab/templates/automation-risk-checklist",
  "/api/lab/prompts/summarization-quality",
  "/api/lab/prompts/structured-extraction",
  "/api/lab/prompts/long-context-recall",
  "/api/lab/prompts/instruction-following",
  "/api/lab/prompts/refusal-boundary",
  "/api/lab/prompts/automation-robustness",
] as const;
export type RequiredApiRoute = (typeof REQUIRED_API_ROUTES)[number];

/**
 * Subset of API routes specifically related to the status pipeline.
 * Listed separately so `/api/site` can advertise them as a discoverable
 * group for partner integrations and smoke tests.
 */
export const STATUS_ENDPOINTS = [
  "/api/cron/status",
  "/api/status/anthropic",
  "/api/status/anthropic/latest",
  "/api/status/anthropic/window",
  "/api/status/google",
  "/api/status/google/latest",
  "/api/status/google/window",
] as const;
export type StatusEndpoint = (typeof STATUS_ENDPOINTS)[number];

/** Read-only inspection endpoints. Secrets-free by construction. */
export const DEBUG_ENDPOINTS = ["/api/debug/deployment"] as const;
export type DebugEndpoint = (typeof DEBUG_ENDPOINTS)[number];

/**
 * Operator / partner-facing JSON endpoints. Listed separately so
 * /api/site can advertise them as a discoverable group alongside
 * the status endpoints.
 */
export const INTELLIGENCE_ENDPOINTS = [
  "/api/intelligence",
  "/api/reverification",
  "/api/reverification/checklist",
  "/api/briefs/decision",
] as const;
export type IntelligenceEndpoint = (typeof INTELLIGENCE_ENDPOINTS)[number];
