# Brand assets policy

## WebmasterID Models logo (first-party)

Status: internally authored. Not a third-party provider mark.

- **Component:** [`apps/models/components/Logo.tsx`](apps/models/components/Logo.tsx) — variants `full`, `mark`, `compact`, `mono`.
- **Static files:** [`apps/models/public/logo.svg`](apps/models/public/logo.svg) (full lockup), [`apps/models/public/logo-mark.svg`](apps/models/public/logo-mark.svg) (icon only), [`apps/models/public/logo-mono.svg`](apps/models/public/logo-mono.svg) (single-colour, uses `currentColor`).
- **Favicon:** [`apps/models/app/icon.svg`](apps/models/app/icon.svg) — Next.js file-convention icon, picked up automatically.

Visual direction (approved Concept 1):

- W/M monogram drawn as a single stroked path so it reads as W upright and as M when flipped vertically.
- Blue → violet linear gradient: `#2563EB → #7C3AED`. Five filled nodes sit at the joints; one smaller accent node above the central peak hints at the network/intelligence layer.
- Wordmark: "WebmasterID Models" with "Models" tinted by the gradient. Optional descriptor "AI Model Infrastructure Intelligence" available on the `full` variant when height permits.
- No glow, no drop shadow, no neon. Clean light-enterprise feel.

This is a **first-party brand asset**. It is authored in this repository and is safe to redistribute alongside the codebase. It does not require trademark clearance because no third-party brand is referenced. The footer trademark / non-affiliation disclaimer still applies to every provider logo / lettermark in `public/brands/`.

`check:production` enforces that the four logo files and the `<Logo>` component exist and that both `SiteHeader` and `SiteFooter` render the component.

---



Rules governing every provider logo, badge, and brand mark used on
WebmasterID Models.

The goal is the same as the verification policy that governs metrics:
**no asset is shown unless its provenance is recorded and the license is
respected.** Visual placeholders are clearly labelled as
"lettermarks" — they are never described as official.

---

## Where logos come from

Every asset in [`apps/models/public/brands/`](apps/models/public/brands/)
is one of:

1. **`lettermark`** — authored in-repo by the WebmasterID Models team
   as a generic placeholder (gradient square with provider initials).
   Not a vendor brand mark; never claims to be.
2. **`nominative`** — in-repo SVG recreation of the vendor's
   publicly recognizable symbol, used for identification purposes
   only under nominative fair use. NOT downloaded from any vendor
   page, NOT trademark-cleared, and NOT represented as official. The
   site-wide footer disclaimer applies. Removable on vendor request.
3. **`open_source`** — sourced from an open-licensed icon package
   (e.g. simple-icons) where the license is permissive and
   attribution requirements are honoured.
4. **`official`** — taken from the vendor's own brand / press
   resource page, with the source URL and the date of the manual
   review recorded in [`apps/models/data/brand-assets.ts`](apps/models/data/brand-assets.ts).
5. **`none`** — no file is registered; the UI falls back to the
   programmatic gradient lettermark via `<ProviderLogoBadge>`.

The current tier for every tracked provider is **`nominative`**. The
in-repo SVGs are visually accurate recreations sized for the existing
`<ProviderLogo>` slot. The `alt` text says "(identification mark)" so
screen readers know the visual is not a downloaded official asset.

Upgrading any single provider to tier `official` requires a manual
browser pass against that vendor's brand resource page (see the
checklist below).

---

## License / usage notes per provider

| Slug | Tier | License note |
| --- | --- | --- |
| `openai` | nominative | In-repo SVG recreation; identification use only. Not an official OpenAI mark. |
| `anthropic` | nominative | In-repo SVG recreation; identification use only. Not an official Anthropic mark. |
| `google` | nominative | In-repo SVG recreation; identification use only. Not an official Google mark. |
| `meta` | nominative | In-repo SVG recreation; identification use only. Not an official Meta mark. |
| `mistral` | nominative | In-repo SVG recreation; identification use only. Not an official Mistral mark. |
| `deepseek` | nominative | In-repo SVG recreation; identification use only. Not an official DeepSeek mark. |
| `groq` | nominative | In-repo SVG recreation; identification use only. Not an official Groq mark. |
| `together-ai` | nominative | In-repo SVG recreation; identification use only. Not an official Together AI mark. |

