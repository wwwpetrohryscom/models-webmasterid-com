/**
 * Shared HTTP handler bodies for the status API routes.
 *
 * Sprint 12B made every status route — the literal anthropic/google
 * routes and the dynamic `[provider]` route — share a single
 * implementation by routing through the helpers in this module. The
 * dynamic and literal route files are thin shells that pull a slug
 * from their params (or hardcode it) and call into here.
 *
 * The helpers return `NextResponse`s directly, so semantics (status
 * codes, cache headers, disclaimer strings) cannot drift between the
 * literal-segment and dynamic-segment routes.
 */

import { NextResponse } from "next/server";
import { findObserversForProvider } from "@/lib/observers";
import { getStatusStore } from "@/lib/status-store";
import type {
  StatusObservation,
  StatusObservationSource,
} from "@/lib/status-observations";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" } as const;

const STATUS_DISCLAIMER =
  "Vendor-reported observations and independent HTTP probes coexist in this payload; each observation's `source` field distinguishes them. No SLA, availability, or request-latency claim is implied.";

const LATEST_DISCLAIMER =
  "Persisted observations from cron writes. Vendor-reported and independent-probe observations are stored together; each carries its own `source` field. No SLA or availability claim is implied.";

const WINDOW_DISCLAIMER =
  "Persisted observations from cron writes. `uptimePercentage`, when populated, is the share of stored observations whose status was `operational` — NOT an independently-measured availability percentage. Probe wall-clock time is NOT relabelled as the provider's request latency. No SLA claim is implied.";

const DEFAULT_HOURS = 24;
const MIN_HOURS = 1;
const MAX_HOURS = 720;

export function parseWindowHours(input: string | null): number {
  if (!input) return DEFAULT_HOURS;
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n)) return DEFAULT_HOURS;
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, n));
}

/** Runs every observer for the slug, never throws. */
export async function handleStatusObservation(providerSlug: string) {
  const observers = findObserversForProvider(providerSlug);
  if (observers.length === 0) {
    return NextResponse.json(
      {
        error: `No status observer registered for provider "${providerSlug}".`,
        providerSlug,
        observations: [],
      },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  const observations: StatusObservation[] = await Promise.all(
    observers.map(async (o) => {
      try {
        return await o.run();
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : "unknown observer failure";
        return {
          providerSlug: o.providerSlug,
          source: "vendor_status_api",
          observedStatus: "unknown",
          observedAt: new Date().toISOString(),
          sourceUrl: "",
          responseOk: false,
          note: `Observer threw: ${reason}`,
        } satisfies StatusObservation;
      }
    })
  );

  return NextResponse.json(
    {
      providerSlug,
      observerCount: observers.length,
      observations,
      disclaimer: STATUS_DISCLAIMER,
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}

/** Returns most-recent persisted observation or a clear empty state. */
export async function handleStatusLatest(providerSlug: string) {
  if (findObserversForProvider(providerSlug).length === 0) {
    return NextResponse.json(
      {
        error: `No status observer registered for provider "${providerSlug}".`,
        providerSlug,
      },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  const store = getStatusStore();
  const [latest, sampleCount] = await Promise.all([
    store.getLatestObservation(providerSlug),
    store.getProviderObservationCount(providerSlug),
  ]);

  return NextResponse.json(
    {
      providerSlug,
      storageConfigured: store.isConfigured,
      storageAdapter: store.adapterName,
      sampleCount,
      latest,
      empty: latest === null,
      disclaimer: LATEST_DISCLAIMER,
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );
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
    if (
      !e.latest ||
      Date.parse(o.observedAt) > Date.parse(e.latest.observedAt)
    ) {
      e.latest = o;
    }
    map.set(o.source, e);
  }
  return Array.from(map.values());
}

/** Returns a windowed view of persisted observations + bySource breakdown. */
export async function handleStatusWindow(
  providerSlug: string,
  hours: number
) {
  if (findObserversForProvider(providerSlug).length === 0) {
    return NextResponse.json(
      {
        error: `No status observer registered for provider "${providerSlug}".`,
        providerSlug,
      },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  const store = getStatusStore();
  const window = await store.getObservationWindow(providerSlug, { hours });

  return NextResponse.json(
    {
      ...window,
      bySource: groupBySource(window.observations),
      storageAdapter: store.adapterName,
      disclaimer: WINDOW_DISCLAIMER,
    },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
