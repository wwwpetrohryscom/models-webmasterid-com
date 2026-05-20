# WebmasterID Models

**AI Model Infrastructure Intelligence** for the WebmasterID ecosystem.

A structured intelligence platform focused on AI models, providers, benchmarks,
API pricing, and inference infrastructure. Not an AI news site. Not an AI tools
directory. The output is data, not opinion.

- **Domain:** [models.webmasterid.com](https://models.webmasterid.com)
- **Deploy target:** Vercel (CNAME `models` → `cname.vercel-dns.com`)

## Local development

```bash
npm install
npm run dev        # apps/models on http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

All scripts are workspace-aware and proxy into `apps/models`.

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

## SEO files

| Path | Generator |
| --- | --- |
| `/sitemap.xml` | `apps/models/app/sitemap.ts` (static + per-model + per-comparison) |
| `/robots.txt` | `apps/models/app/robots.ts` |
| `/llms.txt` | `apps/models/app/llms.txt/route.ts` |
| `/rss.xml` | `apps/models/app/rss.xml/route.ts` |

JSON-LD helpers in `lib/seo.ts` ship `WebSite`, `Organization`,
`SoftwareApplication`, `Dataset`, and `BreadcrumbList` schemas. Every page
sets canonical URL, OpenGraph, and Twitter metadata via `buildMetadata`.

## Data integrity rules

These rules are non-negotiable:

1. **Never invent metrics.** Pricing, benchmark scores, latency, uptime, and
   release dates are `null` until verified against an official primary source.
2. **Unknown values render as `"Data not yet verified."`** — never as an
   estimate, average, or extrapolation.
3. **Every entity carries verification metadata:** `sourceUrl`, `sourceName`,
   `sourceType`, `verified`, `verificationStatus`, `confidenceLevel`,
   `lastCheckedAt`, `updatedDate`, `notes`.
4. **Verification states** surface in the UI via `<VerificationBadge>`:
   `verified` · `partial` · `unverified` · `deprecated`.
5. **Prefer primary sources.** Vendor documentation, regulatory filings,
   public datasets. Random blogs and social posts are not primary sources.
6. **No mass-generated pages.** Every indexable page has a clear user purpose
   and structured value.

See `apps/models/lib/types.ts` for the canonical entity model.

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
