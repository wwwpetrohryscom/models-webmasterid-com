/**
 * /api/status/[provider]/latest
 *
 * Returns the most recent persisted `StatusObservation` for the
 * requested provider, or a clear empty state when no observation has
 * been stored.
 *
 * Notes on multi-source providers (e.g. Anthropic has BOTH a vendor-
 * status observer AND an independent HTTP probe): the `latest` field
 * holds whichever observation was written most recently across all
 * sources for the slug. To inspect both signals in time order, call
 * `/api/status/<slug>/window?hours=24` and filter by `source`.
 *
 * The payload always carries `storageConfigured` so callers can tell
 * whether absence-of-data means "no cron has run yet" vs "no storage is
 * wired on this deployment".
 */

import { NextResponse } from "next/server";
import { findObserversForProvider } from "@/lib/observers";
import { getStatusStore } from "@/lib/status-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  provider: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { provider } = await params;
  if (findObserversForProvider(provider).length === 0) {
    return NextResponse.json(
      {
        error: `No status observer registered for provider "${provider}".`,
        providerSlug: provider,
      },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const store = getStatusStore();
  const [latest, sampleCount] = await Promise.all([
    store.getLatestObservation(provider),
    store.getProviderObservationCount(provider),
  ]);

  return NextResponse.json(
    {
      providerSlug: provider,
      storageConfigured: store.isConfigured,
      storageAdapter: store.adapterName,
      sampleCount,
      latest,
      empty: latest === null,
      disclaimer:
        "Persisted observations from cron writes. Vendor-reported and independent-probe observations are stored together; each carries its own `source` field. No SLA or availability claim is implied.",
    },
    { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
