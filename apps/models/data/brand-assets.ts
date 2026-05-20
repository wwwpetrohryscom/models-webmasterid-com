/**
 * Provider brand assets.
 *
 * Policy (see BRAND_ASSETS.md):
 *   - We never claim an asset is "official" without a verified source URL
 *     pointing at the vendor's own brand/press page.
 *   - We do not hotlink third-party hosts and we do not scrape restricted
 *     assets. Files in /public/brands/ live in this repository and are
 *     either authored by us (lettermarks), or visually accurate
 *     in-repo recreations of each vendor's public mark used for
 *     identification purposes only (nominative), or downloaded from a
 *     legally permissive source with provenance recorded (open_source /
 *     official).
 *   - Rendering a brand mark NEVER implies partnership or endorsement.
 *     The site-wide footer carries the trademark disclaimer.
 */

export type BrandAssetType =
  | "official"
  | "open_source"
  | "nominative"
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
 * Nominative-use brand mark: a visually accurate, in-repo SVG recreation
 * of the vendor's recognizable symbol, used here only to identify the
 * vendor being documented. Not downloaded from any vendor page, not
 * trademark-cleared for commercial reuse, and not represented as
 * official. The site-wide footer carries the non-affiliation disclaimer
 * that applies to every nominative mark on this site.
 */
const nominative = (
  path: string,
  vendorName: string
): BrandAsset => ({
  type: "nominative",
  path,
  sourceUrl: null,
  licenseNote: `Nominative-use identification mark for ${vendorName}. In-repo SVG recreation based on the vendor's publicly recognizable symbol. Not an official asset; ${vendorName} retains all trademark rights to its actual mark. Used for identification of the entity being documented, not endorsement.`,
  attributionRequired: false,
  retrievedAt: "2026-05-20T00:00:00.000Z",
});

export const brandAssets: Record<string, BrandAsset> = {
  openai: nominative("/brands/openai.svg", "OpenAI"),
  anthropic: nominative("/brands/anthropic.svg", "Anthropic"),
  google: nominative("/brands/google.svg", "Google"),
  meta: nominative("/brands/meta.svg", "Meta"),
  mistral: nominative("/brands/mistral.svg", "Mistral"),
  deepseek: nominative("/brands/deepseek.svg", "DeepSeek"),
  groq: nominative("/brands/groq.svg", "Groq"),
  "together-ai": nominative("/brands/together-ai.svg", "Together AI"),
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
