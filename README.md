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

## Entity polish components

Reusable server components for the model / provider / comparison
detail pages live under
[`apps/models/components/entity/`](apps/models/components/entity/):

| Component | What it renders |
| --- | --- |
| `EntityActionRail` | Verb-led action row (Compare models / View pricing / Inspect provider / Review sources / Check coverage / Read methodology). Integrity guards forbid salesy copy ("Get started", "Best model", "Official partner", etc.). |
| `EntityDataGaps` | Honest list of null/unverified fields, computed from the entity record. Renders nothing if there are no gaps. |
| `EntityMethodologyLinks` | Persistent rail linking to relevant research + docs pages. |
| `EntityVerificationChecklist` | Compact "X of Y fields verified" checklist driven by `isVerified()` on each field. No checkmark is hand-asserted. |

All three detail page types render `EntityActionRail` and
`EntityMethodologyLinks`; model + provider pages additionally render
`EntityDataGaps`; model pages render `EntityVerificationChecklist`.
Integrity guards check each of those presences and the absence of
banned CTA phrases.

## Content components

Reusable rich-content components live under
[`apps/models/components/content/`](apps/models/components/content/):

| Component | Used by |
| --- | --- |
| `MethodologyMatrix` | Research pages — cross-cutting comparison tables. |
| `PricingUnitTable` | `/research/api-pricing-methodology`, `/docs/pricing-fields`. |
| `StatusSignalTable` | `/research/ai-provider-status-monitoring`, `/docs/status-observations`. Reads the observer registry at render time. |
| `ProviderCoverageMatrix` | `/providers`, `/coverage`, `/docs/provider-coverage`. Live counts from `data/`. |
| `ContentStatCard` | Homepage "Current verified coverage" strip. |
| `FieldDefinitionTable` | `/docs/data-verification`, `/docs/status-observations`, `/docs/comparison-methodology`, `/docs/model-page-schema`. |

All are pure server components with semantic `<table>` markup, no client
JS, no charting library. Numbers in `ProviderCoverageMatrix` and
`ContentStatCard` come from the typed local data layer — none are
fabricated.

## Useful content

A research + reference layer lives under [`/research`](apps/models/app/research/)
and [`/docs`](apps/models/app/docs/). Every page is registered in
[`lib/content.ts`](apps/models/lib/content.ts) — the single source of
truth for the sitemap, llms.txt, `/api/site`'s `researchPages` /
`docsPages` arrays, and the integrity guards.

Editorial discipline:

- Source-aware. Every claim about a specific model / provider /
  pricing row cites the existing verified registry. Where a value is
  not yet verified, the page calls it out as a data gap rather than
  inventing one.
- No winner claims. The same `declaresWinner: false` discipline that
  applies to /compare applies to /research.
- No benchmark scores in page bodies. The benchmark-limitations guide
  exists specifically to explain why.
- No uptime percentages. The status guide names the threshold
  constant from `lib/status-store.ts` but does not publish a number.
- Every page renders breadcrumbs + Article/TechArticle JSON-LD via
  the shared [`<ContentPageShell>`](apps/models/components/ContentPageShell.tsx).

Adding a new content page is two edits: add an entry to
`contentPages` in `lib/content.ts`, and add a route file under
`/research/<slug>/page.tsx` or `/docs/<slug>/page.tsx` that imports
`ContentPageShell` and renders the body. The integrity guards
verify the slug appears in both places and that the page does not
contain any of the banned marketing phrases.

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

