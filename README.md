# WebmasterID Models

**AI Model Infrastructure Intelligence** for the WebmasterID ecosystem.

A structured intelligence platform focused on AI models, providers, benchmarks,
API pricing, and inference infrastructure. Not an AI news site. Not an AI tools
directory. The output is data, not opinion.

- **Production:** [models.webmasterid.com](https://models.webmasterid.com)
- **Status:** Deployed on Vercel · `main` is the production branch
- **Deploy target:** Vercel (CNAME `models` → `cname.vercel-dns.com`) — see [DEPLOYMENT.md](DEPLOYMENT.md)

## Local development

```bash
npm install
npm run dev               # apps/models on http://localhost:3000
npm run lint
npm run typecheck
npm run check:integrity   # repository guard for the unverified-data label
npm run check:production  # preflight QA (routes, endpoints, config)
npm run build
npm run validate          # all five, in order
```

All scripts are workspace-aware and proxy into `apps/models`.
The two `check:*` scripts are zero-network preflight QA — they verify
that the routes, endpoints, and configuration the deployment depends on
actually exist in the source tree. See [VERIFICATION.md](VERIFICATION.md)
for the data-integrity policy and [DEPLOYMENT.md](DEPLOYMENT.md) for
deployment specifics.

## Architecture

Monorepo, npm workspaces.

```
apps/
  models/                   Next.js App Router app (SSR/SSG-first)
    app/                    Routes (server components by default)
    components/             Reusable UI primitives
    data/                   Seed entity data (models, providers, benchmarks…)
    lib/                    Site config, types, SEO helpers, utils
    public/                 Static assets
packages/                   Reserved for future shared packages
```

Stack: Next.js 15 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · ESLint.

Server components by default. Zero client components in the initial scaffold.

## Route map

| Path | Purpose |
| --- | --- |
| `/` | Homepage — hero, dashboards, explanatory section, JSON-LD |
| `/models` | Model catalogue |
| `/models/[slug]` | Per-model intelligence page (GPT-5, Claude Opus 4, Gemini 2.5 Pro, DeepSeek R1, Llama 4 Scout, Mistral Large 2) |
| `/providers` | Provider directory (OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, Groq, Together AI) |
| `/compare` | Comparison hub |
| `/compare/[slug]` | Side-by-side comparisons |
| `/benchmarks` | Benchmark suite catalogue |
| `/pricing` | API pricing table |
| `/infrastructure` | Regions and provider footprint |
| `/status` | Operational status placeholder (Not yet monitored) |
| `/news` | Verified change log (empty until verified entries exist) |
| `/research` | Long-form analysis hub |
| `/docs` | Documentation: entity model, verification, sources |

## SEO and crawler files

| Path | Generator |
| --- | --- |
| `/sitemap.xml` | [`apps/models/app/sitemap.ts`](apps/models/app/sitemap.ts) — filters via `shouldIndexRoute` so thin pages are excluded |
| `/robots.txt` | [`apps/models/app/robots.ts`](apps/models/app/robots.ts) — explicit allow-list of major search and AI crawlers |
| `/llms.txt` | [`apps/models/app/llms.txt/route.ts`](apps/models/app/llms.txt/route.ts) — canonical, allowed use, data integrity policy, indexable routes |
| `/rss.xml` | [`apps/models/app/rss.xml/route.ts`](apps/models/app/rss.xml/route.ts) |
| `/opengraph-image` | [`apps/models/app/opengraph-image.tsx`](apps/models/app/opengraph-image.tsx) — auto-generated 1200×630 PNG via Next's file convention |
| `/coverage` | [`apps/models/app/coverage/page.tsx`](apps/models/app/coverage/page.tsx) — verification heatmap by provider + structured retrieval-attempts audit log |
| `/sources` | [`apps/models/app/sources/page.tsx`](apps/models/app/sources/page.tsx) — deduplicated index of every primary-source citation referenced by a verified model field, grouped by provider |

JSON-LD helpers in [`lib/seo.ts`](apps/models/lib/seo.ts) ship `WebSite`,
`Organization`, `SoftwareApplication`, `Dataset`, and `BreadcrumbList`
schemas. Per-model `SoftwareApplication` JSON-LD only emits verified
fields (see [`lib/model-jsonld.ts`](apps/models/lib/model-jsonld.ts)).
Every page sets canonical URL, OpenGraph, and Twitter metadata via
`buildMetadata`.

## Operational endpoints

| Endpoint | Purpose |
| --- | --- |
| `/api/health` | Liveness check — version, environment, build timestamp. No secrets, no provider uptime claims. |
| `/api/site` | Public site metadata — name, routes, crawler endpoints, verification policy. |
| `/api/status/anthropic` | Single, freshly-issued vendor-reported `StatusObservation` for Anthropic. Always 200; on upstream failure the observation reports `observedStatus: "unknown"`. |
| `/api/cron/status` | Runs every enabled status observer AND writes each observation to the durable status store when one is configured. Bearer-token-guarded via `CRON_SECRET` in production; refuses to run unguarded if the secret is missing on a Vercel production deployment. |
| `/api/status/[provider]` | Runs every observer registered for the provider and returns the freshly-issued `StatusObservation`s. 404 when no observer is registered. Each observation self-labels its `source` (vendor / probe). |
| `/api/status/[provider]/latest` | Latest persisted observation for the provider, or a clear empty state when none exists. Always includes `storageConfigured` and `sampleCount`. |
| `/api/status/[provider]/window` | Windowed view of persisted observations (`?hours=24` by default, clamped to 1..720). Includes a `bySource` breakdown so vendor and probe signals are visible side by side. Returns `uptimePercentage` only when storage is configured AND `sampleCount >= MINIMUM_OBSERVATIONS_FOR_UPTIME` AND even then it is the share of stored observations whose status was `operational` — never an independent availability claim. |

## Server filters and entity graph

The hub pages — `/models`, `/pricing`, `/compare`, `/sources` — accept
GET query-string filters and render filtered results server-side. No
client-side search dependency. Supported parameters:

| Hub | Parameters |
| --- | --- |
| `/models` | `q`, `provider`, `verification`, `lifecycle`, `modality` |
| `/pricing` | `q`, `provider`, `status`, `unit` |
| `/compare` | `q`, `provider`, `verification`, `indexable` |
| `/sources` | `provider`, `sourceType` |

Indexing policy for filtered URLs:
- Unfiltered base URL: `index, follow` (canonical).
- Any filtered URL: `noindex, follow` via `robotsMetadata(!filtered)` in
  the page's `generateMetadata`. `isFilteredRoute(searchParams)` in
  [`lib/should-index.ts`](apps/models/lib/should-index.ts) decides.

Cross-entity navigation is centralised in
[`lib/entity-graph.ts`](apps/models/lib/entity-graph.ts) — pure,
deterministic, network-free helpers over the typed local data layer.
Helpers do not synthesise unverified claims; if a metric is unverified,
helpers expose `null` and the renderer decides whether to surface
`<DataNotVerified>`.

Breadcrumbs and `BreadcrumbList` JSON-LD are emitted on every detail
page (model, provider, comparison) and on the hub pages. The rendered
trail and the structured-data trail use the same source of truth
(`breadcrumbJsonLd()` in `lib/seo.ts`), so they cannot drift apart.

## Route contract and smoke tests

The set of routes the deployment is contractually required to serve
lives in [`lib/route-contract.ts`](apps/models/lib/route-contract.ts).
Every consumer of "what routes exist" — `/api/site`,
`/api/debug/deployment`, the smoke scripts, and the integrity guards —
imports from this module so the lists cannot drift.

| Constant | Used by |
| --- | --- |
| `REQUIRED_PAGE_ROUTES` | `/api/site`, `/api/debug/deployment`, smoke scripts |
| `REQUIRED_API_ROUTES` | `/api/debug/deployment`, smoke scripts |
| `STATUS_ENDPOINTS` | `/api/site`, `/api/debug/deployment` |
| `DEBUG_ENDPOINTS` | `/api/site`, `/api/debug/deployment` |
| `ROUTE_SET_VERSION` | `/api/site`, `/api/debug/deployment`, smoke staleness checks |
| `EXPECTED_DEPLOYED_COMMIT_PREFIX` | smoke scripts (informational) |

[`/api/debug/deployment`](apps/models/app/api/debug/deployment/route.ts)
is a read-only deployment-introspection endpoint. It returns safe
metadata (commit SHA, branch, repo owner/slug, environment, route
contract version, KV-configured boolean) and nothing else. It MUST
NEVER read `CRON_SECRET`, `KV_REST_API_TOKEN`, or `KV_REST_API_URL`;
the integrity guard "/api/debug/deployment never exposes secret env
values" enforces this.

Smoke tests:

```bash
# Production — base URL defaults to https://models.webmasterid.com.
npm run smoke:production
CRON_SECRET=… npm run smoke:production

# Local — boot the app first.
npm run build
npm run start          # in another shell
npm run smoke:local
```

Each script prints a compact `PATH | HTTP | CONTENT-TYPE | RESULT |
NOTE` table and exits non-zero on any failure. Failure modes the
scripts catch:
- API endpoint returns `text/html` → stale deployment.
- `/api/site` missing `statusEndpoints` / `routes` entries → stale
  deployment.
- `/api/debug/deployment` missing `build.routeSetVersion` or leaking a
  secret env name in the payload.
- `/api/cron/status` returning any HTTP status other than 200 / 401 /
  503.

When production is stale, see the **Vercel deployment recovery
checklist** in [DEPLOYMENT.md](DEPLOYMENT.md).

## Status observers

Observers live in [`apps/models/lib/observers/`](apps/models/lib/observers/)
and self-register in
[`lib/observers/index.ts`](apps/models/lib/observers/index.ts). Every
observer declares a typed `source` field so UI code can group vendor
and probe signals without inspecting prose.

| Observer | Provider | Source | Target |
| --- | --- | --- | --- |
| `anthropicStatusObserver` | Anthropic | `vendor_status_api` | `status.anthropic.com/api/v2/status.json` (Statuspage feed) |
| `anthropicIndependentProbe` | Anthropic | `independent_http_probe` | `https://api.anthropic.com/` (host-root reachability — NOT inference) |
| `googleStatusObserver` | Google | `vendor_status_api` | `status.cloud.google.com/incidents.json` filtered to Gemini / Vertex AI / AI Studio products |

The probe target for Anthropic is the API host root with no path; an
unauthenticated GET returns 404 (the host is up, no resource at `/`).
No API key is sent, no inference is triggered, no billing is invoked.
Probe wall-clock fetch time is recorded as `latencyMs` and is **never**
relabelled as API latency. A successful probe is a reachability
signal, not an availability measurement, and not "full API uptime".

Adding a new observer:

1. Implement a `StatusObserver` in `lib/observers/<slug>.ts` — for
   vendor feeds, follow the Anthropic example; for probes, call
   `createHttpProbeObserver()` from
   [`lib/observers/http-probe.ts`](apps/models/lib/observers/http-probe.ts)
   with a public, non-inference URL.
2. Set the `source` field explicitly.
3. Register it in `lib/observers/index.ts`.
4. Add a primary-source citation in `data/citations.ts`.
5. The integrity guards refuse to ship if the observer is missing
   `source`, or if a probe targets an inference / authenticated
   endpoint.

## Durable status storage

Observations from the status pipeline are optionally persisted via
[`lib/status-store.ts`](apps/models/lib/status-store.ts). The module
exposes a `StatusStore` interface and two adapters:

- `noopStatusStore` — used when neither `KV_REST_API_URL` nor
  `KV_REST_API_TOKEN` are set. Writes report `skipped_no_store`; reads
  return empty. Local development stays ergonomic without a database.
- KV adapter — used when both env vars are present. Talks to Vercel KV
  / Upstash Redis over the REST API (`POST <url>/` with a single
  command body). Stores observations as JSON in a per-provider list
  capped at 720 entries (~30 days hourly) plus a `:latest` pointer for
  fast reads. No extra runtime dependency.

`getStatusStore()` is the factory; it reads `process.env` once and
caches the chosen adapter. UI code uses
`isStatusStorageConfigured()` to render storage state without ever
touching the credentials themselves.

The cron route at `/api/cron/status` runs every observer and writes
each result via the store. Read endpoints are
`/api/status/anthropic/latest` (single-shot most-recent observation)
and `/api/status/anthropic/window?hours=N` (windowed view).

**Uptime gating policy.** No uptime-shaped number is exposed by the
window endpoint until:

1. Durable storage is configured.
2. The number of observations in the requested window is at least
   `MINIMUM_OBSERVATIONS_FOR_UPTIME` (currently 24 — i.e. ~24 hours of
   hourly observations).

Even when both gates pass, `uptimePercentage` is the share of stored
observations whose vendor-reported status was `operational`. The
field name matches the API spec, but the accompanying `policyNote`
makes the semantics explicit: this is a vendor-reported
operational-sample rate, NOT an independently-measured availability
percentage, NEVER an SLA claim. The `/status` page itself does not
display this number.

## Analytics

The site loads the WebmasterID first-party tracker on every page via
`next/script` from
[`apps/models/app/layout.tsx`](apps/models/app/layout.tsx). Configuration
lives in [`apps/models/lib/analytics.ts`](apps/models/lib/analytics.ts):

| Field | Value |
| --- | --- |
| Provider | WebmasterID |
| Script source | `https://webmasterid.com/tracker.iife.min.js` |
| Site ID (public) | `wm_64pnpqrfcgfwttwi` |
| Ingest endpoint | `https://webmasterid-ingest-api.vercel.app/api/events` |
| Strategy | `afterInteractive` (loaded after hydration) |
| DOM id | `webmasterid-tracker` |

The site ID is a **public** identifier — no secret is embedded in the
repository. The script tag integration was chosen over the
`@webmasterid/sdk-next` package to keep the runtime dependency surface
small.

`check:production` enforces:

- exactly one `<Script>` tag wires the tracker
- `siteId`, `endpoint`, and `scriptSrc` match the expected values
- `layout.tsx` imports `next/script` and references the analytics config

## Indexing policy

[`apps/models/lib/should-index.ts`](apps/models/lib/should-index.ts) is
the single source of truth. Hub pages, the catalogue, providers,
pricing, infrastructure, and docs index. Per-comparison pages index
only when at least one side is verified. Empty placeholders (`/news`,
`/research`, `/status`) carry `noindex, follow`. The sitemap, `llms.txt`,
and per-page `<meta name="robots">` all derive from this policy.

## Data integrity rules

These rules are non-negotiable. The full workflow lives in
[VERIFICATION.md](VERIFICATION.md); this is the executive summary.

1. **Every metric has a citation, or it does not exist.** Metric fields are
   typed `MaybeVerified<T> = VerifiedField<T> | null`. The `verified()`
   helper in [`lib/verified.ts`](apps/models/lib/verified.ts) throws at
   module-load time if the citation is incomplete — there is no escape
   hatch.
2. **Unverified values render as `"Data not yet verified."`** through the
   `<VerifiedField>` / `<DataNotVerified>` components. Never write the
   string by hand.
3. **Primary sources only.** Vendor documentation, vendor pricing pages,
   regulatory filings, peer-reviewed papers, public datasets. Blogs,
   social posts, leaderboard sites, and AI-generated summaries are not
   primary sources. See VERIFICATION.md for the full allow-list.
4. **JSON-LD reflects verified fields only.** `buildModelJsonLd()` uses
   the same `isVerified()` guard as the UI, so search engines and LLMs
   only ever see sourced claims.
5. **Comparisons never declare a winner.** The `ComparisonEntity` type
   carries `declaresWinner: false` as a type-level reminder, and every
   comparison page renders an explicit "No winner declared" note.
6. **Lifecycle is verified separately from data.** A model can be fully
   verified *and* deprecated — see Claude Opus 4 (`claude-opus-4-20250514`)
   as the worked example.
7. **No mass-generated pages.** Every indexable page has a clear user
   purpose and structured value.

Entity model: [`apps/models/lib/types.ts`](apps/models/lib/types.ts).
Citation registry: [`apps/models/data/citations.ts`](apps/models/data/citations.ts).
Verified-rendering helpers: [`apps/models/lib/verified.ts`](apps/models/lib/verified.ts).
Brand-asset policy: [`BRAND_ASSETS.md`](BRAND_ASSETS.md).

**Verified models:**

- Anthropic — Claude Opus 4.7, Claude Sonnet 4.6, Claude Haiku 4.5,
  Claude Opus 4 (deprecated; retires 2026-06-15). Verified from
  Anthropic's Models overview and Pricing reference.
- Google — Gemini 2.5 Pro. Verified from Google AI's per-model docs
  and Pricing reference; ≤200k vs >200k prompt-size pricing tiers and
  per-hour cache storage are first-class pricing rows.
- DeepSeek — DeepSeek V4 Pro. Verified from DeepSeek's API docs root,
  Models & Pricing page, and chat-completion API reference. A 75%
  promotional discount on v4-pro is active until 2026/05/31 15:59 UTC;
  the regular rate is recorded as the canonical durable value.

**Partially verified models:**

- Mistral — Mistral Large 3. API string and lifecycle verified; the
  per-model spec card page returned 404 on both 2026-05-20 and the
  Sprint 8B re-verification on 2026-05-21, so context window, max
  output, modality, and pricing remain unverified.

**Historical / retired entries (lifecycle only):**

- **DeepSeek R1-0528** (`deepseek-r1`) — anchored to DeepSeek's R1-0528
  release announcement. The R1 family is no longer in the current
  chat-completions `model` parameter set; recorded as retired with
  `deepseek-v4-pro` as the migration target.
- **Mistral Large 2** (`mistral-large-2`) — documented in Mistral's
  Legacy/Deprecated table as deprecated 2024-11-30 and retired
  2025-03-30. Recorded as retired with `mistral-large-3` as the
  migration target.

**Two-sided verified comparisons:**

- [Claude Opus 4.7 vs DeepSeek V4 Pro](https://models.webmasterid.com/compare/claude-opus-4-7-vs-deepseek-v4-pro)
- [Gemini 2.5 Pro vs Claude Opus 4.7](https://models.webmasterid.com/compare/gemini-2-5-pro-vs-claude-opus-4-7)

All other catalogue entries are unverified and render the canonical
unverified-data label for every metric. OpenAI verification is **queued
for a manual browser pass** because `platform.openai.com` returns
HTTP 403 to automated retrieval. The full workflow is documented in
[VERIFICATION.md → Manual vendor verification workflow](VERIFICATION.md).

## Components

`SiteHeader`, `SiteFooter`, `Hero`, `HeroNetworkMap`, `StatCard`,
`DashboardCard`, `ModelBadge`, `ProviderLogoBadge`, `VerificationBadge`,
`DataFreshness`, `PricingTable`, `BenchmarkTable`, `ComparisonTable`,
`SectionHeader`, `InternalLinkGrid`, `JsonLd`, `PageShell`.

## Deployment

Vercel. The repo is a monorepo with `apps/models` as the Next.js app.

DNS (handled separately):

```
Type:   CNAME
Name:   models
Target: cname.vercel-dns.com
```

No environment variables are required for the initial scaffold.
