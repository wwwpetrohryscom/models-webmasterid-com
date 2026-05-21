/**
 * /api/status/[provider]
 *
 * Runs every enabled observer for the requested provider and returns
 * the freshly-issued `StatusObservation`(s) without touching the
 * durable store. This is the "fire one observation now" endpoint, used
 * for debugging and as a UI deep-link.
 *
 * Behaviour:
 *   - If the slug has no registered observer, return HTTP 404 with a
 *     clear empty body.
 *   - If observers exist, run them all (in parallel) and return the
 *     array of observations, never throwing.
 *   - Each `StatusObservation` carries its own `source` so vendor-
 *     reported and independent-probe results are not conflated.
 *
 * This endpoint is NOT a vendor-replacement status page. Callers must
 * surface the vendor-reported observations as vendor-reported, and the
 * probe observations as probes; relabelling either as availability is a
 * policy violation enforced by the integrity guard suite.
 */

import { NextResponse } from "next/server";
import { findObserversForProvider } from "@/lib/observers";
import type { StatusObservation } from "@/lib/status-observations";

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
  const observers = findObserversForProvider(provider);
  if (observers.length === 0) {
    return NextResponse.json(
      {
        error: `No status observer registered for provider "${provider}".`,
        providerSlug: provider,
        observations: [],
      },
      { status: 404, headers: { "Cache-Control": "no-store" } }
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
      providerSlug: provider,
      observerCount: observers.length,
      observations,
      disclaimer:
        "Vendor-reported observations and independent HTTP probes coexist in this payload; each observation's `source` field distinguishes them. No SLA, availability, or API-latency claim is implied.",
    },
    { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