# Indexing QA — checks crawler-facing HTML markup + machine endpoints.
npm run qa:indexing
DOMAIN=http://localhost:3000 npm run qa:indexing
```

`qa:indexing` verifies that every indexable hub + detail page returns
200 HTML with a `<title>`, meta description, absolute canonical, no
unexpected `noindex`, and at least one JSON-LD block where one is
expected. It also samples filtered URLs (`?provider=`, `?verification=`,
…) to confirm `noindex` is enforced on those, and confirms the
sitemap / robots.txt / llms.txt reference the right paths. Exits
non-zero on any failure.

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
8. **Pricing is two-sided.** Every pricing record carries an explicit
   `pricingContext`. Model-creator first-party pricing
   (`model_creator_first_party_api`) lives on each `ModelEntity.pricing`
   array and is what `buildModelJsonLd()` reads. Hosted-provider
   pricing (`hosted_provider_api`) lives in
   [`data/hosted-pricing.ts`](apps/models/data/hosted-pricing.ts) and
   is rendered in a separate `/pricing` section so a hosting
   platform&apos;s rate can never be confused for the model
   creator&apos;s. Hosted rows must cite the billing provider&apos;s
   own pricing page; integrity guards refuse a Groq row that cites
   anything other than Groq&apos;s pricing page (and likewise for
   Together).
9. **Pricing is a reference, not a live quote (Sprint 20).** Every
   pricing record carries a `volatility` tag (high / medium / low /
   unknown) and a `lastCheckedAt` timestamp; the renderer pairs each
   row with a freshness chip (`fresh` ≤14d, `review_due` 15–30d,
   `stale` 31+d) computed deterministically against
   `siteConfig.buildDate`. Helpers live in
   [`lib/pricing-freshness.ts`](apps/models/lib/pricing-freshness.ts).
   Hosted-platform rates default to high volatility, first-party
   rates to medium — **no row ever defaults to low**. Surfaces never
   imply pricing is stable, and the canonical volatility note
   appears on every pricing surface.
10. **No price-ranking policy (Sprint 20).** Pricing surfaces render
    rows side-by-side as source-backed references, never as a
    comparison or ranking engine. The phrases "cheapest", "lower
    cost", "lowest price", "best value", "price winner", "save
    money", and "cheaper than" are banned in data + content sources
    (allowed only inside the doc section that explains the ban).
    Comparison pages do not declare a price winner and do not
    compute deltas. Hosted-availability information lives in
    [`lib/hosted-availability.ts`](apps/models/lib/hosted-availability.ts)
    as a *separate* surface from pricing — availability is stable;
    pricing is volatile.
11. **No auto-mutation; manual reverification queue (Sprint 21).**
    Verified facts age. A generalised
    [`lib/source-freshness.ts`](apps/models/lib/source-freshness.ts)
    computes a deterministic state (fresh / review_due / stale /
    blocked / unknown) against `siteConfig.buildDate` across
    citations, model records, providers, pricing, hosted pricing,
    and verification attempts. Records that age out feed a
    [`lib/reverification.ts`](apps/models/lib/reverification.ts) queue
    rendered at [`/reverification`](apps/models/app/reverification/page.tsx)
    and exposed as JSON at
    [`/api/reverification`](apps/models/app/api/reverification/route.ts).
    **The catalogue does not auto-fetch vendor sources, does not
    mutate verified values in the background, and does not publish
    unreviewed fetched data.** The queue is informational — every
    item points a human reviewer at a source URL with a suggested
    manual action. Stale ≠ false.
12. **Intelligence workspace + review operations (Sprint 22).** A
    unified operator surface at
    [`/intelligence`](apps/models/app/intelligence/page.tsx) renders
    the workspace destinations, current verified counts, the review
    operations panel, and a coverage health matrix. The
    machine-readable counterpart at
    [`/api/intelligence`](apps/models/app/api/intelligence/route.ts)
    exposes the same counts plus canonical destination URLs for
    partner dashboards. The reverification queue now supports
    server-rendered GET filters
    (`?priority`, `?reason`, `?provider`, `?entityType`,
    `?freshness`) and exports a Markdown / JSON checklist at
    [`/api/reverification/checklist`](apps/models/app/api/reverification/checklist/route.ts).
    Three new helpers —
    [`lib/intelligence-summary.ts`](apps/models/lib/intelligence-summary.ts),
    [`lib/comparison-clusters.ts`](apps/models/lib/comparison-clusters.ts),
    [`lib/source-usage.ts`](apps/models/lib/source-usage.ts) —
    derive discovery counters across the entity graph. `/models`
    and `/compare` now render discovery summaries linked to the
    intelligence workspace; `/models` accepts a `role` query param
    for creator-vs-hosted-platform filtering. Filtered URLs across
    `/reverification` and `/models?role=...` are `noindex, follow`.
    `ROUTE_SET_VERSION` bumped to `content-v5`.
18. **Learning platform repositioning + /learn hub + 6 lessons
    (Sprint 28).** The catalogue gains a learning layer that teaches
    practical AI model selection and connects every lesson to the
    verified-data workflows. A new
    [`/learn`](apps/models/app/learn/page.tsx) hub groups the
    lessons into five learning paths (model fundamentals, pricing +
    hosted, comparison methodology, governance + sources, testing
    workflow). Six initial lesson pages ship under `/learn/<slug>`:
    [how-to-choose-ai-model](apps/models/app/learn/how-to-choose-ai-model/page.tsx),
    [context-window](apps/models/app/learn/context-window/page.tsx),
    [hosted-vs-first-party](apps/models/app/learn/hosted-vs-first-party/page.tsx),
    [pricing-references](apps/models/app/learn/pricing-references/page.tsx),
    [model-lifecycle](apps/models/app/learn/model-lifecycle/page.tsx),
    [testing-ai-models](apps/models/app/learn/testing-ai-models/page.tsx).
    Lessons explain how to inspect verified catalogue fields and
    never tell the reader which model to pick. A new
    [`lib/lessons.ts`](apps/models/lib/lessons.ts) registry is the
    single source of truth for lesson metadata; five reusable server
    components in [`components/learn/`](apps/models/components/learn/)
    (`LessonLayout`, `LessonApplyPanel`, `ConceptChecklist`,
    `CommonMistakes`, `VerifiedExamplesTable`) keep the lesson
    surfaces consistent. `VerifiedExamplesTable` pulls real verified
    fields from the data layer — no fabricated values, no benchmark
    scores. The primary nav is repositioned around the
    learn → workflow → catalogue flow (Learn · Use Cases · Select ·
    Compare · Briefs · Models · Sources · Docs). The footer gains a
    dedicated Learn column listing every lesson. The homepage gains
    a "Learn first, then compare" section directly below the
    workflow strip; `/how-it-works`, `/select`, `/compare/build`,
    `/briefs/build`, `/use-cases`, `/demos`, and `/docs` all surface
    targeted learning links. `ROUTE_SET_VERSION` bumps to
    `content-v10`. Ten new integrity guards enforce: hub + lesson
    files exist, registry exports the expected helpers, lessons link
    to at least one workflow surface, no `best`/`recommended`/
    `winner`/`cheapest`/`fastest`/`guaranteed`/`certified`/
    `official partner` phrases appear on lesson surfaces, no
    benchmark literals appear in lessons, OpenAI numeric metrics
    stay out, and route-contract + sitemap + llms.txt + smoke +
    indexing all advertise the new routes.

17. **Visual proof + guided demos + example evidence brief (Sprint
    27).** Three predefined route plans live at
    [`/demos`](apps/models/app/demos/page.tsx) — long-context
    analysis, hosted inference, and governance review — each with a
    dedicated detail page at `/demos/[slug]`. A new
    [`/examples/decision-brief`](apps/models/app/examples/decision-brief/page.tsx)
    page renders a worked example using the same
    `buildDecisionBrief()` helper as the live builder so the
    example cannot drift from the real export. New visual proof
    components in
    [`apps/models/components/demo/`](apps/models/components/demo/)
    (`WorkflowPreviewPanel`, `DemoRouteCard`,
    `EvidencePreviewTable`, `DecisionBriefPreview`, `DemoStepStrip`)
    render every visual surface from local data — there are no
    fabricated screenshots and no benchmark literals. A new
    [`lib/guided-demos.ts`](apps/models/lib/guided-demos.ts) helper
    builds each demo's route plan + evidence-field list +
    per-demo policy note; demo `modelSlugs` are derived from the
    shortlist helper (long-context, governance) or from the
    hosted-pricing layer (hosted-inference) so the demos stay
    honest as the data layer grows. Homepage, `/how-it-works`,
    `/intelligence`, `/select`, `/compare/build`, `/briefs/build`,
    and the footer all deep-link into the demos / example brief.
    `ROUTE_SET_VERSION` bumps to `content-v9`. Nine new integrity
    guards enforce: helper is score-free, every demo surface bans
    recommendation language + screenshot references + benchmark
    literals, every Sprint-27 surface re-checks the OpenAI
    no-metrics rule.

16. **UX conversion polish + landing narrative (Sprint 26).** The
    Hero now leads with positioning + a primary "Start with a use
    case" CTA + a secondary "How it works" CTA. The homepage gained
    two new sections directly below the Hero: a "How to use this"
    workflow strip (shared
    [`<DecisionWorkflow>`](apps/models/components/DecisionWorkflow.tsx)
    component) and a "Who this is for / What this catalogue is not"
    two-card framing. A new
    [`/how-it-works`](apps/models/app/how-it-works/page.tsx) page
    walks the full five-step workflow (use case → shortlist →
    comparison → gaps + freshness → evidence brief) with
    step-by-step section headers and deep links into each
    workspace. The four workspace pages — `/select`,
    `/compare/build`, `/briefs/build`, `/intelligence` — gained
    tightened one-paragraph intros that name the step number
    ("Workspace · step 2 of 5") and reference `/how-it-works` so a
    cold visitor can always find the walkthrough. Seven new
    integrity guards enforce the strip + framing + walkthrough
    presence and re-check the no-recommendation policy on the new
    surfaces. No theme / CSS / dependency changes.

15. **Decision briefs + shareable evidence exports (Sprint 25).** A
    new [`/briefs/build`](apps/models/app/briefs/build/page.tsx)
    workspace renders a shareable evidence pack from 2–4 selected
    models — verified evidence rows, explicit data gaps, the source
    trail, freshness notes, hosted availability, and a checklist of
    external tests the reader still needs to run. Same filter shape
    as `/compare/build` (`?models`, `?useCase`, `?fields`).
    [`lib/decision-briefs.ts`](apps/models/lib/decision-briefs.ts)
    exposes `buildDecisionBrief`, `decisionBriefToMarkdown`,
    `decisionBriefToJson`, `getDecisionBriefDefaults`,
    `decisionBriefUrl` — an integrity guard refuses any
    `score|rank|winner|recommend` identifier and requires
    `siteConfig.buildDate` for the deterministic `generatedAt`. The
    [`/api/briefs/decision`](apps/models/app/api/briefs/decision/route.ts)
    endpoint returns the same payload as Markdown by default
    (`text/markdown; charset=utf-8`) or JSON via `?format=json`,
    always with `X-Robots-Tag: noindex`.
    [`/docs/decision-briefs`](apps/models/app/docs/decision-briefs/page.tsx)
    documents the evidence-vs-recommendation policy, the verified
    fields, the data-gaps surfacing, the source trail, and the
    export formats. `/select`, `/compare/build`, every use-case
    detail page, `/intelligence`, and `/docs/decision-workflow` now
    deep-link into the brief builder; `/api/site` advertises the
    builder + export URLs. `ROUTE_SET_VERSION` bumped to
    `content-v8`. Twelve new integrity guards enforce the
    no-recommendation policy and re-check the OpenAI
    no-metrics rule across every Sprint-25 surface.

14. **Comparison builder + decision workflow (Sprint 24).** A new
    [`/compare/build`](apps/models/app/compare/build/page.tsx)
    workspace renders 2–4 selected models side by side from verified
    fields with server-rendered GET filters
    (`?models`, `?useCase`, `?fields`, `?showGaps`). The unfiltered
    base page is indexable; every query URL is `noindex, follow`.
    [`lib/comparison-builder.ts`](apps/models/lib/comparison-builder.ts)
    exposes `buildModelComparison`, `getComparisonBuilderDefaults`,
    `comparisonBuilderUrl`, and a typed `ComparisonBuilderField`
    union — an integrity guard refuses any score / rank / winner /
    recommend identifier in the helper.
    [`components/DecisionWorkflow.tsx`](apps/models/components/DecisionWorkflow.tsx)
    renders a six-step strip ("start with a use case → build a
    shortlist → compare verified fields → inspect data gaps → review
    sources/freshness → decide what to test externally") and is
    embedded on `/select`, `/compare/build`, every use-case detail
    page, and the new
    [`/docs/decision-workflow`](apps/models/app/docs/decision-workflow/page.tsx)
    page (which explains the no-ranking policy in long form).
    `/select` rows now carry a "Compare in builder" deep link; the
    "Compare top shortlist" CTA seeds the builder from the current
    filter. `/compare` hub gained a "Build a custom comparison"
    section pointing at four pre-seeded use-case URLs.
    `ROUTE_SET_VERSION` bumped to `content-v7`. Ten new integrity
    guards enforce the no-recommendation policy on every Sprint-24
    surface.

13. **Model selection workspace + use-case intelligence (Sprint
    23).** The new
    [`/select`](apps/models/app/select/page.tsx) workspace builds a
    source-backed shortlist using server-rendered GET filters
    (`?useCase`, `?provider`, `?lifecycle`, `?minContext`,
    `?modality`, `?pricingCoverage`, `?hostedAvailability`,
    `?verification`, `?freshness`). Shortlist order is documented —
    verified field count → active lifecycle → source count → name —
    and is never described as a ranking.
    [`lib/use-cases.ts`](apps/models/lib/use-cases.ts) defines eight
    source-safe selection workflows (long-context, multimodal,
    structured output, hosted inference, cost review, governance
    review, status-aware selection, comparison research) — each
    naming the *verified fields a reader should weight*, never
    asserting a model is "best for" anything.
    [`lib/model-shortlists.ts`](apps/models/lib/model-shortlists.ts)
    derives shortlists from the typed local data layer with no
    scoring or ranking function. The [`/use-cases`](apps/models/app/use-cases/page.tsx)
    hub plus four detail pages
    ([long-context-analysis](apps/models/app/use-cases/long-context-analysis/page.tsx),
    [multimodal-input](apps/models/app/use-cases/multimodal-input/page.tsx),
    [hosted-inference](apps/models/app/use-cases/hosted-inference/page.tsx),
    [governance-review](apps/models/app/use-cases/governance-review/page.tsx))
    each carry the use-case caution, the verified-fields-used
    list, a use-case-filtered shortlist, and methodology links.
    The homepage gained a "Start with a use case" section;
    `/models` carries a selection-workspace CTA and quick-start
    use-case links; `/compare` gained a "Start from a use case"
    intro. `ROUTE_SET_VERSION` bumped to `content-v6`. Eleven new
    integrity guards ban recommendation language ("best model",
    "winner", "cheapest", "fastest", "guaranteed", "certified"),
    enforce the no-scoring rule on the shortlist helper, and
    re-check the OpenAI no-metrics policy on every new surface.

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
- Meta — Llama 4 Scout (10M-token context) and Llama 4 Maverick
  (1M-token context). Verified from Meta's official Llama 4 model
  card at `llama.com/docs/model-cards-and-prompt-formats/llama4`.
  Input modality `text + up to 5 images`, output modality `text`,
  knowledge cutoff August 2024. Pricing is intentionally empty —
  Meta does not run a first-party hosted API for Llama; integrity
  guard `no Meta pricing without an official Meta pricing citation`
  enforces this.
- Groq — provider/platform only. Hosts third-party model families
  (Llama, GPT-OSS, Qwen, Whisper); the catalogue does not carry
  per-model entries under `providerSlug: "groq"` because attributing
  a hosted model to its hosting platform would misrepresent its
  origin. Integrity guard `Groq + Together verification covers
  provider only` enforces this. **Sprint 19 added a hosted-pricing
  row for Llama 4 Scout on Groq** ($0.11 / 1M input, $0.34 / 1M
  output) sourced from `groq.com/pricing`; the row lives in
  `data/hosted-pricing.ts` with `pricingContext:
  "hosted_provider_api"`, model creator `meta`, billing provider
  `groq`. Llama 4 Maverick is not on Groq's pricing table; no row
  was added for it.
- Together AI — provider/platform only. Same hosted-vs-creator
  discipline as Groq. **Sprint 19 added a hosted-pricing row for
  DeepSeek V4 Pro on Together** ($2.10 / 1M input, $4.40 / 1M output,
  $0.20 / 1M cache-hit input) sourced from `www.together.ai/pricing`.
  Llama 4 Scout / Maverick appear only in Together's Fine-Tuning and
  dedicated-GPU sections, not serverless inference — those numbers
  are intentionally NOT recorded.
- Mistral — Mistral Large 3 (canonical snapshot `mistral-large-2512`).
  Verified from Mistral's models overview, models table, API reference,
  and the per-model spec card at
  `docs.mistral.ai/models/model-cards/mistral-large-3-25-12`. Context
  window 256k; pricing $0.5 input / $1.5 output per 1M tokens. Max
  output and explicit modality channel list remain null — the spec card
  describes the model as "multimodal" without enumerating channels.

**Partially verified models:**

_(All providers previously listed under this section have been promoted
to fully verified during Sprint 16. Mistral Large 3's spec card moved
to `/models/model-cards/<slug>` and is now reachable.)_

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
