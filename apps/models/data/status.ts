import type { StatusEntity } from "@/lib/types";
import { providers } from "./providers";

export const status: StatusEntity[] = providers.map((p) => ({
  id: `status-${p.slug}`,
  slug: p.slug,
  name: `${p.name} status`,
  description: `Operational status for ${p.name}. Not yet independently monitored by WebmasterID.`,
  providerSlug: p.slug,
  status: "unknown" as const,
  lastIncidentDate: null,
  sourceUrl: p.sourceUrl ?? null,
  verified: false,
  verificationStatus: "unverified" as const,
  lastCheckedAt: null,
  updatedDate: "2026-05-20",
}));
