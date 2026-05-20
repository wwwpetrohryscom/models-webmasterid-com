import type { PricingEntity } from "@/lib/types";
import { models } from "./models";

export const pricing: PricingEntity[] = models.map((m) => ({
  id: `pricing-${m.slug}`,
  slug: m.slug,
  name: `${m.name} pricing`,
  description: `API pricing entry for ${m.name}. Not yet independently verified.`,
  modelSlug: m.slug,
  tiers: m.pricing,
  currency: "USD" as const,
  sourceUrl: m.sourceUrl ?? null,
  verified: false,
  verificationStatus: "unverified" as const,
  lastCheckedAt: null,
  updatedDate: "2026-05-20",
}));
