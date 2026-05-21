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

- **DeepSeek V4 Pro** (`deepseek-v4-pro`) — current generation
  reasoning model. The pricing table records the regular rate as the
  durable canonical value (input cache-miss $1.74, cache-hit $0.0145,
  output $3.48 per MTok). DeepSeek is running a time-limited 75%
  promotional discount on v4-pro until 2026/05/31 15:59 UTC; the
  discounted effective rate is captured per pricing row's `notes`.
  Context window verified as 1M tokens; max output, modality, and
  knowledge cutoff remain `null` (not exposed on the pages retrievable
  from this environment).

Partially verified Mistral models (only API string + lifecycle):

- **Mistral Large 3** (`mistral-large-3`, alias `mistral-large-latest`).
  Listed in the Mistral models overview as v25.12, Open weights,
  multimodal. The per-model spec card page returned 404 to automated
  retrieval; context window, max output, explicit modalities, and
  pricing remain `null` and render the canonical unverified-data
  label. A manual browser pass against the individual model card is
  the unblock.

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
