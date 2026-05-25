# Verification workflow

How a value gets from "we think we know this" to "rendered on the site."

This is the single source of truth for data integrity. It overrides
convenience, polish, SEO scale, or any pressure to populate more rows.

---

## Repository guard

The canonical unverified-data label (the literal string exported as
`UNVERIFIED_LABEL` from `apps/models/lib/verified.ts`) may only appear in:

- `apps/models/components/DataNotVerified.tsx` (the renderer)
- `apps/models/lib/verified.ts` (the constant declaration)
- `README.md`
- `VERIFICATION.md`
- Tests whose filename matches `DataNotVerified.{test,spec}.{ts,tsx}` or
  `data-not-verified.{test,spec}.{ts,tsx}`

Any other file — route pages, seed data, arbitrary components, llms.txt
copy — must render the label through the `<DataNotVerified>` component
or interpolate the `UNVERIFIED_LABEL` constant. Inline duplication is
forbidden because it bypasses the rendering policy and drifts over time.

The guard is enforced by:

```bash
npm run check:integrity
```

It is wired into `npm run validate` alongside lint, typecheck, and build,
so any unauthorized occurrence fails the local validation flow. The
script lives at [`scripts/check-data-not-verified-usage.ts`](scripts/check-data-not-verified-usage.ts).

---

## The core rule

**Every metric on this site has a citation, or it does not exist.**

A "metric" is anything a reader could act on or be misled by:
pricing, context window, max output, modality, release/snapshot dates,
knowledge cutoff, lifecycle (active/deprecated/retired), benchmark scores,
latency, uptime, regions, features.

The type system enforces this: metric fields are typed
`MaybeVerified<T> = VerifiedField<T> | null`. `VerifiedField<T>` requires
a `SourceCitation` at construction time. There is no escape hatch.

Unverified values render through `<VerifiedField>` and `<DataNotVerified>`,
which output the literal string `Data not yet verified.` Never write that
string by hand — use the components.

---

## What counts as a primary source

Allowed (`sourceType`):

| `sourceType` | Definition |
| --- | --- |
| `official-vendor-docs` | The vendor's own product documentation under a `docs.*` or equivalent path. |
| `official-vendor-pricing` | The vendor's official pricing reference page. |
| `official-vendor-site` | The vendor's primary marketing/product site, used only when the docs site is unavailable or does not cover the field. |
| `regulatory-filing` | SEC/EU/etc. filing by the vendor. |
| `research-paper` | Peer-reviewed or arXiv-published paper by the vendor. |
| `public-dataset` | Verified third-party benchmark dataset releases (HF/HELM/Papers-with-Code style). |

Not allowed as primary sources for metric claims:

- Blog posts (even vendor blog posts — they're announcements, not specs).
- Twitter / X posts.
- Reddit, Hacker News, Discord.
- LinkedIn posts or press releases.
- Secondary summary sites, model directories, "leaderboard" sites.
- Wikipedia.
- AI-generated content.

If the only available reference is a blog post or announcement, the value
**stays null** until a docs/pricing page reflects it.

---

## Manual verification checklist

Use this when adding or refreshing a verified value. Every box must be
checkable before merging.

### Before editing

- [ ] The source page is on an allow-listed primary domain.
- [ ] The source page is accessible without authentication.
- [ ] The source page has not been changed since you last looked (open it now).

### When adding a citation

Add the citation to `apps/models/data/citations.ts` if it doesn't already
exist. Citations are registered once and referenced by import — never
inlined in entity files. Required fields:

- [ ] `url` is an absolute https URL.
- [ ] `name` is human-readable and uniquely identifies the source.
- [ ] `type` is one of the allow-listed `SourceType` values.
- [ ] `retrievedAt` is set to the ISO-8601 datetime of the manual review.
- [ ] `notes` (recommended) records what exactly was sourced from the page,
  so the next reviewer can re-verify quickly.

### When wrapping a value

Use the `verified()` helper. It will throw at module-load time if any of
the contract is violated.

```ts
contextWindow: verified(200_000, anthropicModelsOverview, {
  notes: "Listed as '200k tokens' on the Models overview page (legacy section).",
});
```

- [ ] The value matches the source verbatim or is a direct conversion
  (e.g. `200k` → `200_000`, no extrapolation).
- [ ] `confidence` is set to `"high"` only when the value is stated
  explicitly for *this exact model snapshot* on the source page. Down-grade
  to `"medium"` or `"low"` when the source covers a family broadly and the
  field is inferred. Record the reasoning in `notes`.
- [ ] If the source page says something subtly different (different
  precision, different unit, different snapshot), prefer `null` over a
  forced fit.

### Specifically forbidden moves

- ❌ Copying a value from another model's row because they're "in the same family."
- ❌ Averaging or rounding.
- ❌ Using a launch-day blog post as a source for current pricing.
- ❌ Inferring a release date from a blog post when only the snapshot date is in the docs.
- ❌ Asserting "vision support" because Anthropic generally supports it — confirm for the specific snapshot.
- ❌ Republishing vendor-reported benchmark scores without an independent reference.

### After editing

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes (this is where field-level `verified()`
  contracts get evaluated; malformed citations fail the build).
- [ ] Open the affected model / comparison page locally and confirm the
  citation links resolve and the `src` chip points at the correct URL.

---

## Lifecycle: deprecated and retired models

A deprecated model is still kept in the catalogue. It is **not deleted** —
historical entries are part of the intelligence graph. Mark it via:

```ts
lifecycle: verified(
  { status: "deprecated", retirementDate: "YYYY-MM-DD", migrationTarget: "<slug>" },
  citation,
  { notes: "..." }
)
```

The `<LifecycleBadge>` will surface "Deprecated · retires YYYY-MM-DD" and
JSON-LD will emit a `disambiguatingDescription` warning.

When a snapshot is fully retired, escalate `lifecycle.status` to `"retired"`
and add a clear migration breadcrumb to the description. Do not silently
remove the entity.

---

## Comparison pages

Comparison entities **never declare a winner**. The type
`ComparisonEntity` carries `declaresWinner: false` as a type-level
reminder. Every comparison page renders an explicit "No winner declared"
note above the table.

When writing the `useCases` list, describe workloads each model is *used
for* (neutral, observed). Avoid "best for", "outperforms",
"recommended for". Use cases are not endorsements.

---

## JSON-LD policy

`buildModelJsonLd` (in `apps/models/lib/model-jsonld.ts`) only emits
schema.org claims for verified fields. Search engines and LLMs treat
JSON-LD as factual. Adding a metric to the page is not enough — it must
also be guarded in the JSON-LD builder. The builder uses the same
`isVerified()` guard as the rest of the UI.

---

## Re-verification cadence

| Field | Re-check cadence |
| --- | --- |
| Pricing | Every 30 days, and immediately on any vendor pricing update. |
| Lifecycle (deprecation, retirement) | Every 30 days, plus on every Anthropic / OpenAI / Google deprecation notice. |
| Context window, max output, modality | Every 90 days; these change less frequently. |
| Benchmark scores | Only when a new primary-source benchmark publication lands. |
| Latency / uptime | Continuously, once an independent monitor is wired. Until then, leave null. |

The `lastCheckedAt` field on each entity records the last full sweep.
A field whose `retrievedAt` (on its citation) is older than its cadence
should be re-verified or downgraded to `null`.

---

## Status of the seed catalogue (2026-05-21)

> Sprint 8B re-verification pass — DeepSeek &amp; Mistral were re-checked
> on 2026-05-21. DeepSeek's pricing page, API reference, and the R1-0528
> release note were retrieved successfully; no value changed since
> 2026-05-20. Mistral's models overview and table were retrieved
> successfully; Mistral Large 2 is in the Legacy/Deprecated table
> (deprecated 2024-11-30, retired 2025-03-30), so the Sprint 8B preferred
> target is already retired and verification continues against Mistral
> Large 3. Per-model spec card pages on docs.mistral.ai still 404 to
> automated retrieval; the mistral.ai/pricing API tab is still JS-driven.
> Pricing-unit vocabulary was extended with a `"unknown"` placeholder so
> rows whose unit semantics have not yet been verified can be recorded
> without distorting any provider's pricing model; rows with verified
> amounts are not allowed to carry `"unknown"` (enforced by
> `check:production`).

Verified Anthropic models (against Anthropic's Models overview and
Pricing reference):

- **Claude Opus 4.7** (`claude-opus-4-7`) — current Anthropic flagship.
- **Claude Sonnet 4.6** (`claude-sonnet-4-6`) — current Sonnet tier.
- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — current Haiku tier.
- **Claude Opus 4** (`claude-opus-4-20250514`) — gold-standard worked
  example. **Deprecated**, retires 2026-06-15. Retained for historical
  record and to anchor the verification workflow.

Verified Google models (against Google AI's per-model docs and Pricing
reference):

- **Gemini 2.5 Pro** (`gemini-2.5-pro`) — flagship Gemini 2.5 model.
  Pricing now uses dedicated `PricingUnit` variants for the ≤200k vs
  >200k prompt-size tiers and a separate `"1M cache storage / hour"`
  row (added in Sprint 8) so all four published prompt-size rates and
  the per-hour cache storage fee are surfaced as first-class rows
  instead of being hidden in notes.

Verified DeepSeek models (against DeepSeek's API docs root, Models &
Pricing page, and chat-completion API reference):

- **Llama 4 Scout** + **Llama 4 Maverick** (Meta) — Sprint 18
  expansion. Verified from Meta's official Llama 4 model card at
  `llama.com/docs/model-cards-and-prompt-formats/llama4`. Scout:
  10,000,000-token context, 17B active / 109B total MoE. Maverick:
  1,000,000-token context, 17B active / 400B total MoE. Both:
  modality `text + up to 5 images → text`, knowledge cutoff August
  2024. Pricing is intentionally empty — Meta does not run a
  first-party hosted API for Llama; the integrity guard suite blocks
  any attempt to add a verified Meta pricing row without an explicit
  Meta pricing citation. Max output tokens and a stated public-release
  date are not on the model card and remain null.

Hosted-platform providers (Sprint 18):

- **Groq** (`groq`) — provider verified from
  `console.groq.com/docs/models`. Hosts third-party model families
  (Llama 3.x, GPT-OSS, Qwen, Whisper, etc.) on custom LPU hardware.
  No per-model entries attributed to `providerSlug: "groq"` — those
  would misrepresent model origin. Same discipline applies to any
  inference-platform provider added later.
- **Together AI** (`together-ai`) — provider verified from
  `docs.together.ai/docs/serverless-models`. Same hosted-vs-creator
  separation.

Both platforms publish pricing for the hosted models. **Sprint 19
landed the hosted-pricing schema this referred to.** A new typed
`PricingRecord` shape in `lib/types.ts` carries a `pricingContext`
discriminator (`model_creator_first_party_api` vs `hosted_provider_api`
vs `cloud_marketplace` vs `unknown`) plus separate
`modelCreatorProviderSlug` and `billingProviderSlug` fields. Hosted
rows live in `data/hosted-pricing.ts` and never sit on the model
record's own `pricing` array, so model-creator JSON-LD `Offer` blocks
cannot leak hosted rates.

Sprint 19 verified hosted rows from primary sources:

- **Groq → Llama 4 Scout** — `groq.com/pricing` retrieved 2026-05-23.
  Listed at $0.11 / 1M input and $0.34 / 1M output under "Llama 4
  Scout (17Bx16E) 128k". `hostedModelId:
  "meta-llama/llama-4-scout-17b-16e-instruct"`. Model creator is Meta;
  billing provider is Groq. **Llama 4 Maverick is NOT on Groq's
  pricing page** — no row added for it on Groq.
- **Together AI → DeepSeek V4 Pro** —
  `www.together.ai/pricing` retrieved 2026-05-23. Listed at $2.10 / 1M
  input, $4.40 / 1M output, with a separately listed $0.20 / 1M
  cache-hit input rate. Model creator is DeepSeek; billing provider
  is Together AI. **Llama 4 Scout and Llama 4 Maverick appear ONLY in
  Together's Fine-Tuning table (LoRA / Full Fine-Tuning columns) and
  the dedicated-GPU section, not the serverless inference table** —
  those numbers are intentionally NOT recorded as inference pricing.
  Together's `docs/serverless-models` reference contained zero
  references to Llama 4 on 2026-05-23 (re-fetched).

Hosted rows do not back-fill Meta's first-party pricing — Meta still
runs no paid first-party Llama API, and the Sprint 18 integrity guard
that requires a `metaLlama*Pricing` citation before any verified
Llama pricing row is allowed has been re-checked under Sprint 19.

**Sprint 20 — pricing safety refactor.** Pricing was reframed as a
source-backed *reference* surface rather than a comparison engine. No
new hosted rows were added; the existing rows now carry an explicit
`volatility` tag (high for hosted, medium for first-party) and an
optional `reviewCadenceDays`. A new
[`lib/pricing-freshness.ts`](apps/models/lib/pricing-freshness.ts)
computes a freshness state (`fresh` ≤14d, `review_due` 15–30d,
`stale` 31+d, `unknown`) deterministically against
`siteConfig.buildDate`, and every pricing-rendering surface now pairs
the rate with a freshness chip and a volatility tag.

A separate [hosted availability
catalogue](apps/models/lib/hosted-availability.ts) was introduced so
the *stable* identity claim (host × model × hosted model ID) can be
recorded and rendered independently from the *volatile* rate. Provider
pages render availability above the pricing table; the Meta provider
page now explicitly surfaces a "Creator pricing unavailable" banner
when no first-party pricing exists, rather than letting absence read
as silence.

Sprint 20 also banned price-ranking language across data + content
sources ("cheapest", "lower cost", "lowest price", "best value",
"price winner", "save money", "cheaper than"), allowed only in the
dedicated `/research/api-pricing-methodology#no-price-ranking`
section that explains the ban. Comparison pages render hosted
pricing as references, never as a ranking. No new indexable route
was added — the spec's optional `/hosted-models` route was rejected
as thin with only two availability records.

**Sprint 21 — source freshness workflow + reverification queue.**
Sprint 21 generalises Sprint 20's pricing-freshness layer into a
source-wide model that covers citations, model records, providers,
pricing, hosted pricing, status observers, and verification
attempts. A new
[`lib/source-freshness.ts`](apps/models/lib/source-freshness.ts)
exposes `FreshnessState` (`fresh` / `review_due` / `stale` /
`blocked` / `unknown`), `SOURCE_FRESHNESS_DAYS` thresholds
(standard 30/60/90, pricing 14/30/45, blocked-retry 30),
`getFreshnessState`, `freshnessPriority`, and the canonical
`REVERIFICATION_POLICY_NOTE`. State is computed deterministically
against `siteConfig.buildDate` — no wall-clock reads.

A new [`lib/reverification.ts`](apps/models/lib/reverification.ts)
builds a typed `ReverificationQueueItem[]` from the data layer with
explicit `affectedRoutes` and `suggestedAction` on every item.
Sources walked:
- first-party pricing rows past the pricing freshness window
- hosted-pricing rows past the same window
- citations past the standard freshness window
- blocked verification attempts (until a newer verified attempt
  supersedes them — OpenAI 403s persist through the queue)
- providers with verificationStatus = "partial"
- verified providers with a public status page but no observer
- verified model records carrying ≥3 null canonical metrics

The queue is surfaced at [`/reverification`](apps/models/app/reverification/page.tsx)
(indexable, sitemap + llms.txt + footer linked) and exposed as
machine-readable JSON at
[`/api/reverification`](apps/models/app/api/reverification/route.ts).
/coverage now renders a freshness summary card grid linked to the
queue; /sources pairs every citation with a freshness chip and links
to the queue; /pricing notes the queue as the audit path for review-
due rows. Docs at /docs/data-verification and
/research/source-verification-methodology gained sections covering
the freshness lifecycle, the workflow, and the explicit
"stale is not false" framing.

**No-auto-mutation policy.** The reverification queue is
informational only. Nothing on the platform auto-fetches vendor
sources, auto-updates verified values, or publishes unreviewed
fetched data. Queue items point a human reviewer at a source URL
with a suggested manual action; the catalogue only mutates after a
manual review confirms the value and the reviewer hand-edits the
data file with a fresh `retrievedAt` or `lastCheckedAt`. Integrity
guards refuse any helper that calls `fetch()` from the freshness or
reverification layers, refuses any filesystem mutation in those
helpers, refuses /api/reverification to surface secret env values,
and refuses to ship `/reverification` if its copy promises
auto-scraping or auto-updates. `ROUTE_SET_VERSION` is bumped to
`content-v4` for Sprint 21.

**Sprint 22 — intelligence workspace + review operations.** Sprint
22 lifts the entity-graph, freshness, and reverification layers
into an operator workspace at
[`/intelligence`](apps/models/app/intelligence/page.tsx) (JSON at
`/api/intelligence`). The page renders workspace destinations, a
current intelligence snapshot of verified counts, a review
operations panel with quick-jump links into the reverification
queue, a coverage health matrix that shows verified vs review-due
vs blocked across every entity domain, and a methodology block.

New helpers introduced:
- [`lib/intelligence-summary.ts`](apps/models/lib/intelligence-summary.ts):
  `getIntelligenceSummary`, `getCoverageHealthMatrix`,
  `getReviewOperationsSummary`, `getWorkspaceLinks`.
- [`lib/comparison-clusters.ts`](apps/models/lib/comparison-clusters.ts):
  `getComparisonClusters`, `getTwoSidedVerifiedComparisons`,
  `getComparisonsByProvider`, `getComparisonCoverageSummary`.
- [`lib/source-usage.ts`](apps/models/lib/source-usage.ts):
  `getSourceUsageMap`, `getEntitiesUsingCitation`,
  `getSourcesByProvider`, `getCitationImpactSummary`.

All three are pure local reads — no `fetch()`, no `process.env`, no
`Date.now()`. State derives from `siteConfig.buildDate` where
freshness is relevant.

`/reverification` was upgraded with server-rendered GET filters
(`?priority`, `?reason`, `?provider`, `?entityType`, `?freshness`).
The unfiltered page stays indexable; every filtered URL is
`noindex, follow`. A new
[`/api/reverification/checklist`](apps/models/app/api/reverification/checklist/route.ts)
endpoint exports the queue as Markdown (default) or JSON
(`?format=json`) so a reviewer can paste a checklist into a PR or
notebook. The endpoint sets `X-Robots-Tag: noindex` and accepts the
same filter params as the page.

`/models` and `/compare` gained discovery summary cards. `/models`
also accepts a Sprint-22 `role` query param (`creator`,
`hosted-platform`, `both`) for provider-role filtering — filtered
URLs are `noindex, follow`. `/coverage` surfaces a prominent
intelligence-workspace callout.

`ROUTE_SET_VERSION` bumps to `content-v5`. Sixteen new integrity
guards enforce the no-admin-auth + no-auto-mutation invariants
across every Sprint-22 surface, including a defence-in-depth
re-check that `/status` never carries a numeric uptime percentage.

**Sprint 23 — model selection workspace + use-case intelligence.**
Sprint 23 turns the verified data + intelligence workspace into a
practical product surface for browser visitors. Use cases are
introduced as *selection workflows* — never recommendations.
[`lib/use-cases.ts`](apps/models/lib/use-cases.ts) defines eight
source-safe slugs; each carries `title`, `description`,
`verifiedFieldsUsed`, `caution`, `route`, and `relatedRoutes`. Four
ship a dedicated detail page this sprint:
`/use-cases/long-context-analysis`, `/use-cases/multimodal-input`,
`/use-cases/hosted-inference`, `/use-cases/governance-review`. The
remaining four (structured output, cost review, status-aware
selection, comparison research) are reserved on the
`/use-cases` hub and available as filter values on `/select`.

[`lib/model-shortlists.ts`](apps/models/lib/model-shortlists.ts) is
the source-backed shortlist builder. Pure local read, no fetch, no
process.env, no Date.now. **No score and no rank function** — an
integrity guard refuses any identifier matching
`score|rank|ranking|rankBy|ranked|weightedScore|fitnessScore`.
Shortlist order is deterministic and documented:
1. verified field count desc
2. active lifecycle first
3. source count desc
4. name asc

The [`/select`](apps/models/app/select/page.tsx) workspace renders
the shortlist with server-rendered GET filters (`useCase`,
`provider`, `lifecycle`, `minContext`, `modality`,
`pricingCoverage`, `hostedAvailability`, `verification`,
`freshness`). Base `/select` is indexable; every filtered URL is
`noindex, follow`. The new filter keys are added to
`should-index.ts` `FILTERED_KEYS`. Filtered indexing-QA coverage
includes `/select?useCase=long-context-analysis` to validate the
noindex policy on production.

The homepage gained a "Start with a use case" section with four
cards. `/models` carries a selection-workspace CTA + quick-start
use-case links above the existing filter form. `/compare` gained a
"Start from a use case" intro aside.

`ROUTE_SET_VERSION` bumps to `content-v6`. Eleven new integrity
guards enforce the policy across every Sprint-23 surface:
recommendation language is banned (best/recommended/winner/
cheapest/fastest/guaranteed/certified), the shortlist helper is
score-free, every detail page renders via
`<UseCaseDetailLayout>` so the /coverage + /sources links are
always present, sitemap + llms.txt + smoke + indexing scripts all
advertise the new routes, and no OpenAI numeric metric may appear
on a Sprint-23 surface (re-check of the Sprint-18 unverified-GPT-5
policy).

**Sprint 24 — comparison builder + decision workflow.** Sprint 24
turns the selection workflow into an ad-hoc, server-rendered
side-by-side comparison surface. A new
[`/compare/build`](apps/models/app/compare/build/page.tsx) workspace
accepts `?models=<comma-list>`, `?useCase`, `?fields`, `?showGaps`
and renders 2–4 selected models against verified fields straight
from the typed local data layer. The cap is enforced server-side at
`COMPARISON_BUILDER_MAX_MODELS = 4`; over-selection truncates with
a banner.

[`lib/comparison-builder.ts`](apps/models/lib/comparison-builder.ts)
exposes `buildModelComparison`, `getComparableModels`,
`getComparisonBuilderDefaults`, `getComparisonFieldDefinitions`,
`getComparisonBuilderSummary`, and `comparisonBuilderUrl`. Pure
local read; an integrity guard refuses any identifier matching
`score|rank|ranking|rankBy|ranked|weightedScore|fitnessScore|winner|recommend|recommended`.

[`components/DecisionWorkflow.tsx`](apps/models/components/DecisionWorkflow.tsx)
ships the six-step decision strip used across `/select`,
`/compare/build`, every use-case detail page, and the new
[`/docs/decision-workflow`](apps/models/app/docs/decision-workflow/page.tsx)
documentation page. The doc page explains in long form why the
catalogue does not rank, why use cases come first, how shortlist
order is derived, how the comparison builder works, how data gaps
affect decisions, how to use sources + freshness, and what the
platform deliberately does not decide for the reader.

Flow connections added this sprint:
- `/select` rows carry a "Compare in builder" link per row plus a
  "Compare top shortlist in builder" header CTA seeded from the
  current filter.
- Use-case detail pages render an "Open comparison builder for
  this use case" link pre-seeded from the use-case shortlist (top
  4 candidates — explicitly framed as candidates, not picks).
