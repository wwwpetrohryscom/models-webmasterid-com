import type { ComparisonEntity } from "./types";
import { comparisons } from "@/data/comparisons";
import { getModelBySlug } from "@/data/models";
import { providers } from "@/data/providers";

/**
 * Comparison cluster map.
 *
 * Sprint 22 groups verified comparisons by the providers they touch
 * so the /compare hub and /intelligence workspace can render the
 * graph without a visualization library. Pure local derivation —
 * no fetch, no Date.now(), no mutation.
 *
 * Clustering rule: a comparison appears in a cluster for every
 * provider it involves. Mistral × Anthropic comparisons therefore
 * appear in both the Mistral cluster and the Anthropic cluster.
 * That mirrors the user's mental model — readers come to /compare
 * looking for either side.
 */
export interface ComparisonCluster {
  providerSlug: string;
  providerName: string;
  comparisons: ComparisonEntity[];
  twoSidedVerified: number;
  oneSidedVerified: number;
  pending: number;
}

interface CoverageSummary {
  totalClusters: number;
  totalComparisons: number;
  twoSidedVerified: number;
  oneSidedVerified: number;
  pending: number;
}

function providerForModel(modelSlug: string): string | undefined {
  return getModelBySlug(modelSlug)?.providerSlug;
}

function isVerifiedSide(modelSlug: string): boolean {
  return (
    getModelBySlug(modelSlug)?.verificationStatus === "verified"
  );
}

export function getComparisonClusters(): ComparisonCluster[] {
  const byProvider = new Map<string, ComparisonEntity[]>();
  for (const c of comparisons) {
    const slugs = new Set<string>();
    const a = providerForModel(c.modelA);
    const b = providerForModel(c.modelB);
    if (a) slugs.add(a);
    if (b) slugs.add(b);
    for (const slug of slugs) {
      const arr = byProvider.get(slug) ?? [];
      arr.push(c);
      byProvider.set(slug, arr);
    }
  }
  // Render in catalogue order so the UI stays stable.
  const result: ComparisonCluster[] = [];
  for (const p of providers) {
    const arr = byProvider.get(p.slug);
    if (!arr || arr.length === 0) continue;
    let two = 0;
    let one = 0;
    let pending = 0;
    for (const c of arr) {
      const va = isVerifiedSide(c.modelA);
      const vb = isVerifiedSide(c.modelB);
      if (va && vb) two += 1;
      else if (va || vb) one += 1;
      else pending += 1;
    }
    result.push({
      providerSlug: p.slug,
      providerName: p.name,
      comparisons: arr,
      twoSidedVerified: two,
      oneSidedVerified: one,
      pending,
    });
  }
  return result;
}

export function getTwoSidedVerifiedComparisons(): ComparisonEntity[] {
  return comparisons.filter(
    (c) => isVerifiedSide(c.modelA) && isVerifiedSide(c.modelB)
  );
}

export function getComparisonsByProvider(
  providerSlug: string
): ComparisonEntity[] {
  return comparisons.filter((c) => {
    const a = providerForModel(c.modelA);
    const b = providerForModel(c.modelB);
    return a === providerSlug || b === providerSlug;
  });
}

export function getComparisonCoverageSummary(): CoverageSummary {
  const clusters = getComparisonClusters();
  const twoSidedVerified = comparisons.filter(
    (c) => isVerifiedSide(c.modelA) && isVerifiedSide(c.modelB)
  ).length;
  const oneSidedVerified = comparisons.filter(
    (c) =>
      (isVerifiedSide(c.modelA) || isVerifiedSide(c.modelB)) &&
      !(isVerifiedSide(c.modelA) && isVerifiedSide(c.modelB))
  ).length;
  const pending = comparisons.filter(
    (c) => !isVerifiedSide(c.modelA) && !isVerifiedSide(c.modelB)
  ).length;
  return {
    totalClusters: clusters.length,
    totalComparisons: comparisons.length,
    twoSidedVerified,
    oneSidedVerified,
    pending,
  };
}
