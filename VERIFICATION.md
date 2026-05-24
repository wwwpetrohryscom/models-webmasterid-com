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