- `/compare` hub gained a "Build a custom comparison" callout
  with four pre-seeded use-case URLs.

The `should-index` allow-list adds `models`, `fields`, `showGaps`
so every `/compare/build?...` URL is `noindex, follow`. The
unfiltered `/compare/build` base page is indexable and listed in
the content registry (`/docs/decision-workflow` joins the registry
so sitemap + llms.txt + /api/site advertise it automatically).
`ROUTE_SET_VERSION` bumps to `content-v7`. Ten new integrity
guards enforce: helper is score-free + network-free, the builder
applies the filtered-noindex policy, every entry-point links to
`/compare/build`, banned recommendation language stays out of
every Sprint-24 surface, and the OpenAI no-metrics policy is
re-checked across the new files.

**Sprint 25 — decision briefs + shareable evidence reports.**
Sprint 25 turns the selection workflow into a shareable artifact.
[`lib/decision-briefs.ts`](apps/models/lib/decision-briefs.ts)
constructs a typed `DecisionBrief` from 2–4 selected models:
`selectedModels`, `verifiedEvidence` (per-model field + value +
source-ID refs), `dataGaps` (explicit unverified fields with the
reason they are missing), `sourceTrail` (every primary-source
citation referenced), `freshnessNotes` (records or citations past
the fresh window), `hostedAvailability`, a `nextExternalTests`
checklist, and `policyNotes`. Pure local read; no fetch, no
`process.env`, no `Date.now` — `generatedAt` comes from
`siteConfig.buildDate` so the same build produces the same brief.

The brief is rendered at
[`/briefs/build`](apps/models/app/briefs/build/page.tsx) (server-
rendered, GET filters identical to `/compare/build`) and exported
at
[`/api/briefs/decision`](apps/models/app/api/briefs/decision/route.ts)
in two formats:
- `text/markdown; charset=utf-8` (default) — paste-ready table of
  evidence rows, data gaps, source trail, freshness notes, hosted
  availability, the external-tests checklist, and the policy
  notes.
- `application/json; charset=utf-8` (via `?format=json`) — same
  payload as a structured object for tooling.

Both responses set `X-Robots-Tag: noindex`. The base
`/briefs/build` page is indexable; every filtered URL is
`noindex, follow`.

Flow connections added this sprint:
- `/select` shortlist header gained a "Create evidence brief for
  top shortlist" link.
- `/compare/build` "Next actions" panel gained a "Create decision
  brief from this comparison" link.
- Every use-case detail page (via `<UseCaseDetailLayout>`) gained
  a "Create evidence brief for this use case" link pre-seeded with
  the use-case shortlist's top 4 candidates.
- `/intelligence` workspace links list gained a "Decision briefs"
  card.
- `/docs/decision-workflow` related-links list gained a
  "Decision brief builder" entry.
- [`/docs/decision-briefs`](apps/models/app/docs/decision-briefs/page.tsx)
  documents the evidence-vs-recommendation policy in long form
  (joined the content registry so sitemap + llms.txt + /api/site
  advertise it automatically).

`ROUTE_SET_VERSION` bumps to `content-v8`. `INTELLIGENCE_ENDPOINTS`
extended with `/api/briefs/decision`. Twelve new integrity guards
enforce: helper is deterministic + score-free, builder applies
filtered-noindex, export endpoint sets X-Robots-Tag and reads no
secret env, every entry-point links to `/briefs/build`, banned
recommendation language stays out of every Sprint-25 surface, and
the OpenAI no-metrics policy is re-checked.

