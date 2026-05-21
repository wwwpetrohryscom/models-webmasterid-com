/**
 * /api/status/anthropic/window
 *
 * Returns a windowed view of persisted Anthropic observations. Default
 * window is 24 hours, configurable via `?hours=<n>` (clamped to
 * [1, 720] — i.e. 1h to 30d, matching the bounded retention on the
 * store).
 *
 * Uptime gating policy (see lib/status-store.ts):
 *   - Requires durable storage to be configured.
 *   - Requires at least `MINIMUM_OBSERVATIONS_FOR_UPTIME` observations
 *     in the requested window.
 *   - Even when both gates pass, `uptimePercentage` is the share of
 *     stored observations whose status was `operational`. This is a
 *     vendor-reported-operational-sample rate, NOT an independent
 *     availability percentage; the field name matches the API spec but
 *     the `policyNote` makes the semantics explicit.
 *
 * When any gate fails, `uptimePercentage` is null and `policyNote`
 * explains exactly why.
 */

import { NextResponse } from "next/server";
import { getStatusStore } from "@/lib/status-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PROVIDER_SLUG = "anthropic";
const DEFAULT_HOURS = 24;
const MIN_HOURS = 1;
const MAX_HOURS = 720; // matches MAX_STORED_OBSERVATIONS_PER_PROVIDER

function parseHours(input: string | null): number {
  if (!input) return DEFAULT_HOURS;
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n)) return DEFAULT_HOURS;
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, n));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hours = parseHours(url.searchParams.get("hours"));

  const store = getStatusStore();
  const window = await store.getObservationWindow(PROVIDER_SLUG, { hours });

  return NextResponse.json(
    {
      ...window,
      storageAdapter: store.adapterName,
      disclaimer:
        "Vendor-reported observations only. `uptimePercentage`, when present, is the share of stored observations whose vendor-reported status was 'operational' — NOT an independently-measured availability percentage. No SLA claim is implied.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
