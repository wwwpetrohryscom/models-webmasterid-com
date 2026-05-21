/**
 * /api/cron/status
 *
 * Runs every enabled status observer in `lib/observers` and returns a
 * JSON summary of the resulting `StatusObservation`s. Designed to be
 * invoked by Vercel Cron, but also safe to call manually for debugging.
 *
 * Authentication policy:
 *   - If `CRON_SECRET` is set, the request must carry
 *     `Authorization: Bearer <CRON_SECRET>` (this matches Vercel Cron's
 *     own behaviour when the env var is configured on the project).
 *   - If `CRON_SECRET` is NOT set:
 *       * In Vercel production (`VERCEL_ENV === "production"`), the
 *         endpoint returns 503 with a clear message so that a misconfig
 *         cannot accidentally expose an unguarded cron in production.
 *       * In non-production environments, the endpoint runs unguarded
 *         so local development and preview deploys remain ergonomic.
 *
 * The endpoint NEVER throws unhandled errors — each observer's failure
 * is captured inside its own `StatusObservation`.
 */

import { NextResponse } from "next/server";
import { ENABLED_OBSERVERS } from "@/lib/observers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuthResult =
  | { ok: true }
  | { ok: false; status: number; reason: string };

function authorize(req: Request): AuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.VERCEL_ENV === "production") {
      return {
        ok: false,
        status: 503,
        reason:
          "CRON_SECRET is not configured on this deployment; refusing to run an unguarded cron in production.",
      };
    }
    return { ok: true };
  }
  const header = req.headers.get("authorization") ?? "";
  if (header === `Bearer ${secret}`) return { ok: true };
  return { ok: false, status: 401, reason: "Invalid or missing bearer token." };
}

export async function GET(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) {
    return NextResponse.json(
      {
        error: auth.reason,
        runAt: new Date().toISOString(),
        observations: [],
      },
      { status: auth.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const observations = await Promise.all(
    ENABLED_OBSERVERS.map(async (o) => {
      try {
        return await o.run();
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : "unknown observer failure";
        return {
          providerSlug: o.providerSlug,
          source: "vendor_status_api" as const,
          observedStatus: "unknown" as const,
          observedAt: new Date().toISOString(),
          sourceUrl: "",
          responseOk: false,
          note: `Observer threw: ${reason}`,
        };
      }
    })
  );

  return NextResponse.json(
    {
      runAt: new Date().toISOString(),
      observerCount: ENABLED_OBSERVERS.length,
      observations,
      disclaimer:
        "Vendor-reported observations only. Independent HTTP probes are not yet enabled. No uptime percentage, SLA, or availability claim is implied by this payload.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