**Sprint 26 — UX conversion polish + landing narrative.** Sprint
26 makes the product self-explanatory for a cold visitor. Hero
copy rewritten to lead with positioning + a primary "Start with
a use case" CTA + a secondary "How it works" CTA. The homepage
gained two new sections directly below the Hero: a "How to use
this" workflow strip (the shared `<DecisionWorkflow>` component
with a CTA to `/how-it-works`) and a "Who this is for / What this
catalogue is not" two-card framing.

A new walkthrough page lives at
[`/how-it-works`](apps/models/app/how-it-works/page.tsx). It opens
with the same workflow strip + the "what this is / what this is
not" framing, then walks five step-numbered sections (use case →
shortlist → comparison → gaps + freshness → evidence brief), each
linking into the appropriate workspace. The page joins the
content registry, lives in `STATIC_ROUTES` (priority 0.9, monthly)
so the sitemap pass de-dupes correctly, leads the llms.txt hub
list, and is added to the footer Content column.

Workspace intros tightened to a single paragraph each with an
explicit step number in the eyebrow ("Workspace · step 2 of 5")
and a reference to `/how-it-works`. Surfaces touched: `/select`,
`/compare/build`, `/briefs/build`, `/intelligence`.

Seven new integrity guards confirm `/how-it-works` exists +
pulls title from the content registry, the homepage renders the
workflow strip + audience cards, Hero links to `/use-cases` and
`/how-it-works`, every workspace intro references
`/how-it-works`, route contract + sitemap + llms.txt + footer
advertise the new route, smoke + indexing include it, and no
recommendation language appears on Sprint-26 surfaces. No
theme/CSS/dependency changes — copy + components only.

**Sprint 27 — visual proof + guided demos + example evidence
brief.** Sprint 27 makes the product easier to evaluate by
packaging the existing workflow surfaces into three predefined
navigation recipes and one worked example. None of the new
surfaces invent data, fabricate screenshots, or imply
recommendation.

[`lib/guided-demos.ts`](apps/models/lib/guided-demos.ts) defines
three demo slugs — `long-context-analysis`, `hosted-inference`,
`governance-review` — each carrying:
- a use-case slug pointer
- a `modelSlugs` list derived from the typed catalogue
  (`getUseCaseShortlist()` for long-context + governance;
  `hostedPricing[].modelSlug` for hosted-inference)
- a five-step route plan into `/use-cases/<slug>`, `/select?...`,
  `/compare/build?...`, `/briefs/build?...`, and `/sources`
  (`/reverification` added for governance)
- the verified fields the demo intends to inspect
- a per-demo policy note re-stating what the demo does NOT
  assert

The helper is a pure local read. An integrity guard refuses any
`score|rank|winner|recommend` identifier in code; disclaimer
strings remain allowed.

Five new server-rendered components in `apps/models/components/demo/`
render visual proof from local data:
- `WorkflowPreviewPanel` — five connected tiles for the demo's
  route plan
- `DemoRouteCard` — the demo summary card used on the hub
- `EvidencePreviewTable` — verified-field table for a model set
- `DecisionBriefPreview` — runs `buildDecisionBrief()` and shows
  counts + export links
- `DemoStepStrip` — numbered list of the demo's primary routes

[`/demos`](apps/models/app/demos/page.tsx) hub renders the three
demo cards + the shared `<DecisionWorkflow>` strip + a
`WorkflowPreviewPanel` for the long-context demo.
[`/demos/[slug]`](apps/models/app/demos/[slug]/page.tsx) detail
pages render hero + per-demo policy + `WorkflowPreviewPanel` +
step strip + evidence table + brief preview + a "what this demo
does not decide" callout + related routes.

[`/examples/decision-brief`](apps/models/app/examples/decision-brief/page.tsx)
renders a worked example using the same `buildDecisionBrief()`
helper as the live `/briefs/build` and `/api/briefs/decision`
endpoints, so the example cannot drift from the real export. The
page surfaces evidence preview, full data-gap list, full source
trail, and the next-external-tests checklist; a "Build your own"
panel links the live builder and both export endpoints.

Flow integrations: homepage gained a "Try a guided workflow"
section, `/how-it-works` gained a "Try this workflow" section,
`/intelligence` workspace links gained a "Guided demos" card,
`/select` + `/compare/build` intros added quick-start demo links,
`/briefs/build` policy aside added a "view example" link, and the
footer Content column added "Demos" + "Example brief".

`ROUTE_SET_VERSION` bumps to `content-v9`. Nine new integrity
guards enforce: helper exists + is deterministic + score-free,
demo components exist, /demos hub + detail pages exist with the
"not model recommendations" framing, /examples/decision-brief
uses `buildDecisionBrief()`, every entry-point links to /demos,
route contract + sitemap + llms.txt + smoke + indexing advertise
the new routes, no recommendation language appears on Sprint-27
surfaces, no fake screenshot references and no benchmark numeric
literals leak into demo surfaces, OpenAI no-metrics re-checked.

**Sprint 28 — learning platform repositioning + /learn hub +
education-to-workflow bridge.** Sprint 28 adds a teaching layer
on top of the verified-data backbone. Lessons explain how to
inspect each verified catalogue field; every lesson surfaces the
canonical workflow surfaces the reader should walk next. No
lesson tells the reader which model to pick, declares a winner,
ranks by price, asserts latency / throughput / uptime, or
certifies compliance.

A new [`lib/lessons.ts`](apps/models/lib/lessons.ts) registry is
the single source of truth for lesson metadata and learning
paths. The registry exports a `lessons` array, a
`learningPaths` array (model-fundamentals, pricing-and-hosted,
comparison-methodology, governance-and-sources,
testing-workflow), and helpers (`getLesson`,
`getLessonsForPath`, `getRelatedLessons`). Each lesson carries
its title, one-liner, learning-path slug, an `applyRoutes` list
of workflow surfaces (`/select`, `/compare/build`,
`/briefs/build`, `/sources`, `/reverification`, `/coverage`,
`/demos`), a list of related lessons, and the last-reviewed
date.

Five reusable server-rendered components in
[`components/learn/`](apps/models/components/learn/):
- `LessonLayout` — shared shell: breadcrumbs, hero, body,
  apply-this-workflow sidebar, related lessons, "what this
  lesson does not teach" footer, and JSON-LD (`TechArticle` +
  `BreadcrumbList`).
- `LessonApplyPanel` — full-width apply-this-workflow card
  surfaced inline in the lesson body.
- `ConceptChecklist` — "what to verify" / "what to inspect"
  bullet list with semantic markup.
- `CommonMistakes` — mistake + why-it-hurts pair list.
- `VerifiedExamplesTable` — renders the requested verified
  field (`contextWindow`, `maxOutputTokens`, `lifecycle`) for a
  given list of model slugs, pulling values directly from the
  typed local data layer. Unverified rows render the canonical
  unverified-data label. The table never asserts ranking.

[`/learn`](apps/models/app/learn/page.tsx) hub renders the
hero, five learning-path cards, the full lessons grid, the
apply-this-workflow surface map, and JSON-LD
(`CollectionPage` + `BreadcrumbList`). Six lesson pages ship
under `/learn/<slug>`:
- `/learn/how-to-choose-ai-model` — the workflow in plain
  language.
- `/learn/context-window` — what context window means, what it
  does not guarantee.
- `/learn/hosted-vs-first-party` — creator vs billing provider,
  hosted availability vs pricing reference.
- `/learn/pricing-references` — references not quotes,
  first-party vs hosted, volatility, no price ranking.
- `/learn/model-lifecycle` — active/preview/deprecated/retired,
  why lifecycle gates integration.
- `/learn/testing-ai-models` — the work the catalogue cannot
  do for you (prompt tests, latency, rate limits, cost
  validation, compliance review).

Each lesson surfaces:
- H1 + plain-language explanation
- "Why it matters" prose
- A `ConceptChecklist` of what to verify
- A `VerifiedExamplesTable` (or equivalent verified-data
  surface) for the relevant field
- A `CommonMistakes` block
- An inline `LessonApplyPanel` listing the workflow routes
- A "data gaps to watch" callout
- A related-pages list
- A sources / freshness note

Primary nav is repositioned around the learning flow:
**Learn · Use Cases · Select · Compare · Briefs · Models ·
Sources · Docs**. The footer gains a dedicated `Learn` column
listing every lesson; a `Workflow` column groups use-cases /
select / compare / briefs / demos / example brief / how it
works; the `Intelligence` column keeps intelligence / models /
providers / pricing / coverage / sources / reverification /
status / research / docs.

Flow integrations: the homepage gains a "Learn first, then
compare" section directly below the workflow strip; `/select`,
`/compare/build`, `/briefs/build`, `/use-cases`, `/how-it-works`,
`/demos`, and `/docs` all surface targeted learning links.

`ROUTE_SET_VERSION` bumps to `content-v10`. Ten new integrity
guards enforce: hub + lesson files exist, registry exports the
expected helpers, lesson components exist, homepage + nav +
footer + every key surface links to `/learn`, every lesson
links to at least one workflow surface, no
`best`/`recommended`/`winner`/`cheapest`/`fastest`/`guaranteed`/
`certified`/`official partner` phrasing appears on lesson
surfaces, no benchmark literals leak into lessons, OpenAI
no-metrics re-checked across lesson surfaces, route contract +
sitemap + llms.txt + smoke + indexing advertise the new routes.

**Lesson integrity policy.** Lessons explain catalogue fields
and link to catalogue workflows. They:
- Do not declare any model the best for any workload.
- Do not rank models by price, latency, throughput, or uptime.
- Do not publish benchmark scores or fabricated metrics.
- Do not recommend specific models or specific hosting
  platforms.
- Do not assert compliance / certification.
- Do not include AI news, "Top 10 AI tools" lists, or any
  affiliate-style ranking copy.
- Do render verified examples directly from the typed local
  data layer, with the unverified-data label for any field the
  catalogue has not yet sourced.

The lesson surfaces and the integrity guards behind them are
the contract that keeps the learning layer educational rather
than promotional.

**Sprint 29 — practical exercises + 4 lessons + beginner path.**
Sprint 29 makes the learning layer practical. The catalogue
gains an exercise tier that walks the reader from concept to
artifact: read the lesson, perform the exercise, end with a
shortlist URL / comparison URL / brief Markdown / freshness
checklist.

[`lib/learning-exercises.ts`](apps/models/lib/learning-exercises.ts)
is the single source of truth for exercises. The registry
exports `learningExercises`, `getLearningExercise`,
`getExercisesForLesson`, `getLearningExerciseGroups`, and
`getLearningExerciseRoutes`. Each exercise carries:
- slug + title + summary
- `difficulty` (beginner | intermediate) + `estimatedMinutes`
- `relatedLessonSlugs` (which lessons this exercise applies)
- `goal` (what the user will learn)
- `prerequisites` (with links to related lessons)
- `steps` (title + instruction + route + expectedOutcome)
- `completionChecklist` (Markdown-style)
- `policyNote` (explicit no-recommendation clause)
- `evidenceArtifact` (the concrete output)

Eight exercises ship: build-first-shortlist (beginner, 8 min),
compare-context-windows (beginner, 7 min), map-hosted-provider
(intermediate, 10 min), review-pricing-reference (beginner,
6 min), inspect-model-lifecycle (beginner, 5 min),
create-decision-brief (intermediate, 10 min),
check-source-freshness (beginner, 5 min),
plan-external-model-test (intermediate, 12 min).

Five new server-rendered components in
`apps/models/components/learn/`:
- `ExerciseLayout` — shared shell (breadcrumbs, hero, related
  lessons sidebar, evidence-artifact card, policy note,
  workflow routes, "what this exercise does not produce"
  footer) + `TechArticle` + `BreadcrumbList` JSON-LD.
- `ExerciseCard` — summary card with difficulty chip + minutes
  + primary-route preview.
- `ExerciseStepList` — numbered step list with route link and
  expected-outcome callout per step.
- `ExerciseChecklist` — Markdown-style checklist (no client
  state — completion is the evidence artifact, not a UI
  toggle).
- `LessonExercisesPanel` — surfaces the exercises tagged with
  a given lesson slug; rendered inside every lesson body so
  the reader can jump from concept to practice.

[`/learn/exercises`](apps/models/app/learn/exercises/page.tsx)
hub renders the exercises grouped by difficulty, plus the
five-step learning path flow (read lesson → complete exercise
→ build shortlist → compare fields → export brief). The
dynamic
[`/learn/exercises/[slug]`](apps/models/app/learn/exercises/%5Bslug%5D/page.tsx)
route uses `generateStaticParams()` to prerender all 8 exercise
detail pages from the registry.

Four new lesson pages bring the lesson registry to 10:
- `/learn/multimodal-input` — modality channels, why marketing
  copy is not enough.
- `/learn/structured-output` — JSON mode vs structured output
  vs tool calling.
- `/learn/status-aware-selection` — vendor status vs
  independent probe, when status gates selection.
- `/learn/benchmark-limitations` — contamination, prompt
  variance, version drift, no benchmark scores published.