If a vendor requests removal of their nominative mark, switch that
provider's `brandAsset.type` to `lettermark` (re-render the gradient
placeholder) and remove the SVG. The `<ProviderLogo>` fallback handles
either tier without UI changes.

---

## Trademark disclaimer

The following disclaimer appears in the site-wide footer:

> Provider names and logos are trademarks of their respective owners.
> WebmasterID Models is an independent intelligence platform and is not
> affiliated with or endorsed by listed providers.

The disclaimer ships on every page. It is the textual counterpart of
the per-asset `brandAsset.type` metadata.

---

## Implication of partnership

Rendering a brand mark on this site **never** implies:

- partnership with the provider
- endorsement by the provider
- certification by the provider
- official representation of the provider

Even an `official` tier asset, sourced under a permissive brand
guideline, is shown only to identify the entity being documented.

If a provider requests removal of their brand from WebmasterID Models,
that request will be honoured by switching the tier to `none` and the
UI will fall back to the programmatic lettermark.

---

## Manual review checklist (for upgrading an asset to `official`)

- [ ] The asset lives on the vendor's own domain under a brand /
  press / media resource page.
- [ ] The page explicitly permits third-party use for
  identification / reference purposes (most major vendor brand pages
  do; read the specific terms).
- [ ] The asset has been downloaded into
  `apps/models/public/brands/<slug>.svg` (no hotlinking; never embed a
  remote URL).
- [ ] [`apps/models/data/brand-assets.ts`](apps/models/data/brand-assets.ts)
  is updated:
  - `type` is set to `"official"` (or `"open_source"` if from an
    icon package).
  - `sourceUrl` points at the brand resource page where the asset was
    retrieved.
  - `licenseNote` summarises the relevant brand guideline (verbatim
    quote of the permitted use clause is ideal).
  - `attributionRequired` reflects what the license requires.
  - `retrievedAt` is the ISO datetime of the manual review.
- [ ] The footer trademark disclaimer is still present and accurate.
- [ ] `npm run check:production` passes.

---

## Sprint 7 brand-asset review log (2026-05-20)

**Outcome: no asset upgraded.** All eight providers remain at tier
`lettermark`. The review attempts and findings below explain why.

| Provider | URL targeted | Outcome | Finding |
| --- | --- | --- | --- |
| Anthropic | `https://www.anthropic.com/brand` | 404 | Canonical `/brand` path is not currently published. General public knowledge of Anthropic's brand policy suggests commercial use of the wordmark requires explicit permission; identification/editorial use is generally permitted but **not yet confirmed against an Anthropic-hosted page from this environment**. Asset stays `lettermark` until the canonical brand resource page is identified and its terms read in a browser. |
| Google | _not attempted_ | — | Google's brand guidelines historically require permission for most non-Google uses. Skipped this sprint pending a manual review pass. |
| OpenAI | _not attempted_ | — | OpenAI's docs site already returns 403 to automated retrieval (see VERIFICATION.md). Brand-asset review deferred to the same manual browser pass. |

**Why no asset was upgraded:** under the project's "only if legally
safe" rule, an upgrade requires both (a) the actual brand resource
page reviewed in a browser, and (b) confirmation that identification
use by a commercial intelligence platform is explicitly permitted. The
current environment cannot satisfy (a) for any of the eight providers
without a human browser pass.

This conservative outcome is **intentional**: the lettermarks are
visually neutral and clearly labelled as not-official in both the
`<ProviderLogo>` `alt` text and the `data-brand-asset-type` attribute.
A future sprint can replace one or more assets after a human review
following the checklist above.

---

## Fallback strategy

`<ProviderLogo>` first looks up the registered asset. If `path` is set,
it renders an `<img>` with strict alt text. If `path` is `null`, it
falls back to `<ProviderLogoBadge>`, which renders the same lettermark
treatment as the SVG files via Tailwind gradients. Both code paths
preserve accessibility and consistent visual weight, so a missing
official mark is not visually treated as "absence of partnership."

This is intentional: WebmasterID Models is independent of every listed
provider, and the UI should not subtly suggest otherwise.
