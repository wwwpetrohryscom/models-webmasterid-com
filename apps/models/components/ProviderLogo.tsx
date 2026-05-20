import Image from "next/image";
import { getBrandAsset } from "@/data/brand-assets";
import { ProviderLogoBadge } from "./ProviderLogoBadge";

/**
 * Renders the registered brand asset for a provider with strict
 * provenance rules:
 *   - If a file path is registered (lettermark / open_source / official),
 *     render an <img> with accurate alt text and `aria-label`.
 *   - Otherwise, fall back to the programmatic <ProviderLogoBadge>
 *     gradient lettermark.
 *
 * The visual treatment is intentionally identical across asset tiers so
 * a missing official mark does not visually imply absence of partnership.
 * The asset's tier is exposed as `data-brand-asset-type` for diagnostics
 * but not as a visual signal to readers.
 */
export function ProviderLogo({
  slug,
  name,
  size = "md",
}: {
  slug: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const asset = getBrandAsset(slug);
  const px = size === "sm" ? 24 : size === "lg" ? 40 : 32;
  const className =
    size === "sm"
      ? "h-6 w-6 rounded-lg"
      : size === "lg"
        ? "h-10 w-10 rounded-xl"
        : "h-8 w-8 rounded-lg";

  if (!asset.path) {
    return <ProviderLogoBadge slug={slug} name={name} size={size} />;
  }

  const altText =
    asset.type === "lettermark"
      ? `${name} (lettermark)`
      : `${name} logo`;

  return (
    <Image
      src={asset.path}
      alt={altText}
      aria-label={altText}
      width={px}
      height={px}
      className={className}
      data-brand-asset-type={asset.type}
      unoptimized
    />
  );
}