A curated
[`/learn/path/beginner`](apps/models/app/learn/path/beginner/page.tsx)
page sequences 2 readings + 3 exercises + 1 freshness review
into a ~35–40 minute path. Uses schema.org `Course` JSON-LD.
No quizzes, no scoring, no progress tracking, no accounts —
completion is the evidence artifacts in the reader's hands.

The `/learn` hub is restructured into five sections:
- **Start here** — beginner path strip
- **Concept lessons** — split into Foundations + Going deeper
- **Practical exercises** — first four exercises with full
  link to the exercises hub
- **Apply with workflows** — the six canonical workspaces
- **Advanced reading** — research + docs + intelligence

Flow integrations: homepage Learn-first card grid expands to
four cards (adds "Learn by doing" → `/learn/exercises`);
`/how-it-works` adds a "Practise the workflow with exercises"
section featuring three beginner exercises; `/demos` adds an
"After the demo, complete an exercise" panel pairing each
demo with a matching exercise; SiteFooter Learn column expands
to include the beginner path, the exercises hub, and all 10
lessons.

`ROUTE_SET_VERSION` bumps to `content-v11`. Thirteen new
integrity guards enforce: the exercises registry exists with
all required exports, all 8 exercise slugs are present, the
hub + dynamic detail route exist, the 5 exercise components
exist, the 4 new lesson pages exist, the lessons registry has
10 lesson slugs, every lesson page renders the
`LessonExercisesPanel`, exercises link to related lessons and
the canonical workflow routes, exercise pages carry an
explicit "does not recommend a model" note, no
quiz/scoring/ranking language (`your score is`, `grade
yourself`, `the correct answer is`, `is the best`, `winner`,
`cheapest`, `fastest`, `guaranteed`, `certified`) appears on
any Sprint 29 surface, no benchmark literals leak in, OpenAI
no-metrics re-checked, and the route contract + sitemap +
llms.txt + smoke + indexing all advertise the 14 new routes.

**Exercise integrity policy.** Exercises produce evidence,
not endorsements. They:
- Do not score or grade the reader.
- Do not contain "the correct answer is..." copy.
- Do not pick a model for the reader.
- Do not assert latency, throughput, uptime, or compliance.
- Do route through the existing workspaces — they never
  introduce a parallel UI for the same workflow.
- Do end with a concrete, paste-ready artifact (URL,
  Markdown, JSON) that any teammate can open or read
  independently.

**Beginner path policy.** The beginner path is a sequenced
list of existing pages. It does not introduce a curriculum
with grades, an account system, or any progress-tracking
state. Completion is the artifacts in the reader's hands.

**Sprint 30 — role-based learning paths + AI usage
curriculum positioning.** Sprint 30 promotes the catalogue
to "AI usage learning platform powered by verified model
intelligence". The Hero, homepage, /how-it-works, and
/intelligence intros all reflect the repositioning, and the
/learn hub becomes a guided curriculum landing organised
around Learn → Apply → Verify.

A new
[`lib/learning-paths.ts`](apps/models/lib/learning-paths.ts)
registry is the single source of truth for role-based paths.
Five paths ship:

- `beginner` — newcomer to AI model selection (3 lessons + 4
  exercises, ~45 min).
- `developer` — engineer preparing an integration (4
  lessons + 3 exercises + 2 pre-seeded workflows, ~60 min).
- `product-manager` — product manager / technical buyer (4
  lessons + 3 exercises + 1 pre-seeded workflow, ~60 min).
- `governance` — risk / compliance reviewer (4 lessons + 3
  exercises + 3 audit workflows, ~70 min).
- `automation-specialist` — automation builder / SEO
  operator / technical consultant (5 lessons + 4 exercises +
  3 pre-seeded workflows, ~75 min).

Each path declares `whatYouWillLearn`, `whatYouWillBuild`,
`evidenceArtifacts`, `prerequisites`, sequenced `steps`,
`toolsUsed`, `doesNotPromise`, and `policyNote`. Step types
are typed: `lesson` (resolved against `lessons.ts`),
`exercise` (resolved against `learning-exercises.ts`), or
`workflow` (canonical workspace route). Step builders throw
at module-load if a slug is unknown — the path layer cannot
drift from the underlying lesson / exercise registries.

Five new server-rendered components in
`apps/models/components/learn/`:

- `LearningPathCard` — summary card (audience, difficulty,
  minutes, artifact chips, start link).
- `LearningPathTimeline` — numbered vertical timeline; each
  step renders its kind chip, title, purpose, minutes, and
  route link.
- `LearningPathProduces` — four-block "what you walk away
  with" card: what you will learn, what you will build,
  evidence artifact chips, tools used.
- `LearningPathPicker` — grid of all five path cards.
- `NoProgressPolicy` — explicit "no accounts, no progress
  tracking, no certificates" callout.

[`/learn`](apps/models/app/learn/page.tsx) is reshaped:

- New hero copy ("Learn how to use AI models correctly").
- New "Learn → Apply → Verify" section with three cards
  (Learn concepts · Apply with workflows · Verify with
  sources).
- `LearningPathPicker` directly under the hero.
- Existing concept lessons grid + exercises section
  preserved.
- `NoProgressPolicy` near the end.

[`/learn/paths`](apps/models/app/learn/paths/page.tsx) is a
new index page that surfaces all five paths with a
`CollectionPage` + per-path `Course` JSON-LD payload.

The previous static
`/learn/path/beginner/page.tsx` is replaced with a dynamic
[`/learn/path/[slug]`](apps/models/app/learn/path/%5Bslug%5D/page.tsx)
route that prerenders all five paths via
`generateStaticParams()`. Each path detail page renders:

- Hero with audience label, difficulty, minutes, summary
- Policy note callout
- At-a-glance card (audience, difficulty, time)
- `LearningPathProduces` block
- Prerequisites
- `LearningPathTimeline`
- Start-next card
- "What this path does not promise" list
- How to use this path
- `NoProgressPolicy`
- Related routes aside
- schema.org `Course` JSON-LD with `hasPart` step list

Global integration:

- `LessonLayout` calls `getLearningPathsForLesson(slug)` and
  surfaces a "This lesson appears in these paths" sidebar.
- `ExerciseLayout` calls `getLearningPathsForExercise(slug)`
  and surfaces the same.
- `/learn/exercises` adds an "Exercises by path" section
  with per-path exercise listings.
- Homepage Learn section becomes a five-card path picker.
- `/how-it-works` gains a "Choose a path" section.
- `/select`, `/compare/build`, `/briefs/build`, `/demos`
  link to role-specific paths.
- SiteFooter Learn column adds all five path entries plus
  the All paths index.

Positioning copy refresh:

- `components/Hero.tsx` — primary heading becomes "Learn how
  to use AI models correctly", primary CTA becomes "Start
  learning", secondary CTA "Choose your path".
- `app/intelligence/page.tsx` — intro notes the same
  verified-data backbone powers the curriculum at /learn.

`ROUTE_SET_VERSION` bumps to `content-v12`. Thirteen new
integrity guards enforce: registry has all 8 exports, 5 path
slugs registered, 5 path components exist,
`/learn/paths` + dynamic `/learn/path/[slug]` exist, `/learn`
renders picker + Learn-Apply-Verify + NoProgressPolicy,
detail page renders Timeline + Produces + NoProgressPolicy,
homepage + `/how-it-works` each link ≥3 role paths,
`LessonLayout` / `ExerciseLayout` call the path helpers,
`/learn/exercises` has Exercises-by-path, no certificate
language, no scoring/ranking language, **no SEO ranking
guarantee language** (special-case scoped across path
surfaces + Hero + homepage to catch automation-specialist
drift), OpenAI no-metrics re-checked, route contract +
sitemap + llms.txt + smoke + indexing all advertise the 6
new routes. Three legacy guards (Sprint 26 Hero, Sprint 26
workspace intros, Sprint 28 lesson registry) updated to
accept the new positioning + renamed lesson groupings.

**Automation-specialist path policy.** The automation
specialist path is the highest-risk surface for
promise-heavy SEO / automation marketing copy. The path
explicitly lists "guaranteed automation reliability", "SEO
ranking gains or traffic outcomes", "compliance approval
for an automated workflow", and "production readiness
without external testing" under `doesNotPromise`. A
dedicated guard (`no SEO ranking guarantee language
anywhere`) scans the path layer, Hero, homepage,
`/how-it-works`, and `/learn` for forbidden phrasing
(`guaranteed seo/search/ranking/traffic`,
`improve/boost/grow your seo by/to/with`, `rank #1`, `top
of google`).

**No-progress policy.** No accounts. No progress tracking.
No certificates. No course-completion claims. The
catalogue does not store which lessons a reader has
visited, does not issue badges or credentials, and does
not gate the workspaces behind any auth surface.
Completion of any path is the evidence artifact in the
reader's hands — never a UI signal.

**Sprint 31 — AI Usage Lab.** Sprint 31 extends the
curriculum into a fourth step:
**Learn → Apply → Verify → Test**. The lab teaches
practical model testing before integration — it does not
certify the model, validate safety, replace benchmarks,
or guarantee production readiness.

[`lib/lab-playbooks.ts`](apps/models/lib/lab-playbooks.ts)
is the single source of truth for the lab. The registry
exports `labPlaybooks`, `labTemplates`, `getLabPlaybook`,
`getLabTemplate`, `getLabPlaybooks`, `getLabTemplates`,
`getLabPlaybookRoutes`, `getLabTemplateRoutes`, and
`labTemplateToMarkdown`.

Six playbooks ship:

- `prompt-testing-basics` — beginner, 25 min.
- `structured-output-testing` — intermediate, 30 min.
- `long-context-testing` — intermediate, 35 min.
- `multimodal-input-testing` — intermediate, 30 min.
- `automation-workflow-testing` — intermediate, 40 min.
- `model-regression-testing` — intermediate, 30 min.

Each playbook carries: `goal`, `whenToUse`, typed
`prerequisites`, `testSetup`, `minimumTestSet`,
`promptVariants`, `observationsToRecord`, `failureModes`,
`stopConditions`, `outputs`, `relatedTemplates`,
`relatedRoutes`, and an explicit `policyNote`. No
playbook fabricates example results, names a winner, or
publishes benchmark scores.

Three templates ship:

- `model-evaluation-plan` — five-section plan covering
  identify, scope, test plan, observations, decision.
- `prompt-test-matrix` — Markdown table scaffold for
  prompt × candidate × pass/fail rollups.
- `automation-risk-checklist` — five-section pre-launch
  risk checklist for automations that depend on a model.

Templates are typed `LabTemplate` with structured
`sections[]` and `body[]` arrays. The deterministic
`labTemplateToMarkdown(template)` serialiser turns any
template into clean Markdown — no Date.now, no model
slugs, no user input.

Five new server components in
`apps/models/components/lab/`:

- `LabPlaybookCard` — summary card (difficulty,
  minutes, output count).
- `LabTemplateCard` — summary card with section count.
- `LabPolicyNote` — the explicit "what the lab does not
  promise" callout.
- `LabChecklistSection` — bullet-list section used by
  every playbook field.
- `LabWorkflowStrip` — the four-step "define task →
  build test set → run model trials → record evidence"
  strip.

[`/lab`](apps/models/app/lab/page.tsx) hub renders the
hero, `LabWorkflowStrip`, playbook grid, template grid,
`LabPolicyNote`, and a `CollectionPage` JSON-LD payload
that lists every playbook as `HowTo` and every template
as `CreativeWork`.

[`/lab/[slug]`](apps/models/app/lab/%5Bslug%5D/page.tsx)
dynamic route prerenders the six playbook detail pages
via `generateStaticParams()`. Each detail page renders
the playbook's policy note, at-a-glance card, goal, and
every checklist section (`whenToUse`, `prerequisites`,
`testSetup`, `minimumTestSet`, `promptVariants`,
`observationsToRecord`, `failureModes`, `stopConditions`,
`outputs`), related templates, related workflows, and the
`LabPolicyNote`. JSON-LD: `TechArticle` +
`BreadcrumbList`.

[`/lab/templates`](apps/models/app/lab/templates/page.tsx)
hub renders the three templates with an explicit
"templates are planning tools, not safety guarantees"
callout.
[`/lab/templates/[slug]`](apps/models/app/lab/templates/%5Bslug%5D/page.tsx)
dynamic route prerenders the three template detail pages
and surfaces a direct "Open raw Markdown" link to the
API export endpoint.

[`/api/lab/templates/[slug]`](apps/models/app/api/lab/templates/%5Bslug%5D/route.ts)
endpoint is the Markdown export surface. It is pure
local derivation:

- Uses `force-static` with `generateStaticParams()` so
  the three template responses are prerendered.
- Calls `labTemplateToMarkdown()` from the registry — the
  serializer stays in lib, not in the route.
- Responds `text/markdown; charset=utf-8`.
- Sets `X-Robots-Tag: noindex` so generated planning
  templates do not enter the index from outside.
- `Cache-Control: public, max-age=300, s-maxage=300`.
- No fetch, no env, no Date.now, no user input.

Flow integrations:

- Homepage gains a "Test before production" section.
- `/learn` Learn → Apply → Verify expands to four
  cards, the new Test card linking to `/lab`.
- `/how-it-works` adds a "Learn → Apply → Verify →
  Test" section pointing into three lab surfaces.
- `/briefs/build` policy aside links the lab as the
  testing planning home.
