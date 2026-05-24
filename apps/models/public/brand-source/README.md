# Brand source assets

This directory holds the **canonical source files** for the AiModels
WebmasterID product brand mark. The repo's live SVG assets in
`apps/models/public/logo*.svg` are **vector recreations** based on the
source files here.

## Expected file

The user-provided official logo lives at:

```
apps/models/public/brand-source/aimodels-webmasterid-logo-official.jpg
```

(or `.png`, `.svg`, `.ai`, etc. — whatever format the original was
delivered in). If the file is missing from a fresh checkout, drop the
official source here. The build does not depend on it; it is the
authoritative reference for any future re-derivation.

## Why the SVGs in `public/` are recreations

The Brand Sprint that promoted this design recreated the mark as
SVG from the user-provided raster image. Vector geometry was
approximated by eye — the rounded square tile, gradient stops
(`#1E5BC7` → `#2BA6C6` → `#3DD68A`), the white Wi-Fi arcs, the W
stroke, and the wordmark proportions — not exported from the
original design tool.

If you have the **original vector source** (Figma export, Illustrator
SVG, etc.), the right move is:

1. Drop the original into this directory under the canonical filename.
2. Re-export a clean SVG from the original tool into:
   - `apps/models/public/logo-mark.svg` (icon-only, 64×64 viewBox)
   - `apps/models/public/logo.svg` (full lockup, ~360×96 viewBox)
   - `apps/models/public/logo-mono.svg` (single-colour, uses
     `currentColor`)
3. Update `apps/models/components/Logo.tsx` if the inline rendering
   needs to track the new vector geometry.
4. Run `npm run check:production` to confirm the brand integrity
   guards still pass.

## What this directory should never contain

- Any third-party provider logo (Anthropic, OpenAI, Google, Meta,
  Mistral, DeepSeek, Groq, Together AI, etc.). Provider lettermarks
  live in `apps/models/public/brands/` and are governed by
  [`BRAND_ASSETS.md`](../../../../BRAND_ASSETS.md).
- Marketing PSDs or large binaries. Keep this directory limited to
  the canonical source(s) of the AiModels WebmasterID identity.
