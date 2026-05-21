/**
 * /api/status/anthropic/latest
 *
 * Returns the most recent persisted `StatusObservation` for Anthropic,
 * or a clear empty state when no observation has been stored.
 *
 * The payload always includes `storageConfigured` so a caller can tell
 * whether absence-of-data means "no cron has run yet" vs "no storage is
 * wired on this deployment". Sample count is included as a cheap hint
 * for the read endpoint at /window — no uptime percentage is computed
 * here (that gating lives in /api/status/<slug>/window).
 *
 * This endpoint never returns a vendor-reported indicator as if it were
 * an availability measurement. The `disclaimer` field is always
 * present.
 */

import { NextResponse } from "next/server";
import { getStatusStore } from "@/lib/status-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PROVIDER_SLUG = "anthropic";

export async function GET() {
  const store = getStatusStore();
  const [latest, sampleCount] = await Promise.all([
    store.getLatestObservation(PROVIDER_SLUG),
    store.getProviderObservationCount(PROVIDER_SLUG),
  ]);

  return NextResponse.json(
    {
      providerSlug: PROVIDER_SLUG,
      storageConfigured: store.isConfigured,
      storageAdapter: store.adapterName,
      sampleCount,
      latest,
      empty: latest === null,
      disclaimer:
        "Vendor-reported status observed by WebmasterID. Not an independent uptime probe; no SLA, availability, or latency claim is implied by this payload.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
