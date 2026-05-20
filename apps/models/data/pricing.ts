import type { PricingEntity } from "@/lib/types";
import { models } from "./models";

export const pricing: PricingEntity[] = models.map((m) => ({
  id: `pricing-${m.slug}`,
  slug: m.slug,
  name: `${m.name} pricing`,
  description: `API pricing entry for ${m.name}. Unverified rates are intentionally omitted.`,
  modelSlug: m.slug,
  tiers: m.pricing,
  currency: "USD" as const,
  sourceUrl: m.sourceUrl ?? null,
  verified: m.verified,
  verificationStatus: m.verificationStatus,
  lastCheckedAt: m.lastCheckedAt,
  updatedDate: m.updatedDate,
}));
