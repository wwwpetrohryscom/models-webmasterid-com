import type { ComparisonEntity, ModelEntity } from "./types";

/**
 * Indexing policy. Centralised here so robots, sitemap, and per-page
 * metadata agree on which routes are substantial enough to surface in
 * search engines and AI crawlers.
 *
 * Rules:
 *   - Index strong hub pages (the homepage, structured catalogues, docs).
 *   - Index per-model pages — even with unverified metrics they carry
 *     stable entity identity, verification status, and outbound citations.
 *   - Index per-comparison pages only when at least one of the two
 *     compared models is itself verified. A comparison between two
 *     unverified rows is thin.
 *   - Noindex placeholder pages that are intentionally empty (news,
 *     research, status). They stay reachable but do not pollute search.
 */

const STATIC_INDEXABLE = new Set<string>([
  "/",
  "/models",
  "/providers",
  "/compare",
  "/benchmarks",
  "/pricing",
  "/infrastructure",
  "/docs",
  "/coverage",
  "/sources",
]);

const STATIC_NOINDEX = new Set<string>([
  "/news",
  "/research",
  "/status",
]);

export function shouldIndexStaticRoute(path: string): boolean {
  if (STATIC_INDEXABLE.has(path)) return true;
  if (STATIC_NOINDEX.has(path)) return false;
  // Unknown paths default to true so new hubs don't accidentally become
  // unreachable, but each new route should still register itself above.
  return true;
}

export function shouldIndexModel(model: ModelEntity): boolean {
  // Catalogue entries are useful even when metrics are unverified — they
  // still carry stable entity identity, provider attribution, and
  // verification metadata. Only suppress if the entity itself is missing
  // a name / description, which the type system already prevents.
  return Boolean(model.slug && model.name && model.description);
}

export function shouldIndexComparison(
  comparison: ComparisonEntity,
  modelA: ModelEntity | undefined,
  modelB: ModelEntity | undefined
): boolean {
  if (!modelA || !modelB) return false;
  const oneVerified =
    modelA.verificationStatus === "verified" ||
    modelB.verificationStatus === "verified";
  return oneVerified;
}

export function robotsMetadata(indexable: boolean) {
  return indexable
    ? { index: true, follow: true }
    : { index: false, follow: true };
}