- `/demos` "after the demo, complete an exercise" panel
  adds a follow-up link to the matching lab playbook.
- SiteFooter Workflow column adds Lab + Lab templates.
- The developer learning path adds the
  prompt-testing-basics playbook as its final workflow
  step.
- The automation-specialist learning path adds the
  automation-workflow-testing playbook as its final
  workflow step.

`ROUTE_SET_VERSION` bumps to `content-v13`. The
`REQUIRED_PAGE_ROUTES` array adds `/lab` and
`/lab/templates`; the `REQUIRED_API_ROUTES` array adds
the three template export endpoints. `/api/site` now
advertises `labHub`, `labTemplates`, and
`labTemplateEndpoints`.

Smoke (`scripts/lib/smoke.mjs`) gains markdown
content-type handling — generic API checks now accept
`text/markdown` alongside JSON / plain text so the lab
export endpoints pass the same gate as the briefs
endpoint.

Twelve new integrity guards enforce:

1. Registry exists with all 9 required exports.
2. All 6 playbook slugs registered.
3. All 3 template slugs registered.
4. Hub + dynamic playbook detail + templates hub +
   template detail pages all exist.
5. Export endpoint exists with `X-Robots-Tag: noindex`,
   `text/markdown`, `labTemplateToMarkdown()` call, no
   `Date.now`, no `process.env`, no `fetch`.
6. The 5 lab components exist.
7. Registry has no score / rank / recommend / winner
   language.
8. Lab pages contain no benchmark numeric score.
9. Lab pages contain no production-readiness /
   certification / safety guarantee / SEO ranking
   guarantee phrasing (`guarantees production readiness`,
   `is production ready`, `certifies the model`,
   `validates safety automatically`,
   `guaranteed seo/search/ranking/traffic`,
   `top of google`, `rank #1`, `certified compliant`).
10. No OpenAI numeric metric appears on Sprint 31
    surfaces.
11. `/how-it-works` mentions
    `Learn → Apply → Verify → Test`.
12. Route contract + sitemap + llms.txt + smoke +
    indexing advertise all 11 lab page routes; route
    contract + smoke advertise the 3 API endpoints.

**Lab policy.** The lab teaches workload-specific
testing discipline. It does not certify any model,
publish benchmark scores, validate safety, guarantee
SEO outcomes or automation reliability, or substitute
for the team's own production-readiness review. A
filled-in template is evidence the planning work was
done — not a sign-off.

**Sprint 32 — evaluation prompt library + /lab/evaluation
guide.** Sprint 32 extends the AI Usage Lab with a
structured prompt library for testing model behaviour
before production use. The library is positioned
clearly: these are evaluation inputs, never production
prompts, never a marketplace, never a "best prompts"
list.

[`lib/evaluation-prompts.ts`](apps/models/lib/evaluation-prompts.ts)
is the single source of truth. The registry exports
`evaluationPromptSets`, `getEvaluationPromptSet`,
`getEvaluationPromptSets`, `getEvaluationPromptSetRoutes`,
`getEvaluationPromptSetsByCategory`, and
`promptSetToMarkdown`.

Six prompt sets ship, five prompts each:

- `summarization-quality` — beginner, 20 min.
- `structured-extraction` — intermediate, 25 min.
- `long-context-recall` — intermediate, 25 min.
- `instruction-following` — beginner, 20 min.
- `refusal-boundary` — intermediate, 25 min.
- `automation-robustness` — intermediate, 25 min.

Each `EvaluationPromptSet` carries: `category`,
`difficulty`, `estimatedMinutes`, `whenToUse`, typed
`prerequisites`, `evaluationGoal`, an array of typed
`EvaluationPrompt` entries (each with `id`, `title`,
`prompt`, `purpose`, `expectedObservation`,
`failureLooksLike`, `whatToRecord`), `observationChecklist`,
`comparisonNotes`, `relatedPlaybooks`,
`relatedTemplates`, `relatedRoutes`, and `policyNote`.

**Prompt safety policy.** Sample text uses fictional
names + values (Atlas, Aurora, INV-2099-0007). No real
PII. The refusal-boundary set requests benign
behaviours the model should decline or redirect — no
operational harm content, no jailbreak content, no
bypass / exploit / credential / malware / phishing
phrasing. A dedicated integrity guard (`no jailbreak /
bypass / exploit / phishing / credential / malware
phrasing on Sprint 32 surfaces`) scans every prompt
surface for operational harm phrasing; a separate
guard (`refusal-boundary prompts stay safe and
non-operational`) scans the refusal-boundary slice of
the registry specifically for forbidden prompt content.

Four new server-rendered components in
`apps/models/components/lab/`:

- `PromptSetCard` — summary card with category +
  difficulty + minutes + prompt count.
- `PromptEvaluationTable` — renders the full prompt
  array; each prompt sits inside a non-executable
  `<pre>` block tagged "Evaluation input, not production
  prompt." No copy-to-clipboard script, no live model
  runner.
- `PromptPolicyNote` — the explicit "evaluation inputs,
  not production prompts" callout.
- `PromptObservationChecklist` — observation /
  comparison-note list with unchecked-box visual.

[`/lab/prompts`](apps/models/app/lab/prompts/page.tsx)
hub lists the six sets with `CollectionPage` JSON-LD
that enumerates each set as `HowTo`.

[`/lab/prompts/[slug]`](apps/models/app/lab/prompts/%5Bslug%5D/page.tsx)
dynamic route prerenders the six detail pages via
`generateStaticParams()`. Each page renders policy
note, at-a-glance card, when-to-use, evaluation goal,
prerequisites, export link, full prompt evaluation
table, observation checklist, comparison notes, related
playbooks + templates + workflows, and the
`PromptPolicyNote`. JSON-LD: `TechArticle` +
`BreadcrumbList`.

[`/api/lab/prompts/[slug]`](apps/models/app/api/lab/prompts/%5Bslug%5D/route.ts)
endpoint exports each set as `text/markdown;
charset=utf-8` with `X-Robots-Tag: noindex` and
`Cache-Control: public, max-age=300, s-maxage=300`.
Uses `force-static` + `generateStaticParams()` — six
endpoints prerendered. Pure local derivation: no fetch,
no env, no Date.now, no user input beyond the slug.

[`/lab/evaluation`](apps/models/app/lab/evaluation/page.tsx)
is a long-form guide that explains:

- What evaluation means here (small observation
  routine, not a leaderboard).
- Why prompt sets are not benchmarks.
- How to run candidate model trials.
- How to record observations honestly.
- How to avoid overclaiming.
- How to feed results into a decision brief.

Flow integrations:

- `/lab` adds an "Evaluation prompt library" section
  with three featured prompt sets + a link to the
  evaluation guide.
- `/lab/templates/prompt-test-matrix` adds a
  "Pair with evaluation prompt sets" panel linking the
  hub + three sets.
- The developer learning path appends
  `/lab/prompts/structured-extraction` as a workflow
  step.
- The automation-specialist learning path appends
  `/lab/prompts/automation-robustness`.
- `/briefs/build` policy aside notes the prompt
  library as the place to collect external
  observations before finalising a brief.
- `/demos` after-demo panel links to the prompt
  library.
- SiteFooter Workflow column adds `Lab prompts` +
  `Evaluation guide`.

`ROUTE_SET_VERSION` bumps to `content-v14`. The
`REQUIRED_PAGE_ROUTES` array adds `/lab/prompts` and
`/lab/evaluation`; the `REQUIRED_API_ROUTES` array adds
the six prompt export endpoints. `/api/site` now
advertises `labPrompts`, `labEvaluationGuide`, and
`labPromptEndpoints` (an array of six absolute URLs).

Twelve new integrity guards enforce:

1. Registry exists with all 6 required exports.
2. All 6 prompt set slugs registered.
3. Hub + dynamic detail + evaluation guide exist.
4. Export endpoint sets `X-Robots-Tag: noindex` +
   `text/markdown` + calls `promptSetToMarkdown()` and
   has no `Date.now`, `process.env`, or `fetch`.
5. The 4 prompt components exist.
6. Registry contains no score / rank / recommend /
   winner / "best prompt" / "your score is" phrasing.
7. Prompt pages explicitly state prompts are
   "evaluation inputs, not production prompts".
8. No jailbreak / bypass / exploit / phishing /
   credential / malware operational phrasing on any
   Sprint 32 surface.
9. The refusal-boundary slice of the registry contains
   no banned operational prompt content (no
   "how to make a bomb", no "jailbreak instructions",
   etc.).
10. No benchmark numeric score literals on Sprint 32
    surfaces.
11. No OpenAI metrics.
12. `/lab` links to `/lab/prompts`; the prompt-test-matrix
    template detail links to the prompt library; route
    contract + sitemap + llms.txt + smoke + indexing
    advertise all 8 page routes + 6 API endpoints.

**Sprint 33 — learning product landing + audience
conversion architecture.** Sprint 33 turns the platform
into a self-serving landing product. A cold visitor can
self-select into the right path inside 30 seconds via
the new audience entry points; the homepage spells out
the Learn → Apply → Verify → Test loop, the artifacts
each surface produces, and an explicit "Not another AI
ranking site" differentiation.

[`lib/audiences.ts`](apps/models/lib/audiences.ts) is
the single source of truth for audience entry points.
The registry exports `audiences`, `getAudience`,
`getAudiences`, and `getAudienceRoutes`.

Four audiences ship:

- `developers` — engineers preparing an integration.
- `product-teams` — product managers / technical
  buyers turning a use case into a defensible decision.
- `automation-specialists` — automation builders, SEO
  operators, technical consultants using AI models
  inside workflows.
- `governance-teams` — risk / compliance / governance
  reviewers preparing internal approval discussions.

Each `AudiencePage` carries `title`, `headline`,
`summary`, `whoThisIsFor`, `commonProblems`,
`whatYouCanDo` (typed capability cards),
`artifactsYouCanProduce`, `suggestedPath`,
`suggestedLab`, `guidedDemo`, `evidenceRoutes`, and a
mandatory `doesNotPromise` list. The audience pages
share lessons, exercises, lab playbooks, and
workspaces — only the starting order changes.

Five new server-rendered components in
`apps/models/components/audience/`:

- `AudienceCard` — summary card with artifact chips.
- `AudienceHero` — positioning callout block on
  audience detail pages.
- `AudienceArtifactList` — chip list of paste-ready
  artifacts the audience produces.
- `AudienceWorkflow` — five-step Learn / Apply / Test /
  Brief / Verify strip per audience.
- `AudienceDoesNotPromise` — explicit "what this page
  does not promise" callout.

[`/for`](apps/models/app/for/page.tsx) hub lists the
four audiences with `CollectionPage` JSON-LD that
enumerates each as `WebPage`.

[`/for/[slug]`](apps/models/app/for/%5Bslug%5D/page.tsx)
dynamic route prerenders the four audience detail
pages via `generateStaticParams()`. Each detail page
renders the audience hero, who-this-is-for,
common-problems, what-you-can-do capability grid,
artifact list, suggested workflow, "what this page
does not promise" callout, and a related-routes aside.
JSON-LD: `TechArticle` + `BreadcrumbList`.

[`/docs/platform-positioning`](apps/models/app/docs/platform-positioning/page.tsx)
is the long-form positioning reference. The page
covers what the platform is, what it is not, the
Learn → Apply → Verify → Test loop, audience paths,
evidence artifacts, the verified-data backbone, the
no-rankings / no-recommendations / no-guarantees
policy, and a numbered "how to use this platform
responsibly" workflow. Uses `PageShell` directly
(not the content-registry shell, since it is a bespoke
positioning page rather than a registry-managed doc).

The homepage is restructured:

- Hero CTAs lead with "Choose your learning path" →
  `/for`. Secondary CTAs: "Start beginner path", "Try
  guided demo", "Open AI Usage Lab", "How it works".
- New four-card "Learn → Apply → Verify → Test" core
  loop section sits directly below the Hero.
- New audience picker uses `AudienceCard`.
- New "What you can produce here" section surfaces six
  concrete artifacts (shortlist URL, comparison URL,
  decision brief, model evaluation plan, prompt test
  matrix, source freshness checklist).
- New "Not another AI ranking site" differentiation
  section explicitly states what the platform is and
  is not.
- Existing data sections (coverage, providers, verified
  preview, recently verified, dashboard, useful
  content, trust, explanatory) preserved.

Primary nav reshaped: **Learn · Lab · Demos · Select ·
Compare · Briefs · Models · Sources**. The footer
gains a dedicated `For` column (audience hub + 4
audience pages + platform positioning); the grid
expands from 5 to 6 columns on large viewports.

Conversion CTAs added across the product:

- `/learn` — "Not sure where to start? Choose an
  audience path." callout linking `/for`.
- `/lab` — "Use the lab with a role path." callout.
- `/demos` — "Pick the demo that matches your role."
  callout.
- `/briefs/build` — "Need a clearer path first?"
  callout.
- `/how-it-works` — "Choose your role." callout.
- `/docs` — positioning-doc shortcut inline.

`/api/site` exposes `audienceHub`, `audiences[]`, and
`platformPositioning`.

`ROUTE_SET_VERSION` bumps to `content-v15`. Fourteen
new integrity guards enforce:

1. `lib/audiences.ts` exists with all 4 required
   exports.
