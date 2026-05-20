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

Both endpoints are excluded from `robots.txt` and intentionally not
indexed in search.

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
  and Pricing reference.

**First fully two-sided verified comparison:**
[Gemini 2.5 Pro vs Claude Opus 4.7](https://models.webmasterid.com/compare/gemini-2-5-pro-vs-claude-opus-4-7).

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
