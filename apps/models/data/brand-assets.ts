/**
 * Provider brand assets.
 *
 * Policy (see BRAND_ASSETS.md):
 *   - We never claim an asset is "official" without a verified source URL
 *     pointing at the vendor's own brand/press page.
 *   - We do not hotlink third-party hosts and we do not scrape restricted
 *     assets. Files in /public/brands/ live in this repository and are
 *     either authored by us (lettermarks) or imported from an
 *     open-licensed source with attribution recorded below.
 *   - Rendering a brand mark NEVER implies partnership or endorsement.
 *     The site-wide footer carries the trademark disclaimer.
 */

export type BrandAssetType =
  | "official"
  | "open_source"
  | "lettermark"
  | "none";

export interface BrandAsset {
  /** Provenance tier. */
  type: BrandAssetType;
  /** Path under /public, or null when we render a programmatic fallback. */
  path: string | null;
  /** Where the asset was retrieved from. Required when type === "official". */
  sourceUrl: string | null;
  /** Human-readable license / usage note. */
  licenseNote: string;
  /** Whether the license requires visible attribution at the use site. */
  attributionRequired: boolean;
  /** ISO datetime stamped at manual review. */
  retrievedAt?: string;
}

/**
 * Lettermarks authored in-repo. The same gradient palette as the
 * <ProviderLogoBadge> fallback, but committed as static SVG so the
 * <ProviderLogo> component can render an actual image element with
 * proper alt text and so the asset survives runtime gradient changes.
 *
 * These are NOT vendor brand marks. They are placeholders so the UI is
 * not blank until each vendor's official brand resource page is
 * reviewed and a licensed file is added.
 */
const lettermark = (path: string): BrandAsset => ({
  type: "lettermark",
  path,
  sourceUrl: null,
  licenseNote:
    "Internally authored lettermark. Not an official vendor brand mark.",
  attributionRequired: false,
  retrievedAt: "2026-05-20T00:00:00.000Z",
});

export const brandAssets: Record<string, BrandAsset> = {
  openai: lettermark("/brands/openai.svg"),
  anthropic: lettermark("/brands/anthropic.svg"),
  google: lettermark("/brands/google.svg"),
  meta: lettermark("/brands/meta.svg"),
  mistral: lettermark("/brands/mistral.svg"),
  deepseek: lettermark("/brands/deepseek.svg"),
  groq: lettermark("/brands/groq.svg"),
  "together-ai": lettermark("/brands/together-ai.svg"),
};

export function getBrandAsset(providerSlug: string): BrandAsset {
  return (
    brandAssets[providerSlug] ?? {
      type: "none",
      path: null,
      sourceUrl: null,
      licenseNote: "No brand asset registered for this provider yet.",
      attributionRequired: false,
    }
  );
}