2. All 4 audience slugs registered.
3. The 5 audience components exist.
4. `/for` hub + dynamic detail +
   `/docs/platform-positioning` exist.
5. Homepage links to `/for` + `/learn/path/beginner` +
   `/demos` + `/lab`.
6. Homepage surfaces the
   `Learn → Apply → Verify → Test` framing literally.
7. Homepage contains "Not another AI ranking site" or
   the "Not a model leaderboard" equivalent.
8. Footer links to all 4 audience pages + the
   positioning doc.
9. `/learn`, `/lab`, `/demos`, `/briefs/build`, and
   `/how-it-works` each link to `/for`.
10. No banned landing-page phrasing on any Sprint 33
    surface (`is the best <noun>`, `is the winner`,
    `cheapest <noun>`, `fastest <noun>`,
    `guaranteed to <verb>`, `certified for/compliant/by`,
    `official partner`, `is production ready`,
    `compliance approved`, `increase (seo) traffic`,
    `rank #1`).
11. The `automation-specialists` slice of the registry
    contains no SEO ranking guarantee phrasing.
12. The `governance-teams` slice of the registry
    contains no compliance certification phrasing.
13. No OpenAI numeric metric appears on any Sprint 33
    surface.
14. Route contract + sitemap + llms.txt + smoke +
    indexing advertise all 6 new routes.

Two legacy guards updated:

- Sprint 26 Hero guard now accepts
  `Choose your learning path` (Sprint 33 phrasing)
  alongside the previous `Choose your path`.
- Sprint 16 ContentPageShell guard now exempts
  `/docs/platform-positioning` — it is a bespoke
  positioning page driven by `PageShell` directly,
  not by the `lib/content.ts` registry.

**Audience policy.** The platform never declares a
winner, ranks models, certifies compliance, guarantees
SEO outcomes, or asserts production readiness — the
`AudienceDoesNotPromise` callout on every audience
page spells this out per audience, and dedicated
integrity guards scan the `automation-specialists` and
`governance-teams` slices specifically for the most
likely overclaiming language.

**Sprint 34 — content depth + teaching examples.**
Sprint 34 raises the teaching quality on every existing
surface without adding new routes. The product loop
stays Learn → Apply → Verify → Test; the surfaces
behind it become more useful.

Five new server-rendered components in
`apps/models/components/learn/`:

- `TeachingExample` — generic, illustrative scenario
  that names the verified fields the reader should
  inspect next. Always labelled "Illustrative — not a
  recommendation."
- `BadBetterExample` — two-column weak-vs-better
  comparison with a why-better explanation.
- `ArtifactExample` — paste-ready Markdown excerpt
  rendered in a non-executable `<pre>` block.
- `WorkflowBridge` — concept → workflow connector with
  four numbered tiles (learn / apply / verify / test).
- `ReviewChecklist` — non-interactive checklist with
  optional caution + next-route footer.

All five components are server components with no
client state — no persistence, no progress tracking.

The five existing registries gain optional teaching
fields:

- `lib/lessons.ts` — `teachingExample`,
  `badBetterExample`, `artifactExample`,
  `workflowBridge`, `reviewChecklist`. All 10 lessons
  populated. Rendered by `LessonLayout` under the body.
- `lib/learning-exercises.ts` — `commonMistake`,
  `artifactExample`, `repeatWhen`, `reviewChecklist`.
  All 8 exercises populated. Rendered by
  `ExerciseLayout` under the body.
- `lib/lab-playbooks.ts` — `weakTestExample`,
  `strongerTestExample`, `observationRubric` (rows
  with `dimension` / `whatToLookFor` / `whatToRecord`,
  no scoring vocabulary), `briefNote`. All 6 playbooks
  populated. Rendered on `/lab/[slug]` under the
  existing outputs section.
- `lib/evaluation-prompts.ts` — `matrixUsageNote`,
  `doNotConclude`, `rerunWhen`. All 6 prompt sets
  populated. Rendered on `/lab/prompts/[slug]` under
  the comparison-notes section.
- `lib/audiences.ts` — `exampleSituation`,
  `bestStartingPoint`, `artifactWalkthrough`. All 4
  audiences populated. Rendered on `/for/[slug]`
  under the hero and inside the body.

The homepage "What you can produce here" section is
reframed as "See what you will produce" with a new
4-tile grid that links the example decision brief,
the evaluation plan template, the prompt test matrix
template, and the audience walkthroughs — preserving
the existing 6-tile "open the surface" grid below.

No new routes; `ROUTE_SET_VERSION` stays at
`content-v15`. Ten new integrity guards enforce:

1. The 5 teaching components exist.
2. `LessonLayout` references each of the 5 teaching
   components.
3. All 10 lessons carry `teachingExample` +
   `badBetterExample` + `workflowBridge`.
4. All 8 exercises carry `commonMistake` +
   `artifactExample`.
5. All 6 lab playbooks carry `weakTestExample` +
   `strongerTestExample` + `observationRubric` +
   `briefNote`.
6. Observation-rubric blocks contain no scoring
   vocabulary (`assign/give/compute a score`,
   `rating/grade of`, `pass/fail score`). Disclaimer
   prose elsewhere in the registry stays readable —
   the guard scopes to `observationRubric` blocks
   specifically.
7. All 6 prompt sets carry `matrixUsageNote` +
   `doNotConclude` + `rerunWhen`.
8. All 4 audiences carry `exampleSituation` +
   `artifactWalkthrough` + `bestStartingPoint`.
9. The 5 teaching components themselves contain no
   banned phrasing (`best model is/for`,
   `is the winner`, `cheapest/fastest <noun>`,
   `guaranteed to <verb>`,
   `certified for/compliant/by`,
   `is production ready`, `compliance approved`,
   `rank #1`).
10. OpenAI no-metrics re-checked on the 5 teaching
    components.

**Teaching example policy.** Every illustrative
example is generic, uses fictional values where
specific (Aurora release, Atlas provider, INV-2099
invoice), and is rendered with an "Illustrative — not
a recommendation" label. The catalogue never produces
the artifact for the reader — the example shows the
shape; the reader substitutes their own values when
they walk the workflow.

**Observation rubric policy.** Lab observation
rubrics list what to look at and what to record per
dimension. They contain no aggregate score, no
rating, no pass/fail percentage. Per-prompt outcomes
travel into the brief as observations, not as a
collapsed number — keeping the evidence the reviewer
reads honest.

**Artifact walkthrough policy.** Audience pages list
per-artifact instructions (open this route, capture
this output, paste into the brief). The walkthroughs
never imply that following them produces a "correct"
model choice — they describe the shape of the
evidence, not its conclusion.

**Sprint 38 — guided onboarding + Start Here
experience.** Sprint 38 adds a first-run entry
point for cold visitors. The /start hub presents
three independent entry shapes — by role, by
goal, and by artifact — and every choice opens an
existing surface. No accounts, no quiz scoring,
no personalization, no client-side state, no
progress tracking, no model recommendations.

[`lib/onboarding.ts`](apps/models/lib/onboarding.ts)
is the registry. Public API: `onboardingPaths`,
`onboardingGoals`, `onboardingArtifacts`,
`getOnboardingPath`, `getOnboardingPaths`,
`getOnboardingRoutes`.

Five role paths ship:

- `beginner` (no prerequisites, ~90 min, lands on
  `/learn/path/beginner`).
- `developer` (~180 min, ends at the developer
  evaluation kit).
- `product` (~150 min, ends at the product
  selection kit).
- `automation` (~200 min, ends at the automation
  workflow testing kit).
- `governance` (~200 min, ends at the governance
  review kit).

Each `OnboardingPath` carries: `slug`, `title`,
`summary`, `audienceLabel`, `firstStep`,
`estimatedMinutes`, an `orientation` block with
four lines (learn / practise / test / produce),
a `startRoutes` block (learning path + first
lesson + first exercise + optional lab playbook
+ optional kit + a filtered resource-finder
view), an `artifacts[]` list, and an explicit
`doesNotPromise[]` list.

The goal cards route at the resource-finder
goal filters: `learn-basics`,
`choose-model-candidates`,
`test-model-behaviour`,
`test-automation-workflow`,
`prepare-governance-review`, `document-evidence`.
The artifact cards route at the resource-finder
artifact filters: `shortlist-url`,
`comparison-url`, `decision-brief`,
`external-test-plan`, `prompt-test-matrix`,
`source-freshness-checklist`, and a kit
shortcut at `resourceType=workflow-kit`.

Six new server-rendered components in
`apps/models/components/onboarding/`:

- `StartRoleCard` — role card on the hub.
- `StartGoalGrid` — "What are you trying to do?"
  cards that each open a filtered finder view.
- `StartArtifactGrid` — "What do you want to
  produce?" cards.
- `StartPathSummary` — three-minute orientation
  block on each role detail page.
- `StartRouteList` — numbered first-route list
  with lesson + exercise + (optional) lab + kit
  + resource finder.
- `StartPolicyNote` — shared "How Start Here
  works" callout (no accounts, no quiz, no
  tracking, no personalization, no model
  recommendations).

[`/start`](apps/models/app/start/page.tsx) is the
hub. Sections: three primary entry tiles
(role / finder / beginner path), the role grid,
the goal grid, the artifact grid, the policy
note, and a related-routes aside. JSON-LD:
`BreadcrumbList` + `CollectionPage`.

[`/start/[slug]`](apps/models/app/start/%5Bslug%5D/page.tsx)
prerenders the five role detail pages.
`generateStaticParams()` pulls from
`getOnboardingPaths()`. Each page renders: at-a-
glance card, three-minute orientation, first-
route list, artifact grid, `doesNotPromise`
list, the shared policy note, primary +
secondary next-step CTAs, and a back-to-Start
aside. JSON-LD: `BreadcrumbList` +
`TechArticle`.

Hero now leads with "New here? Start here" as
the primary CTA. "Choose your learning path"
moves to secondary; "Start beginner path" stays
tertiary. The Sprint 26 Hero-CTA guard still
passes because the page retains the "Choose
your learning path" string.

Primary nav adds `Start` at the front.
`Select`, `Compare`, and `Briefs` are removed
from the nav — they are now reachable through
the Start Here flow + the resource finder.
`Resources` and `Kits` move into the nav.
SiteFooter gains a new `Start` column above
`For`; footer grid grows from 7 → 8 columns at
lg.

`/learn`, `/for`, `/resources`, `/lab`,
`/kits`, `/demos`, and `/briefs/build` each
gain a Start Here link in their
related-routes asides.

`/api/site` exposes `startHub` (the canonical
URL) and `startPaths[]` (the five role detail
URLs).

`ROUTE_SET_VERSION` bumps to `content-v19`.
Eleven new integrity guards enforce: registry
has the 6 required exports, all five role slugs
registered, 6 components exist, hub + dynamic
detail page exist with the right component
wiring, registry uses every filtered
`/resources?goal=` + `/resources?artifact=`
href, no quiz/scoring/personalization/account
language, no ranking/recommendation/guarantee
phrasing, homepage + 7 surfaces + footer link to
`/start`, primary nav includes `/start`, no
OpenAI metrics, and route contract + sitemap +
llms.txt + smoke + indexing advertise all six
onboarding routes.

Sprint 38 ships no new mutable data and no new
verified-field claims. The verified-data
backbone established in Sprint 35 remains the
truth.

**Sprint 37 — resource finder + learning graph
navigation.** Sprint 37 makes the platform easier
to navigate by adding a single resource finder
and a long-form resource map that explains how
every product surface fits together. No new
verified-field claims, no new mutable data — just
a navigation layer over what already shipped.

[`lib/resource-graph.ts`](apps/models/lib/resource-graph.ts)
is the registry. It pulls titles, descriptions,
hrefs, difficulty, and estimated-minutes live
from every existing source registry — lessons,
exercises, learning paths, lab playbooks, lab
templates, evaluation prompt sets, workflow kits,
outcomes, audiences, guided demos — and adds a
tag layer that only lives in the graph file:
`type`, `stage`, `audiences[]`, `goals[]`,
`artifacts[]`, `related[]`. Authored entries for
the live workspaces (`/select`, `/compare/build`,
`/briefs/build`), the example brief
(`/examples/decision-brief`), and the verification
surfaces (`/sources`, `/coverage`,
`/reverification`) round out the graph.

Public API: `getResourceGraph`,
`getResourceNode`, `getResourcesByStage`,
`getResourcesByAudience`, `getResourcesByGoal`,
`getResourcesByArtifact`, `filterResources`,
`getResourceFinderSummary`, `getNextStepGroups`.

Six new server-rendered components in
`apps/models/components/resources/`:

- `ResourceCard` — single-resource summary card
  with type / stage eyebrow + artifact chips.
- `ResourceFilterBar` — six filter groups
  rendered entirely as GET links; "Reset all
  filters" link clears every filter at once.
- `ResourceStageMap` — Learn → Apply → Verify →
  Test → Package strip with per-stage counts +
  filtered links.
- `NextStepPanel` — "I want to…" cards that each
  land on a pre-filtered finder view.
- `ResourceSummaryCards` — total + per-stage
  count tiles.
- `RelatedResourceGrid` — reusable on other
  surfaces; resolves nodes by id and silently
  drops unknown ones so it stays safe.

