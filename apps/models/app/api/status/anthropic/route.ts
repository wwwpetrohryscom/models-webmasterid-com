/**
 * /api/status/anthropic
 *
 * Returns a single, freshly-issued `StatusObservation` against
 * Anthropic's vendor status feed. The response is intentionally
 * single-shot: no aggregation, no uptime calculation, no SLA claim.
 *
 * The endpoint always returns HTTP 200 with a normalised observation.
 * If the upstream is unreachable or returns a non-OK response, the
 * observation reports `observedStatus: "unknown"` and the failure
 * details are captured in `httpStatus`, `latencyMs`, and `note`.
 */

import { NextResponse } from "next/server";
import { anthropicStatusObserver } from "@/lib/observers/anthropic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const observation = await anthropicStatusObserver.run();
  return NextResponse.json(
    {
      ...observation,
      kind: "status-observation",
      disclaimer:
        "Vendor-reported status observed by WebmasterID. Not an independent uptime probe; no SLA or availability claim is implied.",
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
