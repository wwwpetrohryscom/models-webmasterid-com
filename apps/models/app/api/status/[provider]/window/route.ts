/**
 * /api/status/[provider]/window
 *
 * Returns a windowed view of persisted observations for the requested
 * provider. Default window is 24 hours, configurable via
 * `?hours=<n>` (clamped to [1, 720]).
 *
 * Multi-source semantics: the response includes a `bySource` breakdown
 * (counts and most-recent observation per source) so consumers can see
 * vendor-reported and independent-probe signals side by side. The
 * top-level `uptimePercentage` field continues to follow the gating
 * policy in lib/status-store.ts — it is null unless durable storage is
 * configured AND `sampleCount >= MINIMUM_OBSERVATIONS_FOR_UPTIME` AND
 * even then it reports the share of stored observations whose status
 * was `operational`, not an independent availability percentage.
 *
 * Probe-success rate is NOT relabelled as request latency or availability.
 */

import { NextResponse } from "next/server";
import { findObserversForProvider } from "@/lib/observers";
import { getStatusStore } from "@/lib/status-store";
import type {
  StatusObservation,
  StatusObservationSource,
} from "@/lib/status-observations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_HOURS = 24;
const MIN_HOURS = 1;
const MAX_HOURS = 720;

interface RouteParams {
  provider: string;
}

function parseHours(input: string | null): number {
  if (!input) return DEFAULT_HOURS;
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n)) return DEFAULT_HOURS;
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, n));
}

interface BySourceEntry {
  source: StatusObservationSource;
  count: number;
  latest: StatusObservation | null;
}

function groupBySource(
  observations: StatusObservation[]
): BySourceEntry[] {
  const map = new Map<StatusObservationSource, BySourceEntry>();
  for (const o of observations) {
    const e = map.get(o.source) ?? {
      source: o.source,
      count: 0,
      latest: null,
    };
    e.count += 1;
    if (!e.latest || Date.parse(o.observedAt) > Date.parse(e.latest.observedAt)) {
      e.latest = o;
    }
    map.set(o.source, e);
  }
  return Array.from(map.values());
}

export async function GET(
  req: Request,
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

  const url = new URL(req.url);
  const hours = parseHours(url.searchParams.get("hours"));

  const store = getStatusStore();
  const window = await store.getObservationWindow(provider, { hours });

  return NextResponse.json(
    {
      ...window,
      bySource: groupBySource(window.observations),
      storageAdapter: store.adapterName,
      disclaimer:
        "Persisted observations from cron writes. `uptimePercentage`, when populated, is the share of stored observations whose status was `operational` — NOT an independently-measured availability percentage. Probe wall-clock time is NOT relabelled as the provider's request latency. No SLA claim is implied.",
    },
    { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