[`/resources`](apps/models/app/resources/page.tsx)
is the finder hub. Filters supported via query
string: `audience`, `goal`, `resourceType`,
`stage`, `artifact`, `difficulty`. The base URL
is indexable; any query-string combination is
`noindex, follow` with canonical `/resources`.
The page renders the summary cards, the
NextStepPanel, the stage map, the filter bar,
the per-stage grouped results, the policy note,
and a related-routes aside. JSON-LD:
`BreadcrumbList` + `CollectionPage`.

The Sprint 24 `FILTERED_KEYS` allow list in
`lib/should-index.ts` grows by six entries
(`audience`, `goal`, `resourceType`, `stage`,
`artifact`, `difficulty`) so the existing
`isFilteredRoute()` helper recognises every
finder filter and flips `robots` to `noindex,
follow` automatically — same pattern used by
`/models`, `/pricing`, `/sources`,
`/reverification`, `/select`, `/compare/build`,
and `/briefs/build`.

[`/docs/resource-map`](apps/models/app/docs/resource-map/page.tsx)
is the long-form companion. It uses
`<ContentPageShell>` from the existing docs
chrome and is registered in `lib/content.ts` so
the sitemap + llms.txt pickup is automatic.
Sections: what the graph is, the product loop,
the resource types, how to choose the next step,
how audiences / outcomes / kits / lab tools
connect, what the platform does not decide.

Integrations:

- Homepage adds a "Find your next step" section
  above the popular outcomes with four
  quick-filter cards (developers, test model
  behaviour, decision brief, review sources).
- `/for` adds the finder to the related
  references aside.
- `/for/[slug]` adds an audience-filtered finder
  link.
- `/learn` adds a "Resource finder shortcut"
  aside that also points at the resource map.
- `/lab`, `/kits`, `/use-cases`, `/demos` each
  gain a stage- or type-filtered finder entry in
  their related-routes asides.
- SiteFooter gains a new "Find" column with the
  finder, the resource map, four audience
  filters, and a decision-brief artifact filter.
  Footer grid expands from 6 to 7 columns at lg.

`/api/site` exposes `resourceFinder` and
`resourceMap`.

`ROUTE_SET_VERSION` bumps to `content-v18`. Nine
new integrity guards enforce: registry has the 9
required exports, graph spans every source
registry + carries all ten tag-prefix kinds, 6
resource components exist, `/resources` page
exists + wires `isFilteredRoute` +
`robotsMetadata` + the new FILTERED_KEYS allow
list, `/docs/resource-map` uses
`<ContentPageShell>` + is registered in
`lib/content.ts`, the nine surfaces above link
to `/resources` with the right pre-filter query
string, no
ranking/recommendation/guarantee phrasing on
resource surfaces, no OpenAI metrics, and route
contract + sitemap + llms.txt + smoke +
indexing all advertise `/resources` +
`/docs/resource-map` with a filtered
`/resources?audience=developers` URL exercised
in production indexing QA.

**Sprint 36 — outcome use cases + product-led
learning entry points.** Sprint 36 layers
outcome-driven landing pages onto the existing
catalogue. Each outcome names the problem the
reader is trying to solve, lists who it is for,
routes the reader through the existing
Learn → Apply → Verify → Test → Package surfaces,
and ends by naming the Markdown artifacts the
reader will leave with. No new product surfaces —
outcome pages are entry points, not parallel UI.

[`lib/outcome-use-cases.ts`](apps/models/lib/outcome-use-cases.ts)
is the single source of truth. The registry exports
`outcomeUseCases`, `getOutcomeUseCase`,
`getOutcomeUseCases`, and
`getOutcomeUseCaseRoutes`.

Six outcomes ship:

- `ai-model-evaluation-for-developers` — engineer
  preparing an integration.
- `ai-model-selection-for-product-teams` — product
  manager / technical buyer aligning with finance
  + legal.
- `ai-automation-testing` — automation builder /
  SEO operator / technical consultant.
- `ai-model-governance-review` — risk / compliance
  reviewer preparing internal approvals.
- `llm-prompt-evaluation` — teams comparing models
  on faithful behaviour rather than benchmark
  headlines.
- `structured-output-testing` — engineers wiring
  the model into a parser-dependent automation.

Each `OutcomeUseCase` declares `slug`, `title`,
`headline`, `summary`, optional `audienceSlug`,
`problem`, `whoThisIsFor`, `whatToLearn`,
`exercises`, `labPlaybooks`, `promptSets`,
`workflowKits`, `evidenceArtifacts`,
`suggestedWorkflow` (step / label / href /
output), and `doesNotPromise`. Every resource
entry points at a route that already exists — no
parallel UI, no duplicated content.

Five new server-rendered components in
`apps/models/components/outcomes/`:

- `OutcomeUseCaseCard` — summary card with eyebrow,
  title, headline, artifact chips, CTA.
- `OutcomeWorkflow` — numbered vertical workflow
  strip; each step opens an existing route.
- `OutcomeResourceGrid` — five-column grid for
  what-to-learn / exercises / lab playbooks /
  prompt sets / workflow kits.
- `OutcomeArtifactList` — chip list of evidence
  artifacts the reader produces.
- `OutcomePolicyNote` — shared "what outcome pages
  do not promise" callout.

A shared `OutcomePage` component renders the full
detail page from a registry entry; the six
[`/use-cases/<slug>`](apps/models/app/use-cases/)
folders contain thin static pages that call
`getOutcomeUseCase()` and render through it.
JSON-LD: `TechArticle` + `BreadcrumbList` + `HowTo`
with `HowToStep` per workflow step.

Flow integrations:

- Homepage adds a new "Popular outcomes" section
  above the audience picker.
- `/use-cases` hub adds an "Outcome-driven
  workflows" section above the existing detailed
  use-case cards.
- `/for/[slug]` surfaces a matching outcome card
  when the outcome's `audienceSlug` matches.
- `/learn` adds an "Outcome shortcuts" aside.
- `/lab`, `/kits`, `/demos` related-routes asides
  link to outcome pages.
- SiteFooter Workflow column adds six outcome
  entries.

`/api/site` exposes `outcomeUseCasesHub` and
`outcomeUseCases[]`.

`ROUTE_SET_VERSION` bumps to `content-v17`. Eight
new integrity guards enforce: registry has the 4
required exports, all 6 outcome slugs registered,
the 5 outcome components exist, the 6 outcome
detail pages exist, homepage + `/for/[slug]` +
`/learn` + `/lab` + `/kits` + `/demos` + footer
link to outcomes, no
ranking/recommendation/guarantee phrasing on
outcome surfaces (scoped to strip every
`doesNotPromise:` array before scanning so the
explicit disclaimers in the registry stay
readable), no OpenAI metrics, and route contract
+ sitemap + llms.txt + smoke + indexing advertise
all six outcome page routes.

Sprint 36 ships no new mutable data and no new
verified-field claims. Every numeric and source
claim already verified by Sprint 35 remains the
truth.

**Sprint 35 — applied workflow kits + Markdown work
documents.** Sprint 35 fuses paths, lessons,
exercises, lab playbooks, prompt sets, and templates
into four practical **workflow kits** the reader can
follow and export as a single Markdown work
document. The product loop stays
Learn → Apply → Verify → Test; the kit is the work
document that walks one full pass through it.

[`lib/workflow-kits.ts`](apps/models/lib/workflow-kits.ts)
is the single source of truth. The registry exports
`workflowKits`, `getWorkflowKit`, `getWorkflowKits`,
`getWorkflowKitRoutes`,
`getWorkflowKitsByAudience`, and
`workflowKitToMarkdown`.

Four kits ship, one per audience:

- `developer-model-evaluation` — engineer preparing
  an integration (~180 min, 8 steps).
- `automation-workflow-testing` — automation builder
  / SEO operator / technical consultant (~200 min,
  9 steps).
- `product-model-selection` — product manager /
  technical buyer (~180 min, 7 steps).
- `governance-review` — risk / compliance reviewer
  (~200 min, 9 steps).

Each `WorkflowKit` declares: `audienceSlug` (links
to `/for/<slug>`), `goal`, `whatYouWillProduce`,
`prerequisites`, sequenced `workflow` (step / title
/ instruction / route / output),
`requiredLessons[]`, `requiredExercises[]`,
`requiredPlaybooks[]`, `requiredPromptSets[]`,
`requiredTemplates[]`, `finalChecklist`,
`evidenceRoutes`, and `doesNotPromise`. Lists
resolve live against the underlying registries — a
rename in `lessons.ts` or `learning-exercises.ts`
flows through to the kit page automatically.

Five new server-rendered components in
`apps/models/components/kits/`:

- `WorkflowKitCard` — audience + difficulty + minutes
  + step count + artifact chips.
- `WorkflowKitTimeline` — numbered sequenced steps
  with route link + per-step output.
- `WorkflowKitResourceGrid` — five-column grid that
  resolves lesson titles, exercise titles, playbook
  titles, prompt set titles, and template titles
  from the respective registries.
- `WorkflowKitChecklist` — non-interactive final
  checklist with no persistence.
- `WorkflowKitPolicyNote` — shared "what kits do not
  promise" callout.

[`/kits`](apps/models/app/kits/page.tsx) hub renders
the four kit cards + framing + policy note.
`CollectionPage` JSON-LD enumerates each kit as
`HowTo`.

[`/kits/[slug]`](apps/models/app/kits/%5Bslug%5D/page.tsx)
dynamic route prerenders the four detail pages.
Each page renders the at-a-glance card, matching
audience link, goal, artifacts, prerequisites,
export link, sequenced timeline, resource grid,
final checklist, evidence routes, per-kit "does not
promise" list, and the shared policy note. JSON-LD:
`TechArticle` + `BreadcrumbList` + `HowTo` with
`HowToStep` per workflow step.

[`/api/kits/[slug]`](apps/models/app/api/kits/%5Bslug%5D/route.ts)
endpoint exports each kit as `text/markdown;
charset=utf-8` with `X-Robots-Tag: noindex` and
`Cache-Control: public, max-age=300, s-maxage=300`.
Uses `force-static` + `generateStaticParams()` —
four endpoints prerendered. Pure local derivation:
no fetch, no env, no Date.now, no user input.

Flow integrations:

- Homepage adds a new "Start with a workflow kit"
  section directly above the audience picker.
- `/for/[slug]` audience pages call
  `getWorkflowKitsByAudience()` and surface the
  matching kit inline.
- `/lab`, `/demos`, `/briefs/build` callouts now
  point to `/kits`.
- `/learn/paths` policy aside notes the kit option.
- `/learn/path/[slug]` adds a "Use this path inside
  a kit" callout with the matching-kit lookup
  table.
- SiteFooter Workflow column adds `Kits`.

`/api/site` exposes `workflowKitsHub`,
`workflowKits[]`, and `workflowKitEndpoints[]`.

`ROUTE_SET_VERSION` bumps to `content-v16`. Eleven
new integrity guards enforce: registry exists with
all 6 required exports, all 4 kit slugs registered,
the 5 kit components exist, `/kits` + dynamic
`/kits/[slug]` exist, export endpoint contract
correct (`X-Robots-Tag: noindex` +
`text/markdown` + `workflowKitToMarkdown()` + no
`Date.now` / `process.env` / `fetch`), homepage +
`/lab` + `/demos` + `/briefs/build` + footer link
to `/kits`, `/for/[slug]` calls
`getWorkflowKitsByAudience()`, no
ranking/recommendation/guarantee phrasing on Sprint
35 kit surfaces, `governance-review` kit contains
no compliance certification phrasing,
`automation-workflow-testing` kit contains no SEO
ranking guarantee phrasing — both kit-slice guards
strip the `doesNotPromise:` array before scanning
so disclaimer prose stays readable, OpenAI
no-metrics re-checked, and route contract + sitemap
+ llms.txt + smoke + indexing advertise all 5 page
routes + 4 API endpoints.

**Workflow kit policy.** Kits package existing
surfaces — they never duplicate UI, never assert a
ranking, never recommend a model. Markdown exports
are static work documents that inherit retrievedAt
metadata from the underlying citations, not
invoiceable quotes. A filled-in kit is evidence the
planning + testing work was done — never a
certification, never a production sign-off, never a
guarantee of automation reliability, SEO outcomes,
or compliance approval.

- **Mistral Large 3** (`mistral-large-2512`, alias `mistral-large-latest`)
  — Sprint 16 expansion. Mistral moved per-model spec cards from
  `/getting-started/models/<slug>` to `/models/model-cards/<slug>`,
  unblocking automated retrieval. Verified context window 256k; pricing
  $0.5 input / $1.5 output per 1M tokens. Max output tokens and explicit
  modality channel list still not stated on the spec card and remain
  null.

- **DeepSeek V4 Pro** (`deepseek-v4-pro`) — current generation
  reasoning model. The pricing table records the regular rate as the
  durable canonical value (input cache-miss $1.74, cache-hit $0.0145,
  output $3.48 per MTok). DeepSeek is running a time-limited 75%
  promotional discount on v4-pro until 2026/05/31 15:59 UTC; the
  discounted effective rate is captured per pricing row's `notes`.
  Context window verified as 1M tokens; max output, modality, and
  knowledge cutoff remain `null` (not exposed on the pages retrievable
  from this environment).

_(Mistral Large 3 was promoted to fully verified during Sprint 16 — see
the entry above. Mistral's spec card moved to the new
`/models/model-cards/<slug>` URL pattern and is now accessible to
automated retrieval. Max output and explicit modality channels remain
null because the spec card describes the model as 'multimodal' without
enumerating them.)_

Historical / partially-verified entries (`deepseek-r1`, `mistral-large-2`):
historical catalogue entries with verified lifecycle status only.

- **DeepSeek R1-0528 (historical)** (`deepseek-r1`) — anchored to the
  R1-0528 release announcement (`api-docs.deepseek.com/news/news250528`).
  R1 is no longer in the current chat-completions `model` parameter set
  (which is `[deepseek-v4-flash, deepseek-v4-pro]`), so lifecycle is
  recorded as `retired` with `deepseek-v4-pro` as the migration target.
- **Mistral Large 2 (retired)** (`mistral-large-2`) — Mistral's models
  overview Legacy/Deprecated table records it as deprecated 2024-11-30
  and retired 2025-03-30. Lifecycle is recorded as `retired` with
  `mistral-large-3` as the migration target. No pricing, context window,
  or modality data is republished here.

Other unverified catalogue entries (`gpt-5`, `llama-4-scout`):
structural entries only.

OpenAI's docs (platform.openai.com) currently block automated retrieval
(HTTP 403). Verifying GPT-5 against the OpenAI documentation page
requires the **Manual vendor verification workflow** below.

---

## Server filter and entity-graph policy

The hub pages (`/models`, `/pricing`, `/compare`, `/sources`) accept
GET filter parameters and render filtered results server-side.

- **No client-side filtering library.** Filters submit to the same
  route via a plain `<form method="get">`. Results stay crawlable.
- **Canonical stays the base URL.** A filtered URL is `noindex,
  follow`; the unfiltered base URL is `index, follow`. The decision
  flows through `isFilteredRoute(searchParams)` in
  `lib/should-index.ts` and `robotsMetadata(!filtered)` in each hub's
  `generateMetadata()`.
- **Filtered URLs never emit a different canonical.** They share the
  base canonical so search engines de-duplicate naturally; `noindex,
  follow` ensures the filter facets do not pollute the index.
- **No pricing amount is rendered outside the verified pricing helpers.**
  Filtered pricing rows go through `<VerifiedField>` /
  `<DataNotVerified>` like every other pricing render.
- **Comparison hub never declares a winner.** Filtering by indexability
  is allowed; filtering by "best" is not a category.

Entity-graph helpers in `apps/models/lib/entity-graph.ts` provide
cross-entity navigation (model → provider, model → comparisons, model
→ citations, provider → status observer, summary counts). Helpers
MUST:

- Be pure functions over the typed local data layer.
- Never call `fetch()` or read `process.env`.
- Never synthesise verified claims — if the underlying field is
  unverified, the helper exposes `null` and the renderer decides
  whether to surface `<DataNotVerified>`.

Breadcrumbs and `BreadcrumbList` JSON-LD are emitted on every detail
page (model, provider, comparison) and on hub pages. The visible
trail and the structured-data trail both flow through `breadcrumbJsonLd()`
and the `<Breadcrumbs>` component, so they cannot drift apart. The
trail uses absolute canonical URLs.

---

## Status monitoring policy

Vendor-reported status, independent HTTP probes, and computed uptime
windows are three different signals and WebmasterID Models keeps them
strictly separate.

- A **vendor-reported status observation** is a single, timestamped read
  of the provider's own public status page or feed. The provider is
  reporting on themselves. Every UI surface that renders one must label
  it "Vendor-reported status observed by WebmasterID."
- An **independent HTTP probe** is an HTTP request issued by
  WebmasterID against the vendor's API. The result is an observation
  whose source is `independent_http_probe`. Independent probes are NOT
  YET ENABLED.
- A **computed uptime window** is a derived metric over durable
  observations. Until WebmasterID writes observations to durable
  storage over a meaningful window AND that window contains at least
  `MINIMUM_OBSERVATIONS_FOR_UPTIME` observations (currently 24 — see
  [`lib/status-store.ts`](apps/models/lib/status-store.ts)), no uptime
  percentage is exposed. A single observation cannot prove
  availability.
- Even when the gate passes, the exposed `uptimePercentage` is the
  share of stored observations whose vendor-reported status was
  `operational`. It is a **vendor-reported operational-sample rate**,
  not an independently-measured availability percentage. The `/status`
  page itself does not display this number; only the
  `/api/status/<slug>/window` endpoint exposes it, always alongside an
  explicit `policyNote`.
- **No SLA claims.** Nothing on `/status` or in `/api/status/*` should
  be read as a service-level commitment, availability guarantee, or
  substitute for the provider's own status communication.
- **Probe wall-clock time is not API latency.** The `latencyMs` field
  on a `StatusObservation` is the wall-clock time of the fetch we made
  to the status source. It must never be relabelled as API latency, on
  any page or in any response payload.

Adding a new observer:

1. Implement a `StatusObserver` in `apps/models/lib/observers/<slug>.ts`
   — for vendor feeds, follow the Anthropic / Google pattern; for
   independent probes, use `createHttpProbeObserver()` from
   `lib/observers/http-probe.ts` with a **public, non-inference,
   non-billing** URL.
2. Set the `source` field explicitly (`vendor_status_api` /
   `vendor_status_page` / `independent_http_probe`).
3. Register it in `apps/models/lib/observers/index.ts`.
4. Add a primary-source citation in `apps/models/data/citations.ts`.
5. Update the "Status observation coverage" panel on `/coverage`.
6. Surface the citation in the Status monitoring sources section of
   `/sources`.

Probe safety rules (enforced by the integrity guard suite):

- Probes are unauthenticated. No `Authorization` header, no `api_key`,
  no bearer token of any kind.
- Probes never call inference endpoints (`/v1/messages`,
  `generateContent`, `/chat/completions`, `/embeddings`,
  `/audio/{speech,transcriptions}`, `/images/{generations,edits}`).
- Probes target host roots, public docs, or other non-billing
  surfaces. Reachability-only signals.
- Probes are scheduled only by the hourly cron — never invoked from
  request handlers.
- Probe `latencyMs` is wall-clock fetch time. It is never relabelled
  as API latency on any page or in any response payload.
- Probe-success rate is a reachability signal, not API uptime. UI
  copy must say so explicitly.

---

## Entity detail page discipline

Model, provider, and comparison detail pages each render four
standard surfaces in addition to their entity-specific content:

- `EntityActionRail` — verb-led actions. Banned copy: "Get started",
  "Start now", "Best model", "Choose winner", "Official partner",
  "Trusted by OpenAI", "Maximize AI performance". Integrity guard:
  *"no detail page uses salesy CTA copy"*.
- `EntityMethodologyLinks` — link rail to research + docs methodology.
  Integrity guard: *"every detail page renders methodology links"*.
- `EntityDataGaps` (model + provider) — honest list of null/unverified
  fields computed from the entity record at render time. The
  component renders nothing if there are no gaps; the integrity guard
  only requires presence in the JSX, so a fully verified record still
  passes silently.
- `EntityVerificationChecklist` (model only) — "X of Y fields verified"
  driven by `isVerified()` on each field. No checkmark is hand-
  asserted; the integrity guard verifies the component is present and
  the checklist is sourced from the entity record.

These four guarantees plus the existing breadcrumb + JSON-LD + source
trail surface mean every detail page has the same source-discipline
chrome regardless of which entity it represents.

---

## Content pages

Research guides and reference docs (`/research`, `/docs`) follow the
same verification discipline as the entity catalogue:

- Pages may explain methodology and reference schemas freely. They
  may cite verified facts from the catalogue (e.g. "Claude Opus 4.7
  has a 1M-token context window") because those facts already trace
  to a source citation.
- Pages may NOT introduce new claims about a specific model /
  provider / pricing row that are not already verified in the data
  layer. If a page wants to say something specific that is not yet
  verified, it must frame it as methodology, not a claim — e.g.
  "Mistral pricing requires a manual browser pass" is acceptable
  because it describes our retrieval state; "Mistral Large 3 costs X"
  is not.
- Pages must not introduce new banned phrases. Integrity guard:
  "no content page contains forbidden marketing phrasing" — checks
  for "best AI model", "guaranteed uptime", "real-time uptime
  percentage", "official partner", "trusted by OpenAI".
- Every page is registered in `apps/models/lib/content.ts` with
  slug, title, description, related routes, keywords, indexability,
  and JSON-LD type. The hubs (`/research`, `/docs`), sitemap,
  llms.txt, and `/api/site` all read from this registry; the
  integrity guards verify the registry and the route tree stay in
  sync.

---

## Manual vendor verification workflow

For vendors whose documentation cannot be retrieved by the automated
`WebFetch` pipeline (the script the verification helpers ship with), use
this manual browser-based pass.

### When to use it

- Vendor docs return HTTP 401/403/429 to non-interactive clients
  (currently: OpenAI's `platform.openai.com`).
- Vendor docs require JavaScript / hydration to expose factual content.
- The page is heavily SPA-rendered and HTML scraping misses values.

### Step-by-step

1. **Open the source in a real browser.** Sign in to the vendor's
   developer console if the page is gated. Treat the URL bar as the
   citation source — do not trust mirrors, cached copies, or
   third-party listings.
2. **Capture URLs and the retrieval timestamp.** Record each URL you
   used (model docs, pricing, API reference, deprecations, status page).
   Record the ISO-8601 datetime as `retrievedAt` — this is the moment
   you visually confirmed the value, not the moment you committed code.
3. **(Optional) screenshots.** If a vendor page is likely to disappear
   or change, keep a screenshot locally — but do **not** commit it to
   the repository unless absolutely necessary; primary sources should
   be cited by URL, not by mirrored image.
4. **Field-by-field checklist.** For the target model, work through:
   canonical API ID, aliases, lifecycle (active/preview/deprecated/
   retired), context window (input), max output, supported modalities
   (input + output), knowledge cutoff, pricing (base input/output,
   cache write/read, batch input/output), supported features
   (extended/adaptive thinking, priority tier, vision, tool use,
   structured output, function calling, code execution, grounding),
   platform availability (first-party API + Bedrock/Vertex if listed).
   For each non-null field, capture: value, citation URL, citation
   page name, source type.
5. **Citation rule.** Each captured fact must trace to **one specific
   URL** on the vendor's own domain. No secondary summaries, blogs,
   social posts, leaderboard sites, or AI-generated summaries (including
   `WebSearch`-tool result summaries).
6. **Encode in source.**
   - Add a citation to `apps/models/data/citations.ts` with `url`,
     `name`, `type` (one of the allow-listed `SourceType` values),
     `retrievedAt`, and `notes`.
   - Wrap each value with `verified(value, citation, { notes })` in
     `apps/models/data/models.ts`.
   - Leave every field that the docs do not explicitly state as
     `null`. Do not infer.
7. **Run `npm run validate`.** The build refuses to ship if any
   `verified()` call has a malformed citation. The integrity guard
   refuses to ship if a hardcoded unverified-data label appears outside
   the allow-list.
8. **Re-verification cadence.** The same cadence rules apply to
   manually verified rows: pricing every 30 days, lifecycle every 30
   days, context/output/modality every 90 days, benchmarks only when a
   new primary-source publication lands.

### What is not a primary source

- AI assistant search results / AI-generated summaries (including
  `WebSearch` result summary text).
- Mirror sites, leaderboard aggregators, model directories.
- Blog posts and announcement / news pages (including vendor blog posts
  — they are vendor announcements, not vendor specifications).
- Tweets / X / Reddit / LinkedIn / Discord.
- Wikipedia.
- Cached / archived copies that the vendor has since updated.

If the only place a value appears is one of the above, the value stays
`null` and the field renders the canonical unverified-data label.

---

## Verification attempts log

The structured machine-readable record lives in
[`apps/models/data/verification-attempts.ts`](apps/models/data/verification-attempts.ts)
and is surfaced on [`/coverage`](https://models.webmasterid.com/coverage).
The same entries are echoed on each provider page so a reader can see
exactly what was attempted, when, and what came back.

### Sprint 5 / 6 / 7 OpenAI status

OpenAI verification has been attempted at every sprint since Sprint 5
and the same outcome recurs:

| URL targeted | Sprint | Result |
| --- | --- | --- |
| `https://platform.openai.com/docs/models/gpt-5` | 5, 7 | HTTP 403 |
| `https://platform.openai.com/docs/pricing` | 5, 7 | HTTP 403 |
| `https://platform.openai.com/docs/models` | 5, 7 | HTTP 403 |
| `https://openai.com/api/pricing` | 5, 7 | HTTP 403 |

No automated-retrieval path is currently available. Resolving the gap
requires the **Manual vendor verification workflow** above — a human
opens the docs in a real browser, captures the values verbatim, and
records each value with a citation using `verified()`. Until that pass
happens, the OpenAI catalogue entry stays unverified and the
`/compare/gpt-5-vs-claude-opus-4` page remains one-sided.

### Sprint 7 brand-asset review

A parallel question was studied this sprint: can any provider's logo
be safely upgraded from the internally authored lettermark to the
vendor's official mark? See
[`BRAND_ASSETS.md → Sprint 7 brand-asset review log`](BRAND_ASSETS.md)
for the per-provider findings. The current sprint's conservative
outcome was to upgrade none of them and to record the reasoning rather
than to ship an asset whose license terms had not been independently
read in a browser.
